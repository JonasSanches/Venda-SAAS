"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { request } from "./api-client";
import "./customers.css";

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

export function Customers({ token }: { token: string }) {
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
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true); setError(""); setMessage("");
    try {
      await request("/commercial/parties", token, { method: "POST", body: JSON.stringify({ type: "CUSTOMER", ...form, document: form.document || undefined, email: form.email || undefined, phone: form.phone || undefined, address: form.address || undefined, notes: form.notes || undefined }) });
      setForm(empty); setMessage("Cliente cadastrado e disponível para toda a operação."); await load();
    } catch (cause) { setError((cause as Error).message); } finally { setBusy(false); }
  };
  return <section className="customers-panel">
    <header className="customers-hero"><div><small>CADASTRO COMPARTILHADO</small><h2>Clientes</h2><p>Use a mesma base no PDV, vendas, entregas e pedidos da Pizzaria.</p></div><b>{customers.length}<span>clientes cadastrados</span></b></header>
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
