"use client";

import { useMemo, useState } from "react";
import "./square-meter-calculator.css";

type Product = { id: string; name: string; price: number; active: boolean };
type Material = { id: string; name: string; pack: string; yield: number; basis?: string };

const catalog: Material[] = [
  {id:"abs18",name:"Acrílico Absoluta Fosco",pack:"Lata 18 L",yield:150},
  {id:"abs36",name:"Acrílico Absoluta Fosco",pack:"Lata 3,6 L",yield:30},
  {id:"absac18",name:"Acrílico Absoluta Acetinado/Semibrilho",pack:"Lata 18 L",yield:110},
  {id:"absac36",name:"Acrílico Absoluta Acetinado/Semibrilho",pack:"Lata 3,6 L",yield:22},
  {id:"emb18",name:"Pintura Emborrachada",pack:"Lata 18 L",yield:90},
  {id:"emb36",name:"Pintura Emborrachada",pack:"Galão 3,6 L",yield:18},
  {id:"prem18",name:"Acrílico Premium",pack:"Lata 18 L",yield:150},
  {id:"prem36",name:"Acrílico Premium",pack:"Galão 3,6 L",yield:30},
  {id:"rende18",name:"Acrílico Rende+",pack:"Lata 18 L",yield:170},
  {id:"rende36",name:"Acrílico Rende+",pack:"Galão 3,6 L",yield:34},
  {id:"flex20",name:"Flex Pro",pack:"Balde 20 kg",yield:70},
  {id:"flex4",name:"Flex Pro",pack:"Balde 4 kg",yield:14},
  {id:"gesso18",name:"Gesso & Drywall",pack:"Lata 18 L",yield:80},
  {id:"text20",name:"Textura decorativa",pack:"Balde 20 kg",yield:9},
  {id:"text4",name:"Textura decorativa",pack:"Balde 4 kg",yield:2},
  {id:"primer18",name:"Primer Flexível",pack:"Balde 18 kg",yield:25},
  {id:"primer4",name:"Primer Flexível",pack:"Balde 4 kg",yield:5},
  {id:"ferr36",name:"Esmalte Direto na Ferrugem",pack:"Lata 3,6 L",yield:20},
  {id:"ferr09",name:"Esmalte Direto na Ferrugem",pack:"Quarto 900 ml",yield:5},
  {id:"acqua36",name:"Acqua Pro",pack:"Lata 3,6 L",yield:50},
  {id:"acqua09",name:"Acqua Pro",pack:"Quarto 900 ml",yield:10},
  {id:"verniz36",name:"Verniz Marítimo",pack:"Galão 3,6 L",yield:50},
  {id:"verniz09",name:"Verniz Marítimo",pack:"Quarto 900 ml",yield:12.5},
  {id:"epoxy36",name:"Epoxy (A+B)",pack:"Galão 3,6 L",yield:18},
  {id:"resina18",name:"Resina Impermeabilizante",pack:"Lata 18 L",yield:225,basis:"por demão"},
  {id:"resina36",name:"Resina Impermeabilizante",pack:"Galão 3,6 L",yield:45,basis:"por demão"},
  {id:"hidro20",name:"Textura Hidrorrepelente",pack:"Balde 20 kg",yield:5},
  {id:"graf20",name:"Grafiato",pack:"Balde 20 kg",yield:5},
  {id:"proj20",name:"Textura Projetada",pack:"Balde 20 kg",yield:10},
  {id:"gran20",name:"Textura Granulada",pack:"Balde 20 kg",yield:6},
  {id:"acril20",name:"Textura Acrílica",pack:"Balde 20 kg",yield:12},
  {id:"fundo16",name:"Fundo 2 em 1",pack:"Balde 16 L",yield:88},
  {id:"paredes16",name:"Fundo de Paredes Preparador",pack:"Balde 16 L",yield:110},
  {id:"selador16",name:"Selador Acrílico",pack:"Balde 16 L",yield:88},
  {id:"massa20",name:"Massa Corrida",pack:"Balde 20 kg",yield:40}
];

const brl = (v:number) => v.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});

export function SquareMeterCalculator({products,companyName,logoDataUrl}:{products:Product[];companyName:string;logoDataUrl?:string}) {
  const [project,setProject]=useState("");
  const [customer,setCustomer]=useState("");
  const [place,setPlace]=useState("");
  const [length,setLength]=useState("");
  const [width,setWidth]=useState("");
  const [directArea,setDirectArea]=useState("");
  const [loss,setLoss]=useState("10");
  const [choice,setChoice]=useState("");
  const [yieldValue,setYieldValue]=useState("");
  const [pack,setPack]=useState("Embalagem cadastrada");
  const [price,setPrice]=useState("");
  const [items,setItems]=useState<Array<{id:string;name:string;pack:string;yield:number;price:number;basis?:string}>>([]);

  const area=useMemo(()=>directArea.trim()?Math.max(0,Number(directArea)||0):Math.max(0,Number(length)||0)*Math.max(0,Number(width)||0),[directArea,length,width]);
  const target=area*(1+Math.max(0,Number(loss)||0)/100);
  const material=catalog.find(x=>x.id===choice);
  const product=products.find(x=>`p:${x.id}`===choice);
  const coverage=material?.yield??(product?Number(yieldValue):0);
  const unitPrice=material?(Number(price)||0):(product?.price??0);

  function add(){
    if(!choice||coverage<=0)return;
    setItems(old=>[...old,{id:`${choice}-${Date.now()}`,name:material?.name??product?.name??"",pack:material?.pack??pack,yield:coverage,price:unitPrice,basis:material?.basis}]);
    setChoice("");setYieldValue("");setPrice("");
  }

  const pricedItems=items.filter(x=>x.price>0);
  const unpricedItems=items.filter(x=>!(x.price>0));
  const total=pricedItems.reduce((sum,x)=>sum+Math.ceil(target/x.yield)*x.price,0);
  const report=[
    `RELATÓRIO DE MATERIAIS — ${companyName}`,
    `Obra: ${project||"Não informada"}`,
    `Cliente: ${customer||"Não informado"}`,
    `Local: ${place||"Não informado"}`,
    `Área: ${area.toLocaleString("pt-BR")} m²`,
    `Perda: ${loss}%`,
    `Área considerada: ${target.toLocaleString("pt-BR",{maximumFractionDigits:2})} m²`,
    "Materiais:",
    ...items.map(x=>`• ${x.name} (${x.pack}): ${Math.ceil(target/x.yield)} embalagem(ns)${x.price?` — ${brl(Math.ceil(target/x.yield)*x.price)}`:""}`),
    `Subtotal dos materiais com preço informado: ${brl(total)}`,
    ...(unpricedItems.length?[`Atenção: ${unpricedItems.length} material(is) sem preço informado; o valor não representa o custo total da obra.`]:[]),
    "Estimativa baseada nos rendimentos cadastrados. Verifique as condições da superfície e as instruções do fabricante."
  ].join("\n");

  return <main className="sqm">
    <header className="sqm-head"><div><small>PLANEJAMENTO DE MATERIAIS</small><h2>Calculadora de m²</h2><p>Calcule o consumo e prepare o relatório da obra.</p></div><b>m²</b></header>
    <div className="sqm-columns">
      <section className="sqm-card">
        <h3>1. Dados da obra</h3>
        <label>Nome da obra<input value={project} onChange={e=>setProject(e.target.value)} placeholder="Ex.: Pintura da fachada"/></label>
        <label>Cliente<input value={customer} onChange={e=>setCustomer(e.target.value)} placeholder="Nome do cliente"/></label>
        <label>Endereço / local<input value={place} onChange={e=>setPlace(e.target.value)} placeholder="Local da obra"/></label>
        <h3>2. Área</h3>
        <div className="sqm-row"><label>Comprimento (m)<input type="number" min="0" value={length} onChange={e=>{setLength(e.target.value);setDirectArea("");}}/></label><label>Largura (m)<input type="number" min="0" value={width} onChange={e=>{setWidth(e.target.value);setDirectArea("");}}/></label></div>
        <label>Ou informe a área diretamente (m²)<input type="number" min="0" value={directArea} onChange={e=>setDirectArea(e.target.value)} placeholder="Opcional"/></label>
        <label>Margem de perda (%)<input type="number" min="0" max="100" value={loss} onChange={e=>setLoss(e.target.value)}/></label>
        <div className="sqm-total"><span>Área considerada com perda</span><strong>{target.toLocaleString("pt-BR",{maximumFractionDigits:2})} m²</strong></div>
      </section>
      <section className="sqm-card">
        <h3>3. Adicionar material</h3>
        <label>Catálogo técnico BR Colors<select value={material?choice:""} onChange={e=>setChoice(e.target.value)}><option value="">Selecione produto / embalagem</option>{catalog.map(x=><option key={x.id} value={x.id}>{x.name} · {x.pack} · {x.yield} m² {x.basis??"acabado"}</option>)}</select></label>
        <label>Produto cadastrado na loja<select value={product?choice:""} onChange={e=>setChoice(e.target.value)}><option value="">Selecionar produto cadastrado</option>{products.filter(x=>x.active).map(x=><option key={x.id} value={`p:${x.id}`}>{x.name} · {brl(x.price)}</option>)}</select></label>
        {product&&<><label>Rendimento por embalagem (m²)<input type="number" min="0.01" value={yieldValue} onChange={e=>setYieldValue(e.target.value)} placeholder="Informe o rendimento"/></label><label>Embalagem<input value={pack} onChange={e=>setPack(e.target.value)}/></label></>}
        {material&&<label>Preço por embalagem (opcional)<input type="number" min="0" step="0.01" value={price} onChange={e=>setPrice(e.target.value)} placeholder="R$"/></label>}
        <p className="sqm-note">{material?`Rendimento informado: ${material.yield} m² ${material.basis??"acabado"}.`:"Para produtos da loja, informe o rendimento da embalagem."}</p>
        <button className="sqm-add" type="button" disabled={!choice||coverage<=0||target<=0} onClick={add}>Adicionar material</button>
      </section>
    </div>
    <section className="sqm-card sqm-report">
      <div className="sqm-report-title"><div><h3>4. Materiais e quantidades</h3><p>Estimativa para {target.toLocaleString("pt-BR",{maximumFractionDigits:2})} m².</p></div><div><strong>{brl(total)}</strong>{unpricedItems.length>0&&<small className="sqm-note">Subtotal parcial · {unpricedItems.length} sem preço</small>}</div></div>
      {items.length?<div className="sqm-scroll"><table><thead><tr><th>Produto</th><th>Embalagem</th><th>Rendimento</th><th>Quantidade</th><th>Preço un.</th><th>Subtotal</th><th></th></tr></thead><tbody>{items.map(x=>{const qty=Math.ceil(target/x.yield);return <tr key={x.id}><td>{x.name}</td><td>{x.pack}</td><td>{x.yield} m² {x.basis??""}</td><td><b>{qty}</b></td><td>{x.price?brl(x.price):"—"}</td><td>{x.price?brl(qty*x.price):"—"}</td><td><button className="sqm-remove" onClick={()=>setItems(old=>old.filter(i=>i.id!==x.id))}>Remover</button></td></tr>})}</tbody></table></div>:<p className="sqm-empty">Adicione materiais para montar o relatório.</p>}
      <div className="sqm-actions"><button type="button" disabled={!items.length} onClick={()=>window.print()}>Imprimir / salvar PDF</button><button type="button" disabled={!items.length} onClick={()=>window.open(`https://wa.me/?text=${encodeURIComponent(report)}`,"_blank","noopener,noreferrer")}>Compartilhar pelo WhatsApp</button></div>
      <p className="sqm-note">A resina impermeabilizante tem rendimento informado por demão. O cálculo considera uma demão; ajuste a quantidade de demãos conforme a orientação do fabricante. Os demais rendimentos seguem a indicação do manual e podem variar conforme a superfície e a aplicação.</p>
      <div className="sqm-print">{logoDataUrl&&<img src={logoDataUrl} alt="Logo da empresa"/>}<b>{companyName}</b><pre>{report}</pre></div>
    </section>
  </main>;
}
