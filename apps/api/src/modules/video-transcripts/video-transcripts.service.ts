import { BadGatewayException, BadRequestException, Injectable } from "@nestjs/common";
import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { promisify } from "node:util";

type CaptionTrack={baseUrl:string;languageCode?:string;kind?:string;name?:{simpleText?:string;runs?:Array<{text?:string}>}};
type Segment={text:string;startMs:number;durationMs:number};
const userAgent="Mozilla/5.0 (compatible; VendaPlusTranscript/1.0; +https://vendamais-app.com)";
const run=promisify(execFile);
const strip=(value:string)=>value.replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim();
const timestamp=(milliseconds:number)=>{const seconds=Math.max(0,Math.floor(milliseconds/1000)),hours=Math.floor(seconds/3600),minutes=Math.floor((seconds%3600)/60),rest=seconds%60;return hours?`${String(hours).padStart(2,"0")}:${String(minutes).padStart(2,"0")}:${String(rest).padStart(2,"0")}`:`${String(minutes).padStart(2,"0")}:${String(rest).padStart(2,"0")}`;};

@Injectable()
export class VideoTranscriptsService {
  async create(input:{url:string;language?:string;authorized:boolean}) {
    if(!input.authorized) throw new BadRequestException("Confirme que você possui autorização para transcrever este vídeo.");
    const videoId=this.videoId(input.url);
    const html=await this.fetchText(`https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`);
    const tracks=this.captionTracks(html);
    if(!tracks.length)return this.transcribeAudio(videoId,input.language,this.title(html));
    const requested=input.language?.trim().toLowerCase();
    const track=tracks.find(item=>item.languageCode?.toLowerCase()===requested)||tracks.find(item=>item.languageCode?.toLowerCase().startsWith(requested?.split("-")[0]??""))||tracks.find(item=>item.kind!=="asr")||tracks[0];
    const source=await this.fetchText(`${track.baseUrl}${track.baseUrl.includes("?")?"&":"?"}fmt=json3`);
    let payload:any;
    try{payload=JSON.parse(source)}catch{throw new BadRequestException("Não foi possível interpretar as legendas deste vídeo.");}
    const segments:Segment[]=(Array.isArray(payload.events)?payload.events:[]).map((event:any):Segment=>{const text=strip((Array.isArray(event.segs)?event.segs:[]).map((part:any)=>part.utf8??"").join(""));return{text,startMs:Number(event.tStartMs??0),durationMs:Number(event.dDurationMs??0)};}).filter((item:Segment)=>item.text);
    if(!segments.length) throw new BadRequestException("As legendas públicas deste vídeo não contêm texto legível.");
    const title=this.title(html)||`Vídeo do YouTube · ${videoId}`;
    const language=track.languageCode??"und";
    const text=segments.map((item:Segment)=>`[${timestamp(item.startMs)}] ${item.text}`).join("\n");
    return{videoId,title,language,source:"LEGENDAS_PUBLICAS",segments:segments.map((item:Segment)=>({...item,timestamp:timestamp(item.startMs)})),text};
  }

  private async transcribeAudio(videoId:string, requestedLanguage?:string, videoTitle?:string){
    if(!process.env.OPENAI_API_KEY)throw new BadRequestException("A transcrição por áudio ainda não está configurada. Adicione OPENAI_API_KEY no arquivo deploy/vps/.env.production do servidor.");
    const directory=await fs.mkdtemp(join(tmpdir(),"vendamais-transcript-"));
    try{
      const source=join(directory,"source.%(ext)s"),url=`https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
      await this.command("yt-dlp",["--no-playlist","--no-warnings","--max-filesize","750M","-f","bestaudio[abr<=64]/bestaudio/best","-o",source,url],"Não foi possível obter o áudio deste vídeo. Confirme que ele está disponível e que sua autorização permite a transcrição.");
      const files=await fs.readdir(directory),original=files.find(file=>file.startsWith("source."));
      if(!original)throw new BadRequestException("Não foi possível localizar o áudio do vídeo.");
      const chunkPattern=join(directory,"chunk-%03d.mp3");
      await this.command("ffmpeg",["-y","-i",join(directory,original),"-vn","-ac","1","-ar","16000","-b:a","32k","-f","segment","-segment_time","600","-reset_timestamps","1",chunkPattern],"Não foi possível preparar o áudio para transcrição.");
      const chunks=(await fs.readdir(directory)).filter(file=>/^chunk-\d+\.mp3$/.test(file)).sort();
      if(!chunks.length)throw new BadRequestException("O vídeo não contém áudio que possa ser transcrito.");
      const parts:Array<{timestamp:string;text:string}>=[];
      for(const [index,file] of chunks.entries()){const audio=await fs.readFile(join(directory,file));if(audio.byteLength>24*1024*1024)throw new BadRequestException("Um trecho de áudio excedeu o limite de transcrição. Tente um vídeo menor.");parts.push({timestamp:timestamp(index*600_000),text:await this.openAiTranscript(audio,requestedLanguage,basename(file))});}
      const segments=parts.filter(item=>item.text);
      if(!segments.length)throw new BadRequestException("Não foi possível identificar fala no áudio deste vídeo.");
      const title=videoTitle||`Vídeo do YouTube · ${videoId}`,language=requestedLanguage?.trim()||"detectado automaticamente",text=segments.map(item=>`[${item.timestamp}] ${item.text}`).join("\n\n");
      return{videoId,title,language,source:"AUDIO",segments:segments.map((item,index)=>({text:item.text,startMs:index*600_000,durationMs:600_000,timestamp:item.timestamp})),text};
    }finally{await fs.rm(directory,{recursive:true,force:true});}
  }

  private async openAiTranscript(audio:Buffer,language:string|undefined,fileName:string){
    const form=new FormData();
    form.append("file",new Blob([Uint8Array.from(audio)],{type:"audio/mpeg"}),fileName);
    form.append("model","gpt-transcribe");
    if(language)form.append("languages[]",language);
    let response:Response;
    try{response=await fetch("https://api.openai.com/v1/audio/transcriptions",{method:"POST",headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`},body:form,signal:AbortSignal.timeout(120_000)});}catch{throw new BadGatewayException("O provedor de transcrição não respondeu. Tente novamente.");}
    const payload:any=await response.json().catch(()=>({}));
    if(!response.ok)throw new BadGatewayException(payload?.error?.message??"O provedor de transcrição não pôde processar o áudio.");
    return String(payload?.text??"").trim();
  }

  private async command(command:string,args:string[],message:string){try{await run(command,args,{timeout:15*60_000,maxBuffer:2_000_000});}catch{throw new BadRequestException(message);}}

  private videoId(raw:string){let url:URL;try{url=new URL(raw)}catch{throw new BadRequestException("Informe um link válido do YouTube.");}const host=url.hostname.toLowerCase().replace(/^www\./,"");let id="";if(host==="youtu.be")id=url.pathname.split("/").filter(Boolean)[0]??"";else if(["youtube.com","m.youtube.com"].includes(host)){id=url.searchParams.get("v")??(url.pathname.match(/^\/(?:embed|shorts|live)\/([^/?#]+)/)?.[1]??"");}else throw new BadRequestException("Use um link do YouTube ou youtu.be.");if(!/^[A-Za-z0-9_-]{11}$/.test(id))throw new BadRequestException("Não foi possível identificar o vídeo no link informado.");return id;}
  private captionTracks(html:string){const match=html.match(/"captionTracks":(\[[\s\S]*?\])/);if(!match)return[] as CaptionTrack[];try{return JSON.parse(match[1]) as CaptionTrack[]}catch{return[] as CaptionTrack[];}}
  private title(html:string){const match=html.match(/<meta\s+(?:property|name)=["']og:title["']\s+content=["']([^"']+)/i)||html.match(/<title>([^<]+)<\/title>/i);return match?strip(match[1].replace(/&quot;/g,'"').replace(/&#39;/g,"'")):"";}
  private async fetchText(url:string){let response:Response;try{response=await fetch(url,{headers:{"user-agent":userAgent,"accept-language":"pt-BR,pt;q=0.9,en;q=0.8"},signal:AbortSignal.timeout(15_000)});}catch{throw new BadRequestException("Não foi possível acessar o YouTube neste momento. Tente novamente.");}if(!response.ok)throw new BadRequestException("O YouTube não disponibilizou este vídeo ou suas legendas para leitura.");return response.text();}
}
