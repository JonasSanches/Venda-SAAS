"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { request } from "./api-client";

type Claim = { id:string; claimNumber:string; status:"DRAFT"|"SUBMITTED"|"PAID"|"DENIED"; elapsedMinutes:number; billableMinutes:number; calculatedAmount:number; requestedAmount:number; currency:string; denialReason?:string };
type Load = { id:string; loadNumber:string; brokerName:string; brokerEmail?:string; origin?:string; destination?:string; rateConfirmationNumber?:string; rateConfirmationTerms?:string; rateAmount?:number|null; detentionFreeMinutes:number; detentionRatePerHour:number; detentionMinimumMinutes:number; arrivalAt?:string; departureAt?:string; status:string; claims:Claim[] };
type Dashboard = { metrics:{openLoads:number;readyToClaim:number;submitted:number;paidAmount:number}; loads:Load[] };
const emptyForm={loadNumber:"",brokerName:"",brokerEmail:"",brokerPhone:"",origin:"",destination:"",rateConfirmationNumber:"",rateConfirmationTerms:"",rateAmount:"",detentionFreeMinutes:"120",detentionRatePerHour:"75",detentionMinimumMinutes:"0",notes:""};
const statusLabel:Record<Claim["status"],string>={DRAFT:"Rascunho",SUBMITTED:"Enviado",PAID:"Pago",DENIED:"Negado"};
const formatUsd=(value:number)=>value.toLocaleString("en-US",{style:"currency",currency:"USD"});
const dateTime=(value?:string)=>value?new Intl.DateTimeFormat("pt-BR",{dateStyle:"short",timeStyle:"short"}).format(new Date(value)):"—";

export function TransportationRecovery({token}:{token:string}) {
  const [data,setData]=useState<Dashboard|null>(null);
  const [form,setForm]=useState(emptyForm);
  const [open,setOpen]=useState(false);
  const [busy,setBusy]=useState("");
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");
  const refresh=useCallback(async()=>{try{setData(await request<Dashboard>("/transportation/dashboard",token));setError("");}catch(cause){setError((cause as Error).message);}},[token]);
  useEffect(()=>{void refresh();},[refresh]);
  const call=async(key:string,path:string,method="POST",body:unknown={})=>{try{setBusy(key);setMessage("");setError("");await request(path,token,{method,body:JSON.stringify(body)});await refresh();return true;}catch(cause){setError((cause as Error).message);return false;}finally{setBusy("");}};
  async function createLoad(event:FormEvent){event.preventDefault();const ok=await call("create","/transportation/loads","POST",{...form,rateAmount:form.rateAmount?Number(form.rateAmount):undefined,detentionFreeMinutes:Number(form.detentionFreeMinutes),detentionRatePerHour:Number(form.detentionRatePerHour),detentionMinimumMinutes:Number(form.detentionMinimumMinutes)});if(ok){setForm(emptyForm);setOpen(false);setMessage("Carga criada. Registre a chegada quando o motorista fizer check-in.");}}
  async function updateClaim(claim:Claim,status:Claim["status"]){let body:Record<string,string>={status};if(status==="DENIED"){const denialReason=window.prompt("Motivo da negativa / Denial reason:");if(!denialReason)return;body={...body,denialReason};}if(status==="PAID"){const paymentReference=window.prompt("Referência do pagamento (opcional) / Payment reference (optional):")??"";body={...body,paymentReference};}const ok=await call(`claim-${claim.id}-${status}`,`/transportation/claims/${claim.id}/status`,"PATCH",body);if(ok)setMessage(`Claim ${statusLabel[status].toLowerCase()} com sucesso.`);}
  return <section className="transport-recovery">
    <div className="transport-intro"><div><small>TRANSPORTATION DETENTION RECOVERY</small><h2>Recupere detention com evidências da carga.</h2><p>Cadastre o load, broker e termos da rate confirmation. Registre chegada e saída, calcule o valor e acompanhe o claim até o pagamento.</p></div><button onClick={()=>setOpen(!open)}>{open?"Fechar cadastro":"Novo load"}</button></div>
    <div className="transport-future"><b>Pronto para expansão</b><span>Detention ativo agora</span><span>Layover</span><span>TONU</span><span>Lumper</span><em>Os próximos tipos já possuem base própria no módulo.</em></div>
    {error&&<div className="error">{error}</div>}{message&&<div className="success">{message}</div>}
    <div className="transport-metrics">
      <article><span>Loads abertos</span><strong>{data?.metrics.openLoads??"—"}</strong><small>Em andamento</small></article>
      <article><span>Prontos para claim</span><strong>{data?.metrics.readyToClaim??"—"}</strong><small>Com chegada e saída</small></article>
      <article><span>Claims enviados</span><strong>{data?.metrics.submitted??"—"}</strong><small>Aguardando broker</small></article>
      <article><span>Recuperado</span><strong>{data?formatUsd(data.metrics.paidAmount):"—"}</strong><small>Claims pagos</small></article>
    </div>
    {open&&<form className="transport-form" onSubmit={createLoad}>
      <div className="transport-form-heading"><div><small>NOVO LOAD</small><h3>Termos informados por você</h3></div><p>O cálculo usa o tempo após a franquia e arredonda cada hora iniciada.</p></div>
      <label>Load number<input required value={form.loadNumber} onChange={e=>setForm({...form,loadNumber:e.target.value})} placeholder="Ex.: LD-48291"/></label>
      <label>Broker<input required value={form.brokerName} onChange={e=>setForm({...form,brokerName:e.target.value})} placeholder="Nome do broker"/></label>
      <label>Broker email<input type="email" value={form.brokerEmail} onChange={e=>setForm({...form,brokerEmail:e.target.value})} placeholder="billing@broker.com"/></label>
      <label>Broker phone<input value={form.brokerPhone} onChange={e=>setForm({...form,brokerPhone:e.target.value})}/></label>
      <label>Origin<input value={form.origin} onChange={e=>setForm({...form,origin:e.target.value})} placeholder="Dallas, TX"/></label>
      <label>Destination<input value={form.destination} onChange={e=>setForm({...form,destination:e.target.value})} placeholder="Houston, TX"/></label>
      <label>Rate confirmation #<input value={form.rateConfirmationNumber} onChange={e=>setForm({...form,rateConfirmationNumber:e.target.value})}/></label>
      <label>Load rate (USD)<input type="number" min="0" step="0.01" value={form.rateAmount} onChange={e=>setForm({...form,rateAmount:e.target.value})}/></label>
      <label>Free time (minutes)<input required type="number" min="0" value={form.detentionFreeMinutes} onChange={e=>setForm({...form,detentionFreeMinutes:e.target.value})}/></label>
      <label>Detention rate / hour (USD)<input required type="number" min="0" step="0.01" value={form.detentionRatePerHour} onChange={e=>setForm({...form,detentionRatePerHour:e.target.value})}/></label>
      <label>Minimum billable minutes<input required type="number" min="0" value={form.detentionMinimumMinutes} onChange={e=>setForm({...form,detentionMinimumMinutes:e.target.value})}/></label>
      <label className="wide">Rate confirmation terms<textarea value={form.rateConfirmationTerms} onChange={e=>setForm({...form,rateConfirmationTerms:e.target.value})} placeholder="Termos de detention informados na rate confirmation."/></label>
      <label className="wide">Notes<textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></label>
      <div className="transport-form-actions"><button disabled={busy==="create"}>{busy==="create"?"Salvando...":"Criar load"}</button></div>
    </form>}
    <div className="transport-loads"><div className="transport-section-heading"><div><small>FLUXO DE RECUPERAÇÃO</small><h3>Loads e claims</h3></div><span>{data?.loads.length??0} registros recentes</span></div>
      {!data&&<p className="transport-empty">Carregando loads...</p>}
      {data?.loads.length===0&&<p className="transport-empty">Nenhum load registrado. Crie o primeiro para iniciar o fluxo.</p>}
      {data?.loads.map(load=>{const claim=load.claims[0];return <article className="transport-load" key={load.id}>
        <div className="transport-load-main"><div><small>LOAD</small><h4>{load.loadNumber}</h4><p>{load.brokerName}{load.rateConfirmationNumber?` · RC ${load.rateConfirmationNumber}`:""}</p></div><div><small>ROTA</small><p>{load.origin||"Origem não informada"} <b>→</b> {load.destination||"Destino não informado"}</p></div><div><small>TERMOS</small><p>{load.detentionFreeMinutes} min free · {formatUsd(load.detentionRatePerHour)}/hr</p></div></div>
        <div className="transport-timeline"><div className={load.arrivalAt?"done":""}><span>1</span><b>Arrival</b><small>{dateTime(load.arrivalAt)}</small>{!load.arrivalAt&&<button disabled={busy===`arrival-${load.id}`} onClick={()=>void call(`arrival-${load.id}`,`/transportation/loads/${load.id}/arrival`)}>Registrar chegada</button>}</div><div className={load.departureAt?"done":""}><span>2</span><b>Departure</b><small>{dateTime(load.departureAt)}</small>{load.arrivalAt&&!load.departureAt&&<button disabled={busy===`departure-${load.id}`} onClick={()=>void call(`departure-${load.id}`,`/transportation/loads/${load.id}/departure`)}>Registrar saída</button>}</div><div className={claim?"done":""}><span>3</span><b>Detention claim</b>{claim?<small>{claim.claimNumber} · {formatUsd(claim.requestedAmount)}</small>:<small>Gera rascunho calculado</small>}{load.departureAt&&!claim&&<button disabled={busy===`claim-${load.id}`} onClick={()=>void call(`claim-${load.id}`,`/transportation/loads/${load.id}/claims/detention`)}>Gerar claim</button>}</div></div>
        {claim&&<div className="transport-claim"><div><span className={`claim-status ${claim.status.toLowerCase()}`}>{statusLabel[claim.status]}</span><b>{claim.claimNumber}</b><small>{claim.elapsedMinutes} min no local · {claim.billableMinutes} min faturáveis · cálculo {formatUsd(claim.calculatedAmount)}</small></div><div className="claim-actions">{claim.status==="DRAFT"&&<button disabled={busy.startsWith(`claim-${claim.id}`)} onClick={()=>void updateClaim(claim,"SUBMITTED")}>Enviar ao broker</button>}{claim.status==="SUBMITTED"&&<><button disabled={busy.startsWith(`claim-${claim.id}`)} onClick={()=>void updateClaim(claim,"PAID")}>Marcar pago</button><button className="secondary" disabled={busy.startsWith(`claim-${claim.id}`)} onClick={()=>void updateClaim(claim,"DENIED")}>Marcar negado</button></>}</div></div>}
      </article>})}
    </div>
  </section>;
}
