"use client";

import { FormEvent, useState } from "react";
import { OmegaCredit } from "../omega-credit";
import { BrandName } from "../brand-name";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3101/api";
const dataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result));
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

export default function Cadastro() {
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (form.get("password") !== form.get("confirm")) return setMsg("As senhas não coincidem");
    const file = form.get("logoFile") as File;
    if (file.size > 500000) return setMsg("O logo deve ter no máximo 500 KB");
    const body: Record<string, unknown> = Object.fromEntries(form);
    delete body.confirm; delete body.logoFile;
    if (file.size) body.logoDataUrl = await dataUrl(file);
    setLoading(true);
    const response = await fetch(API + "/platform/trials", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const result = await response.json();
    if (!response.ok) { setLoading(false); return setMsg(Array.isArray(result.message) ? result.message.join(", ") : result.message); }
    try {
      const login = await fetch(API + "/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ access: body.email, password: body.password }) });
      const session = await login.json();
      if (!login.ok) throw new Error();
      localStorage.setItem("varejo-session", JSON.stringify(session)); location.assign("/");
    } catch { setLoading(false); setMsg("Cadastro criado com sucesso. Entre com seu e-mail e senha."); }
  }
  return <div className="signup-page">
    <header className="signup-header"><a className="signup-brand" href="/"><i>V</i><b><BrandName /></b><OmegaCredit /></a><nav aria-label="Navegação do cadastro"><a href="/#recursos">Recursos</a><a href="/#como-funciona">Como funciona</a><a href="/biblioteca">Biblioteca</a><a className="signup-login" href="/">Entrar</a></nav></header>
    <main className="signup-main">
      <section className="signup-copy" aria-labelledby="signup-title"><small>VENDA+ · CADASTRO GRATUITO</small><h1 id="signup-title">Sua empresa organizada desde o primeiro acesso.</h1><p>Cadastre-se, entre no sistema e acompanhe vendas, caixa, estoque e operação em um único lugar.</p><ul><li>Cadastro e ativação imediatos</li><li>Acesso no computador e no celular</li><li>Dados separados para cada empresa</li></ul><figure className="signup-preview"><figcaption><span>Painel de gestão</span><b>Visão clara da sua operação</b></figcaption><img src="/erp-system-preview.jpg" alt="Tela de painel administrativo com indicadores, gráficos e documentos" /></figure></section>
      <form className="signup-card" onSubmit={submit}><small>COMECE AGORA</small><h2>Crie sua conta</h2><p>Preencha os dados abaixo. Seu acesso é ativado automaticamente.</p>{msg && <div className="notice">{msg}</div>}
        <fieldset><legend>Empresa</legend><label>Nome<input name="companyName" required /></label><label>Logo<input name="logoFile" type="file" accept="image/png,image/jpeg,image/webp" /><small>PNG, JPG ou WebP; máximo 500 KB.</small></label><label>Segmento<select name="segment"><option value="RESTAURANT">Restaurante</option><option value="PIZZERIA">Pizzaria</option><option value="WINERY">Adega</option><option value="RETAIL">Loja/varejo</option><option value="APPAREL_CUSTOMIZATION">Confecção e personalizados</option><option value="TRANSPORTATION">Transportadora</option><option value="WORKSHOP">Oficina mecânica</option><option value="QR_SALES">Menu Digital por QRCode</option></select></label><label>Cidade<input name="city" required /></label><label>UF<select name="state"><option>SP</option><option>RJ</option></select></label></fieldset>
        <fieldset><legend>Responsável</legend><label>Nome<input name="name" required /></label><label>WhatsApp<input name="phone" minLength={10} required /></label><label>E-mail<input name="email" type="email" required /></label><label>Senha<input name="password" type="password" minLength={8} required /></label><label>Confirmar senha<input name="confirm" type="password" minLength={8} required /></label></fieldset>
        <button disabled={loading}>{loading ? "Criando acesso..." : "Criar cadastro gratuito"}</button><a className="signup-back" href="/">Já tenho acesso — entrar</a>
      </form>
    </main>
    <footer className="signup-footer"><div><a className="signup-brand" href="/"><i>V</i><b><BrandName /></b></a><p>Gestão simples para a operação real da sua empresa.</p></div><div><b>Acesso</b><a href="/">Entrar</a><a href="/cadastro">Criar cadastro</a></div><div><b>Ajuda</b><a href="https://wa.me/5511978436640" target="_blank" rel="noopener noreferrer">WhatsApp</a><a href="/privacidade">Privacidade</a></div><small>© {new Date().getFullYear()} Venda+. Todos os direitos reservados.</small></footer>
  </div>;
}
