"use client";
import { FormEvent, useState } from "react";
import { request } from "./api-client";

type Transcript={videoId:string;title:string;language:string;source:"LEGENDAS_PUBLICAS"|"AUDIO";text:string;segments:Array<{timestamp:string;text:string}>};
export function VideoTranscripts({token}:{token:string}){
  const [result,setResult]=useState<Transcript|null>(null),[error,setError]=useState(""),[loading,setLoading]=useState(false);
  async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();const data=new FormData(event.currentTarget);setLoading(true);setError("");setResult(null);try{setResult(await request<Transcript>("/video-transcripts",token,{method:"POST",body:JSON.stringify({url:data.get("url"),language:data.get("language")||undefined,authorized:data.get("authorized")==="on"})}));}catch(cause){setError(cause instanceof Error?cause.message:"Não foi possível gerar a transcrição.");}finally{setLoading(false)}}
  function download(){if(!result)return;const blob=new Blob([`${result.title}\nYouTube: https://youtu.be/${result.videoId}\nIdioma: ${result.language}\n\n${result.text}\n`],{type:"text/plain;charset=utf-8"}),url=URL.createObjectURL(blob),link=document.createElement("a");link.href=url;link.download=`${result.title.replace(/[^a-z0-9]+/gi,"-").replace(/^-|-$/g,"").slice(0,80)||"transcricao"}.txt`;link.click();URL.revokeObjectURL(url)}
  return <section className="video-transcripts">
    <header><div><small>CONTEÚDO AUTORIZADO</small><h2>Transcrição de vídeo do YouTube</h2><p>Cole o link. Quando o vídeo não tiver legendas, o sistema transcreve o áudio automaticamente. Use somente vídeos próprios ou autorizados.</p></div></header>
    <form onSubmit={submit}><label>Link do vídeo<input name="url" type="url" placeholder="https://www.youtube.com/watch?v=..." required/></label><label>Idioma preferido<select name="language" defaultValue=""><option value="">Automático</option><option value="pt">Português</option><option value="en">English</option><option value="es">Español</option></select></label><label className="video-authorization"><input name="authorized" type="checkbox" required/>Tenho autorização para transcrever este vídeo.</label><button disabled={loading}>{loading?"Preparando e transcrevendo áudio…":"Gerar transcrição"}</button></form>
    {error&&<div className="error">{error}</div>}
    {result&&<article className="video-transcript-result"><header><div><small>{result.source==="AUDIO"?"TRANSCRIÇÃO POR ÁUDIO":"LEGENDAS PÚBLICAS"} · {result.language.toUpperCase()} · {result.segments.length} trechos</small><h3>{result.title}</h3></div><button type="button" className="secondary" onClick={download}>Baixar TXT</button></header><div className="video-transcript-lines">{result.segments.map((segment,index)=><p key={`${segment.timestamp}-${index}`}><time>{segment.timestamp}</time><span>{segment.text}</span></p>)}</div></article>}
  </section>;
}
