"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { request } from "./api-client";

type Dashboard = {
  commissionRate: number;
  approvedOrders: number;
  pendingOrders: number;
  grossSales: number;
  platformCommission: number;
  merchantBalance: number;
  recent: Array<{ id: string; buyerName: string; total: number; platformCommissionAmount: number; merchantAmount: number; status: string; createdAt: string }>;
};
const brl = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function QrSales({ token }: { token: string }) {
  const [links, setLinks] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<any>();
  const canvas = useRef<HTMLCanvasElement>(null);
  const load = async () => {
    try {
      const [nextLinks, nextDashboard, nextProducts] = await Promise.all([
        request<any[]>("/qr-checkout/links", token),
        request<Dashboard>("/qr-checkout/dashboard", token),
        request<any[]>("/products", token),
      ]);
      setLinks(nextLinks);
      setDashboard(nextDashboard);
      setProducts(nextProducts);
      setError("");
    } catch (err) {
      setError((err as Error).message);
    }
  };
  useEffect(() => { void load(); }, []);
  useEffect(() => {
    if (selected && canvas.current) {
      void import("qrcode").then((QR) => QR.toCanvas(canvas.current!, `${location.origin}/comprar/${selected.token}`, { width: 260, margin: 2 }));
    }
  }, [selected]);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const product = products.find((item) => item.id === form.get("productId"));
      const result = await request<any>("/qr-checkout/links", token, {
        method: "POST",
        body: JSON.stringify({
          name: form.get("name"), deliveryEnabled: form.get("deliveryEnabled") === "on", addressRequired: form.get("addressRequired") === "on",
          offers: [{ productId: product?.id, title: product?.name ?? form.get("title"), description: form.get("description"), price: product?.price ?? Number(form.get("price")) }],
        }),
      });
      setSelected(result);
      setMessage("QR de venda criado. Você já pode imprimir ou compartilhar.");
      event.currentTarget.reset();
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const rate = dashboard ? Math.round(dashboard.commissionRate * 100) : 12;
  return <section className="qr-sales">
    <header><div><small>VENDA POR QR CODE</small><h2>Venda no local, receba online</h2><p>Crie uma página pública, imprima o QR e receba pagamentos pelo Mercado Pago.</p></div></header>
    <section className="qr-commission-note"><strong>Comissão da plataforma: {rate}%</strong><span>Ela é calculada somente sobre vendas aprovadas. O valor líquido do estabelecimento é de {100 - rate}%.</span></section>
    {dashboard && <section className="qr-summary" aria-label="Resumo financeiro de vendas por QR Code">
      <article><small>Vendas aprovadas</small><strong>{brl(dashboard.grossSales)}</strong><span>{dashboard.approvedOrders} pedido(s)</span></article>
      <article><small>Comissão Venda+</small><strong>{brl(dashboard.platformCommission)}</strong><span>{rate}% das vendas aprovadas</span></article>
      <article><small>Saldo do estabelecimento</small><strong>{brl(dashboard.merchantBalance)}</strong><span>valor após a comissão</span></article>
      <article><small>Pedidos pendentes</small><strong>{dashboard.pendingOrders}</strong><span>aguardando pagamento</span></article>
    </section>}
    {message && <div className="success">{message}</div>}{error && <div className="error">{error}</div>}
    <form className="email-form" onSubmit={create}><h3>Novo QR de venda</h3><input name="name" placeholder="Nome do QR (ex.: Balcão da loja)" required/><label>Produto cadastrado (recomendado para mostrar a foto)<select name="productId" defaultValue=""><option value="">Produto ou serviço avulso</option>{products.filter((product) => product.active).map((product) => <option value={product.id} key={product.id}>{product.name} · {brl(product.price)}{product.imageDataUrl ? " · com foto" : ""}</option>)}</select></label><input name="title" placeholder="Produto ou serviço avulso"/><input name="price" type="number" min="0.01" step="0.01" placeholder="Preço do item avulso"/><input name="description" placeholder="Descrição (opcional)"/><label><input name="deliveryEnabled" type="checkbox"/> Oferecer entrega</label><label><input name="addressRequired" type="checkbox"/> Exigir endereço</label><button>Criar QR Code</button></form>
    {selected && <section className="qr-created"><canvas ref={canvas}/><div><h3>{selected.name}</h3><p>Imprima este QR Code e deixe-o no local de venda.</p><a href={selected.url} target="_blank" rel="noreferrer">Abrir página de compra</a></div></section>}
    <section className="email-list"><h3>Pedidos recentes</h3>{dashboard?.recent.length ? dashboard.recent.map((order) => <article className="qr-order" key={order.id}><div><strong>{order.buyerName}</strong><span>{new Date(order.createdAt).toLocaleString("pt-BR")} · {order.status === "APPROVED" ? "Pago" : order.status === "REJECTED" ? "Recusado" : "Pendente"}</span></div><div><strong>{brl(order.total)}</strong><span>Comissão: {brl(order.platformCommissionAmount)} · Líquido: {brl(order.merchantAmount)}</span></div></article>) : <p className="empty-state">Nenhum pedido por QR Code ainda.</p>}</section>
    <section className="email-list"><h3>QR Codes criados</h3>{links.map((link) => <article className="qr-link" key={link.id}><div><strong>{link.name}</strong><span>{link.offers.length} oferta(s) · {link._count?.orders ?? 0} pedido(s)</span></div><button className="secondary" onClick={() => setSelected({ ...link, url: `${location.origin}/comprar/${link.token}` })}>Ver QR</button></article>)}</section>
  </section>;
}
