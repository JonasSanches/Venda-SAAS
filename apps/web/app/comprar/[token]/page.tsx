"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3101/api";

export default function Comprar({ params }: { params: Promise<{ token: string }> }) {
  const [token, setToken] = useState("");
  const [shop, setShop] = useState<any>();
  const [cart, setCart] = useState<Record<string, number>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    void params.then(({ token }) => {
      setToken(token);
      fetch(`${API}/qr-checkout/${token}`).then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw Error(data.message ?? "QR indisponível");
        return data;
      }).then(setShop).catch((cause) => setError(cause.message));
    });
  }, [params]);
  const total = useMemo(() => shop?.offers.reduce((sum: number, offer: any) => sum + (cart[offer.id] ?? 0) * offer.price, 0) ?? 0, [shop, cart]);
  const quantity = (offerId: string, next: number) => setCart((current) => ({ ...current, [offerId]: Math.max(0, next) }));
  async function checkout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!Object.values(cart).some(Boolean)) { setError("Escolha pelo menos um item."); return; }
    setLoading(true); setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(`${API}/qr-checkout/${token}/checkout`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ buyerName: form.get("buyerName"), buyerEmail: form.get("buyerEmail") || undefined, buyerPhone: form.get("buyerPhone") || undefined, deliveryAddress: form.get("deliveryAddress") || undefined, items: Object.entries(cart).filter(([, value]) => value > 0).map(([offerId, quantity]) => ({ offerId, quantity })) }) });
      const data = await response.json();
      if (!response.ok) throw Error(data.message ?? "Pagamento indisponível");
      location.href = data.checkoutUrl;
    } catch (cause) { setError((cause as Error).message); setLoading(false); }
  }
  if (error && !shop) return <main className="qr-public"><p>{error}</p></main>;
  return <main className="qr-public"><section>
    <small>VENDA ONLINE</small><h1>{shop?.company?.name ?? "Carregando..."}</h1><h2>{shop?.name}</h2><p>Escolha os itens e pague com Pix, cartão ou outro meio disponível no Mercado Pago.</p>
    <div className="qr-offers">{shop?.offers.map((offer: any) => <article key={offer.id}>
      {offer.imageDataUrl && <img className="qr-product-image" src={offer.imageDataUrl} alt={offer.title} />}
      <div><h3>{offer.title}</h3><p>{offer.description}</p><b>{offer.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</b></div>
      <div className="qr-quantity"><button onClick={() => quantity(offer.id, (cart[offer.id] ?? 0) - 1)}>−</button><span>{cart[offer.id] ?? 0}</span><button onClick={() => quantity(offer.id, (cart[offer.id] ?? 0) + 1)}>+</button></div>
    </article>)}</div>
    <form onSubmit={checkout}><h3>Seus dados</h3><label>Nome<input name="buyerName" required /></label><label>E-mail (opcional)<input name="buyerEmail" type="email" /></label><label>Telefone (opcional)<input name="buyerPhone" /></label>{shop?.deliveryEnabled && <label>Endereço para entrega{shop.addressRequired ? " *" : " (opcional)"}<textarea name="deliveryAddress" required={shop.addressRequired} /></label>}<strong>Total: {total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong><button disabled={loading}>{loading ? "Abrindo pagamento..." : "Pagar com Mercado Pago"}</button></form>
    {error && <div className="error">{error}</div>}
  </section></main>;
}
