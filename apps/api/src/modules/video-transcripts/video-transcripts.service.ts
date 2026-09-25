import { BadRequestException, Injectable } from "@nestjs/common";

type CaptionTrack={baseUrl:string;languageCode?:string;kind?:string;name?:{simpleText?:string;runs?:Array<{text?:string}>}};
type Segment={text:string;startMs:number;durationMs:number};
const userAgent="Mozilla/5.0 (compatible; VendaPlusTranscript/1.0; +https://vendamais-app.com)";
const strip=(value:string)=>value.replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim();
const timestamp=(milliseconds:number)=>{const seconds=Math.max(0,Math.floor(milliseconds/1000)),hours=Math.floor(seconds/3600),minutes=Math.floor((seconds%3600)/60),rest=seconds%60;return hours?`${String(hours).padStart(2,"0")}:${String(minutes).padStart(2,"0")}:${String(rest).padStart(2,"0")}`:`${String(minutes).padStart(2,"0")}:${String(rest).padStart(2,"0")}`;};

@Injectable()
export class VideoTranscriptsService {
  async create(input:{url:string;language?:string;authorized:boolean}) {
    if(!input.authorized) throw new BadRequestException("Confirme que você possui autorização para transcrever este vídeo.");
    const videoId=this.videoId(input.url);
    const html=await this.fetchText(`https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`);
    const tracks=this.captionTracks(html);
    if(!tracks.length) throw new BadRequestException("Este vídeo não possui legendas públicas disponíveis no YouTube. A transcrição por áudio pode ser adicionada posteriormente com um provedor autorizado.");
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
    return{videoId,title,language,segments:segments.map((item:Segment)=>({...item,timestamp:timestamp(item.startMs)})),text};
  }

  private videoId(raw:string){let url:URL;try{url=new URL(raw)}catch{throw new BadRequestException("Informe um link válido do YouTube.");}const host=url.hostname.toLowerCase().replace(/^www\./,"");let id="";if(host==="youtu.be")id=url.pathname.split("/").filter(Boolean)[0]??"";else if(["youtube.com","m.youtube.com"].includes(host)){id=url.searchParams.get("v")??(url.pathname.match(/^\/(?:embed|shorts|live)\/([^/?#]+)/)?.[1]??"");}else throw new BadRequestException("Use um link do YouTube ou youtu.be.");if(!/^[A-Za-z0-9_-]{11}$/.test(id))throw new BadRequestException("Não foi possível identificar o vídeo no link informado.");return id;}
  private captionTracks(html:string){const match=html.match(/"captionTracks":(\[[\s\S]*?\])/);if(!match)return[] as CaptionTrack[];try{return JSON.parse(match[1]) as CaptionTrack[]}catch{return[] as CaptionTrack[];}}
  private title(html:string){const match=html.match(/<meta\s+(?:property|name)=["']og:title["']\s+content=["']([^"']+)/i)||html.match(/<title>([^<]+)<\/title>/i);return match?strip(match[1].replace(/&quot;/g,'"').replace(/&#39;/g,"'")):"";}
  private async fetchText(url:string){let response:Response;try{response=await fetch(url,{headers:{"user-agent":userAgent,"accept-language":"pt-BR,pt;q=0.9,en;q=0.8"},signal:AbortSignal.timeout(15_000)});}catch{throw new BadRequestException("Não foi possível acessar o YouTube neste momento. Tente novamente.");}if(!response.ok)throw new BadRequestException("O YouTube não disponibilizou este vídeo ou suas legendas para leitura.");return response.text();}
}
