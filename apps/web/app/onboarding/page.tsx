"use client";
import { useEffect, useState } from "react";
const API=process.env.NEXT_PUBLIC_API_URL??"http://localhost:3101/api";
export default function Onboarding(){
 const[token,setToken]=useState("");const[data,setData]=useState({products:0,cash:false,sales:0});const[msg,setMsg]=useState("");
 async function call(path:string,t=token,init?:RequestInit){const r=await fetch(API+path,{...init,headers:{authorization:`Bearer ${t}`,"content-type":"application/json"}}),j=await r.json();if(!r.ok)throw Error(j.message);return j}
 async function load(t=token){const[p,c,s]=await Promise.all([call("/products",t),call("/cash/current",t),call("/sales/summary",t)]);setData({products:p.length,cash:!!c.session,sales:s.orders})}
 useEffect(()=>{const s=JSON.parse(localStorage.getItem("varejo-session")??"{}");if(!s.accessToken){location.href="/";return}setToken(s.accessToken);void load(s.accessToken)},[]);
 async function addProduct(){const name=prompt("Nome do primeiro produto:");if(!name)return;try{await call("/products",token,{method:"POST",body:JSON.stringify({sku:`INI-${Date.now()}`,name,price:10})});await load();setMsg("Produto criado. Você poderá editar preço e dados fiscais depois.")}catch(e){setMsg((e as Error).message)}}
 async function openCash(){try{await call("/cash/open",token,{method:"POST",body:JSON.stringify({openingAmount:100})});await load();setMsg("Caixa aberto com R$ 100.")}catch(e){setMsg((e as Error).message)}}
 const steps=[true,data.products>0,data.cash,data.sales>0],done=steps.filter(Boolean).length;
 return <div className="management onboarding"><header><div><small>PRIMEIROS PASSOS</small><h1>Configure sua operação</h1></div><a href="/">Painel</a></header><div className="progress"><i style={{width:`${done*25}%`}}/></div><p>{done} de 4 etapas concluídas</p>{msg&&<div className="notice">{msg}</div>}<div className="onboarding-steps"><Step n={1} done title="Empresa criada" text="Ambiente e filial isolados."/><Step n={2} done={steps[1]} title="Primeiro produto" text="Comece seu catálogo." action={addProduct}/><Step n={3} done={steps[2]} title="Abra o caixa" text="Fundo de troco sugerido: R$ 100." action={openCash}/><Step n={4} done={steps[3]} title="Primeira venda" text="Abra o painel, acesse PDV e finalize uma venda." href="/"/></div></div>
}
function Step(p:{n:number;done:boolean;title:string;text:string;action?:()=>void;href?:string}){return <article className={p.done?"done":""}><b>{p.n}</b><div><h3>{p.title}</h3><p>{p.text}</p>{!p.done&&p.action&&<button onClick={p.action}>Começar</button>}{!p.done&&p.href&&<a href={p.href}>Abrir PDV</a>}</div><span>{p.done?"✓":""}</span></article>}
