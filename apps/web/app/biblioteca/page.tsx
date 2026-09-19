"use client";
import { FormEvent, useEffect, useRef, useState } from "react";

const API=process.env.NEXT_PUBLIC_API_URL??"http://localhost:3101/api";
type Format="PDF"|"KINDLE";
type Category="NEGOCIOS"|"TECNOLOGIA"|"ESPIRITUALIDADE"|"SAUDE";
type Book={slug:string;category:Category;title:string;hook:string;pages:number;cover:string;preview:string;previewPages:string[];prices:Record<Format,number>;available:Record<Format,boolean>};
type Selection={book:Book;format:Format};
const money=(amount:number)=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(amount);
const categories:Array<{id:Category;title:string;description:string}>=[
  {id:"ESPIRITUALIDADE",title:"Espiritualidade, simbolismo & autoconhecimento",description:"Tradições, símbolos e reflexões para novas perspectivas."},
  {id:"SAUDE",title:"Saúde & bem-estar",description:"Conteúdos sobre hábitos, alimentação e autocuidado."},
  {id:"TECNOLOGIA",title:"Inteligência artificial & tecnologia",description:"Fundamentos e aplicações práticas para acompanhar o presente."},
  {id:"NEGOCIOS",title:"Negócios, vendas & finanças",description:"Persuasão, escolhas financeiras e decisões para avançar."}
];

function DraggablePreview({src,title}:{src:string;title:string}){
  const canvas=useRef<HTMLDivElement>(null),drag=useRef<{id:number;x:number;y:number;left:number;top:number}|null>(null);
  const[dragging,setDragging]=useState(false);
  function start(event:React.PointerEvent<HTMLDivElement>){
    if(event.pointerType!=="touch"&&event.button!==0)return;
    const target=canvas.current;if(!target)return;
    drag.current={id:event.pointerId,x:event.clientX,y:event.clientY,left:target.scrollLeft,top:target.scrollTop};
    target.setPointerCapture(event.pointerId);setDragging(true);event.preventDefault();
  }
  function move(event:React.PointerEvent<HTMLDivElement>){
    const active=drag.current,target=canvas.current;if(!active||active.id!==event.pointerId||!target)return;
    target.scrollLeft=active.left-(event.clientX-active.x);target.scrollTop=active.top-(event.clientY-active.y);event.preventDefault();
  }
  function end(event:React.PointerEvent<HTMLDivElement>){
    if(drag.current?.id!==event.pointerId)return;
    if(canvas.current?.hasPointerCapture(event.pointerId))canvas.current.releasePointerCapture(event.pointerId);
    drag.current=null;setDragging(false);
  }
  return <figure className="digital-pan-preview">
    <div ref={canvas} className={dragging?"digital-pan-preview-canvas is-dragging":"digital-pan-preview-canvas"} tabIndex={0} aria-label={`Página de apresentação de ${title}. Clique, segure e arraste para ler.`} onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onContextMenu={event=>event.preventDefault()}>
      <img src={src} alt={`Página selecionada de ${title}`}/>
    </div>
    <figcaption>PRÉVIA · Clique, segure e arraste para ler a página</figcaption>
  </figure>
}

export default function Biblioteca(){
  const[books,setBooks]=useState<Book[]>([]),[selection,setSelection]=useState<Selection>(),[preview,setPreview]=useState<Book>(),[error,setError]=useState(""),[loading,setLoading]=useState(false),[purchase,setPurchase]=useState<{status:string;title:string;format:Format;downloadUrl?:string}>();
  const shelves=categories.map(category=>({...category,books:books.filter(book=>book.category===category.id)})).filter(category=>category.books.length);
  useEffect(()=>{fetch(`${API}/digital-products`).then(async response=>{const body=await response.json();if(!response.ok)throw Error(body.message);return body}).then(setBooks).catch(()=>setError("Não foi possível carregar a biblioteca."))},[]);
  useEffect(()=>{if(!books.length)return;const params=new URLSearchParams(location.search),slug=params.get("livro"),requested=params.get("formato")?.toUpperCase();if(!slug||!requested||!(["PDF","KINDLE"] as string[]).includes(requested))return;const book=books.find(item=>item.slug===slug);if(book)setSelection({book,format:requested as Format})},[books]);
  useEffect(()=>{const params=new URLSearchParams(location.search),id=params.get("compra"),token=params.get("token");if(!id||!token)return;let timer:number;const check=()=>fetch(`${API}/digital-products/purchases/${id}?token=${encodeURIComponent(token)}`).then(response=>response.json()).then(body=>{setPurchase(body);if(body.status!=="APPROVED")timer=window.setTimeout(check,3000)}).catch(()=>setError("Não foi possível consultar sua compra."));check();return()=>clearTimeout(timer)},[]);
  async function checkout(event:FormEvent<HTMLFormElement>){event.preventDefault();if(!selection)return;setLoading(true);setError("");const data=new FormData(event.currentTarget);try{const response=await fetch(`${API}/digital-products/${selection.book.slug}/checkout`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({email:data.get("email"),format:selection.format})}),body=await response.json();if(!response.ok)throw Error(Array.isArray(body.message)?body.message.join(", "):body.message);location.href=body.checkoutUrl}catch(cause){setError(cause instanceof Error?cause.message:"Pagamento indisponível");setLoading(false)}}
  return <main className="digital-store">
    <header className="digital-hero"><a href="/" className="digital-brand"><i>V</i><b>Venda<span>+</span></b><small>Biblioteca digital</small></a><div><small>CONHECIMENTO PARA GUARDAR</small><h1>Livros que despertam novas perguntas.</h1><p>Conheça páginas selecionadas, escolha o formato e receba o download após a aprovação do Mercado Pago.</p><div className="digital-prices"><b>PDF <span>a partir de {money(7.90)}</span></b><b>Kindle · EPUB <span>{money(39.99)}</span></b></div></div></header>
    <section className="digital-system-banner system-banner-v2" aria-label="ERP Venda+ para comércio, serviços, imóveis e produção">
      <div className="system-banner-copy"><small>VENDA+ · ERP COMERCIAL E FISCAL</small><h2>Sua empresa inteira, conectada em um só sistema.</h2><p>Controle vendas, atendimento, clientes, propostas, estoque, produção, faturamento e NF-e com clareza para decidir e tempo para crescer.</p><div className="system-banner-benefits"><span>Venda e caixa</span><span>Estoque e produção</span><span>Clientes e propostas</span></div><a href="/sistemas-jundiai">Ver tudo o que o Venda+ faz <span>→</span></a></div>
      <div className="system-banner-demo" aria-hidden="true"><header><div><i></i><b>Visão geral da operação</b></div><span>AO VIVO</span></header><div className="system-demo-metrics"><span><small>FATURAMENTO HOJE</small><b>R$ 3.460</b><em>+12,4%</em></span><span><small>PEDIDOS</small><b>98</b><em>hoje</em></span><span><small>ESTOQUE</small><b>1.284</b><em>itens</em></span></div><div className="system-demo-chart"><span style={{height:"38%"}}></span><span style={{height:"56%"}}></span><span style={{height:"46%"}}></span><span style={{height:"74%"}}></span><span style={{height:"62%"}}></span><span style={{height:"91%"}}></span><span style={{height:"79%"}}></span></div><div className="system-demo-activity"><span><i>Proposta #184</i><b>Aguardando aprovação</b></span><span><i>NF-e #903</i><b>Autorizada</b></span></div></div>
    </section>
    <section className="library-member-offer" aria-labelledby="library-member-offer-title"><div><small>ACESSO COMPLETO À BIBLIOTECA</small><h2 id="library-member-offer-title">Todos os livros em um único acesso.</h2><p>Por R$ 59,90, tenha uma área exclusiva para baixar as edições em PDF e Kindle que já estiverem disponíveis.</p></div><div className="library-member-offer-actions"><b>R$ 59,90 <span>pagamento único</span></b><a href="/biblioteca/membros">Quero ser membro <span>→</span></a><a className="member-sign-in-link" href="/biblioteca/membros">Já tenho acesso</a></div></section>
    {purchase&&<section className={purchase.status==="APPROVED"?"digital-purchase approved":"digital-purchase"}><div><small>SUA COMPRA</small><h2>{purchase.title}</h2><p>{purchase.status==="APPROVED"?`Pagamento aprovado. Sua versão ${purchase.format==="PDF"?"PDF":"Kindle"} está pronta.`:"Aguardando a confirmação do Mercado Pago. Esta tela atualiza automaticamente."}</p></div>{purchase.downloadUrl&&<a href={purchase.downloadUrl}>Baixar agora</a>}</section>}
    {error&&<div className="error digital-error">{error}</div>}
    <section className="digital-heading"><small>ESCOLHA SEU TEMA</small><h2>Encontre sua próxima leitura por assunto.</h2><p>Clique em “Ver páginas” para ampliar uma prévia. A demonstração é protegida e não substitui o livro completo.</p></section>
    <div className="digital-shelves">{shelves.map(shelf=><section className="digital-shelf" key={shelf.id} aria-labelledby={`shelf-${shelf.id}`}><header className="digital-shelf-heading"><small>COLEÇÃO</small><h2 id={`shelf-${shelf.id}`}>{shelf.title}</h2><p>{shelf.description}</p></header><div className="digital-grid">{shelf.books.map(book=><article key={book.slug}><button className="digital-cover" onClick={()=>setPreview(book)}><img src={book.cover} alt={`Capa de ${book.title}`}/><span>Ver páginas</span></button><div><h3>{book.title}</h3><span style={{color:"#8a6c2e",fontSize:10,fontWeight:800,letterSpacing:".04em",textTransform:"uppercase"}}>Págs.: {book.pages}</span><p>{book.hook}</p><button disabled={!book.available.PDF} onClick={()=>setSelection({book,format:"PDF"})}><span>PDF</span><b>{book.available.PDF?money(book.prices.PDF):"Em preparação"}</b></button><button disabled={!book.available.KINDLE} className="kindle" onClick={()=>setSelection({book,format:"KINDLE"})}><span>Kindle · EPUB</span><b>{book.available.KINDLE?money(book.prices.KINDLE):"Em preparação"}</b></button></div></article>)}</div></section>)}</div>
    {preview&&<div className="digital-modal" role="dialog" aria-modal="true" aria-label={`Prévia de ${preview.title}`}><button className="digital-dismiss" onClick={()=>setPreview(undefined)}>×</button><div><img src={preview.cover} alt=""/><DraggablePreview src={preview.preview} title={preview.title}/></div><section><small>UMA LEITURA PARA DESPERTAR CURIOSIDADE</small><h2>{preview.title}</h2><p>{preview.hook}</p><button disabled={!preview.available.PDF} onClick={()=>{setSelection({book:preview,format:"PDF"});setPreview(undefined)}}>{preview.available.PDF?`Quero em PDF · ${money(preview.prices.PDF)}`:"PDF em preparação"}</button><button disabled={!preview.available.KINDLE} className="kindle" onClick={()=>{setSelection({book:preview,format:"KINDLE"});setPreview(undefined)}}>{preview.available.KINDLE?`Quero para Kindle · ${money(preview.prices.KINDLE)}`:"Kindle em preparação"}</button></section></div>}
    {selection&&<div className="checkout-modal" role="dialog" aria-modal="true"><button className="digital-dismiss" onClick={()=>setSelection(undefined)}>×</button><img src={selection.book.cover} alt=""/><section><small>FOLHEIE ANTES DE COMPRAR</small><h2>{selection.book.title}</h2><div className="preview-gallery" aria-label="Três páginas de prévia">{selection.book.previewPages.map((page,index)=><figure key={page}><img src={page} alt={`Prévia ${index+1} de ${selection.book.title}`}/><figcaption>Página selecionada</figcaption></figure>)}</div><div className="format-choice"><button disabled={!selection.book.available.PDF} className={selection.format==="PDF"?"active":""} onClick={()=>setSelection({...selection,format:"PDF"})}>PDF<b>{money(selection.book.prices.PDF)}</b></button><button disabled={!selection.book.available.KINDLE} className={selection.format==="KINDLE"?"active":""} onClick={()=>setSelection({...selection,format:"KINDLE"})}>Kindle · EPUB<b>{money(selection.book.prices.KINDLE)}</b></button></div><p>{selection.format==="PDF"?"Arquivo PDF para leitura em celular, computador ou tablet.":"EPUB de layout preservado, preparado para enviar ao aplicativo ou dispositivo Kindle."}</p><form onSubmit={checkout}><label>E-mail para identificar a compra<input type="email" name="email" required placeholder="voce@email.com"/></label><button disabled={loading}>{loading?"Abrindo Mercado Pago...":"Pagar com Mercado Pago"}</button></form><small>O download é liberado somente após a confirmação do pagamento.</small></section></div>}
  </main>;
}
