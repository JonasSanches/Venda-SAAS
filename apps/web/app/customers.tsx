"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { request } from "./api-client";
import "./customers.css";
import "./customers-export.css";

type Customer = {
  id: string;
  name: string;
  document?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  createdAt: string;
};

const empty = { name: "", phone: "", email: "", document: "", address: "", notes: "" };

export function Customers({ token, roles }: { token: string; roles: string[] }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [form, setForm] = useState(empty);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const load = async () => {
    try {
      setCustomers(await request<Customer[]>("/commercial/parties?type=CUSTOMER", token));
      setError("");
    } catch (cause) { setError((cause as Error).message); }
  };
  useEffect(() => { void load(); }, [token]);
  const filtered = useMemo(() => {
    const value = query.trim().toLocaleLowerCase("pt-BR");
    if (!value) return customers;
    return customers.filter(customer => [customer.name, customer.phone, customer.email, customer.document, customer.address].filter(Boolean).join(" ").toLocaleLowerCase("pt-BR").includes(value));
  }, [customers, query]);
  const update = (key: keyof typeof empty, value: string) => setForm(current => ({ ...current, [key]: value }));
  const canExport = roles.includes("ADMIN") || roles.includes("MANAGER") || roles.includes("PLATFORM_ADMIN");
  const downloadPdf = () => {
    const safe = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E]/g, " ").replace(/[\\()]/g, "\\$&");
    const lines = ["VENDA+ | LISTA DE CLIENTES", `Gerado em ${new Date().toLocaleString("pt-BR")}`, `Total de clientes: ${customers.length}`, ""];
    customers.forEach((customer, index) => lines.push(`${index + 1}. ${customer.name}`, `   Telefone: ${customer.phone || "Nao informado"} | E-mail: ${customer.email || "Nao informado"}`, `   Documento: ${customer.document || "Nao informado"}`, `   Endereco: ${customer.address || "Nao informado"}`, customer.notes ? `   Observacoes: ${customer.notes}` : "", ""));
    const pages:string[][]=[]; for(let index=0;index<lines.length;index+=42) pages.push(lines.slice(index,index+42));
    const objects:string[]=["<< /Type /Catalog /Pages 2 0 R >>", `<< /Type /Pages /Kids [${pages.map((_,index)=>`${3+index*3} 0 R`).join(" ")}] /Count ${pages.length} >>`];
    pages.forEach((page,index)=>{const content=`BT /F1 10 Tf 48 790 Td 13 TL ${page.map((line,lineIndex)=>`${lineIndex?"T* ":""}(${safe(line)}) Tj`).join("\n")} ET`;const base=3+index*3;objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${base+1} 0 R >> >> /Contents ${base+2} 0 R >>`,`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`,`<< /Length ${content.length} >>\nstream\n${content}\nendstream`)});
    let pdf="%PDF-1.4\n", offsets=[0]; objects.forEach((object,index)=>{offsets.push(pdf.length);pdf+=`${index+1} 0 obj\n${object}\nendobj\n`}); const xref=pdf.length; pdf+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n${offsets.slice(1).map(offset=>`${String(offset).padStart(10,"0")} 00000 n \n`).join("")}trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
    const url=URL.createObjectURL(new Blob([pdf],{type:"application/pdf"})), link=document.createElement("a"); link.href=url;link.download="lista-de-clientes-venda-mais.pdf";link.click();URL.revokeObjectURL(url);
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true); setError(""); setMessage("");
    try {
      await request("/commercial/parties", token, { method: "POST", body: JSON.stringify({ type: "CUSTOMER", ...form, document: form.document || undefined, email: form.email || undefined, phone: form.phone || undefined, address: form.address || undefined, notes: form.notes || undefined }) });
      setForm(empty); setMessage("Cliente cadastrado e disponível para toda a operação."); await load();
    } catch (cause) { setError((cause as Error).message); } finally { setBusy(false); }
  };
  return <section className="customers-panel">
    <header className="customers-hero"><div><small>CADASTRO COMPARTILHADO</small><h2>Clientes</h2><p>Use a mesma base no PDV, vendas, entregas e pedidos da Pizzaria.</p></div><div className="customers-actions"><b>{customers.length}<span>clientes cadastrados</span></b>{canExport&&<button className="customers-export" onClick={downloadPdf}>Baixar lista em PDF</button>}</div></header>
    <div className="customers-layout">
      <form className="customer-form" onSubmit={submit}>
        <h3>Novo cliente</h3><p>Cadastre uma vez para encontrar rapidamente na próxima venda.</p>
        <label>Nome completo<input value={form.name} onChange={event => update("name", event.target.value)} minLength={2} required placeholder="Ex.: Mariana Oliveira" /></label>
        <div className="customer-form-row"><label>Telefone<input value={form.phone} onChange={event => update("phone", event.target.value)} placeholder="(11) 99999-9999" /></label><label>CPF ou CNPJ <small>opcional</small><input value={form.document} onChange={event => update("document", event.target.value)} placeholder="Somente se necessário" /></label></div>
        <label>E-mail <small>opcional</small><input type="email" value={form.email} onChange={event => update("email", event.target.value)} placeholder="cliente@email.com" /></label>
        <label>Endereço <small>essencial para entrega</small><textarea value={form.address} onChange={event => update("address", event.target.value)} placeholder="Rua, número, complemento, bairro e referência" /></label>
        <label>Observações <small>opcional</small><textarea value={form.notes} onChange={event => update("notes", event.target.value)} placeholder="Preferências, ponto de referência ou informações úteis" /></label>
        <button disabled={busy}>{busy ? "Salvando…" : "Cadastrar cliente"}</button>
        {message && <p className="success">{message}</p>}{error && <p className="error">{error}</p>}
      </form>
      <section className="customer-list"><header><div><small>BASE DE CLIENTES</small><h3>Clientes cadastrados</h3></div><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar nome, telefone ou endereço" /></header>{filtered.length === 0 ? <p className="customer-empty">Nenhum cliente encontrado.</p> : <div>{filtered.map(customer => <article key={customer.id}><div><b>{customer.name}</b><span>{[customer.phone, customer.email].filter(Boolean).join(" · ") || "Sem contato informado"}</span>{customer.address && <small>{customer.address}</small>}</div>{customer.document && <em>{customer.document}</em>}</article>)}</div>}</section>
    </div>
  </section>;
}
