"use client";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { OmegaCredit } from "./omega-credit";
import { ErpSurvey } from "./erp-survey";
import { BrandName } from "./brand-name";
import { Pricing } from "./pricing";
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3101/api";
type Product = {
  id: string;
  sku: string;
  name: string;
  price: number;
  ncm?: string;
  active: boolean;
  quantity: number;
  createdAt: string;
};
type Stock = Product & { quantity: number };
type Order = {
  id: string;
  number: number;
  items: Array<{ productId: string; name: string; quantity: number }>;
  paymentMethod: string;
  total: number;
  status: "PAID" | "CANCELLED";
  createdAt: string;
};
type Summary = {
  products: number;
  stockUnits: number;
  orders: number;
  revenue: number;
  cashOpen: boolean;
};
type BranchInfo = { id: string; name: string; state: string };
type Session = {
  accessToken: string;
  user: { name: string; email: string; roles: string[] };
  tenant: {
    tenantId: string;
    name: string;
    status?: string;
    expiresAt?: string;
    branch: BranchInfo | null;
    branches?: BranchInfo[];
  };
};
async function request<T>(
  path: string,
  token?: string,
  init?: RequestInit,
): Promise<T> {
  let branchId = "";
  if (typeof window !== "undefined")
    try {
      branchId =
        JSON.parse(localStorage.getItem("varejo-session") ?? "{}").tenant
          ?.branch?.id ?? "";
    } catch {}
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(branchId ? { "X-Branch-Id": branchId } : {}),
      ...init?.headers,
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(
      Array.isArray(body.message)
        ? body.message.join(", ")
        : (body.message ?? "Operação não concluída"),
    );
  return body;
}
function trialDays(expiresAt?: string) {
  if (!expiresAt) return null;
  const end = new Date(expiresAt).getTime();
  if (!Number.isFinite(end)) return null;
  return Math.max(0, Math.ceil((end - Date.now()) / 86_400_000));
}
function TrialRemaining({
  status,
  expiresAt,
}: {
  status?: string;
  expiresAt?: string;
}) {
  const days = trialDays(expiresAt);
  if (status !== "TRIAL" || days === null) return null;
  return (
    <strong className="trial-remaining">
      Você ainda tem {days} {days === 1 ? "dia grátis" : "dias grátis"}.
    </strong>
  );
}
export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [summary, setSummary] = useState<Summary>({
    products: 0,
    stockUnits: 0,
    orders: 0,
    revenue: 0,
    cashOpen: false,
  });
  const [page, setPage] = useState("Visão geral");
  const [error, setError] = useState("");
  const [passwordOpen, setPasswordOpen] = useState(false);
  const refresh = useCallback(async (s: Session) => {
    try {
      const [p, stats] = await Promise.all([
        request<Product[]>("/products", s.accessToken),
        request<Summary>("/sales/summary", s.accessToken),
      ]);
      setProducts(p);
      setSummary(stats);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);
  useEffect(() => {
    const saved = localStorage.getItem("varejo-session");
    if (saved) setSession(JSON.parse(saved));
  }, []);
  const isPlatformAdmin =
    session?.user.roles.includes("PLATFORM_ADMIN") ?? false;
  useEffect(() => {
    if (isPlatformAdmin) location.replace("/admin");
  }, [isPlatformAdmin]);
  useEffect(() => {
    if (session && !isPlatformAdmin) void refresh(session);
  }, [session, isPlatformAdmin, refresh]);
  useEffect(() => {
    if (!session?.accessToken || isPlatformAdmin) return;
    let active = true;
    const syncTrial = async () => {
      try {
        const tenant = await request<Session["tenant"]>(
          "/platform/trial",
          session.accessToken,
        );
        if (!active) return;
        setSession((current) => {
          if (!current) return current;
          const selectedBranch = current.tenant.branch;
          const branch =
            tenant.branches?.find((item) => item.id === selectedBranch?.id) ??
            tenant.branch;
          const next = { ...current, tenant: { ...tenant, branch } };
          localStorage.setItem("varejo-session", JSON.stringify(next));
          return next;
        });
      } catch (e) {
        if (active) setError((e as Error).message);
      }
    };
    void syncTrial();
    const timer = window.setInterval(syncTrial, 60_000);
    window.addEventListener("focus", syncTrial);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", syncTrial);
    };
  }, [session?.accessToken, isPlatformAdmin]);
  if (!session)
    return (
      <Login
        onLogin={(value) => {
          localStorage.setItem("varejo-session", JSON.stringify(value));
          if (
            value.tenant.status === "TRIAL" &&
            !localStorage.getItem(
              `varejo-onboarding-seen:${value.tenant.tenantId}`,
            )
          ) {
            location.href = "/onboarding";
            return;
          }
          setSession(value);
        }}
      />
    );
  if (isPlatformAdmin)
    return (
      <div className="login">
        <p>Abrindo o monitor da plataforma...</p>
      </div>
    );
  if (!session.tenant.branch)
    return (
      <div className="login">
        <div className="error">
          Nenhuma filial está configurada para esta conta.
        </div>
      </div>
    );
  const updated = () => refresh(session),
    selectBranch = (branch: BranchInfo) => {
      let base = session;
      try {
        base = JSON.parse(
          localStorage.getItem("varejo-session") ?? "",
        ) as Session;
      } catch {}
      const next = { ...base, tenant: { ...base.tenant, branch } };
      localStorage.setItem("varejo-session", JSON.stringify(next));
      setSession(next);
    };
  return (
    <main>
      <aside>
        <div className="brand">
          <span>V</span> <BrandName /> <OmegaCredit />
        </div>
        <nav>
          {pagesFor(session.user.roles).map((name) => (
            <button
              className={page === name ? "active" : ""}
              key={name}
              onClick={() => setPage(name)}
            >
              {name}
            </button>
          ))}
        </nav>
        <div className="tenant">
          <small>EMPRESA ATUAL</small>
          <strong>{session.tenant.name}</strong>
          <select
            className="branch-switch"
            value={session.tenant.branch.id}
            onChange={(e) => {
              const branch = (
                session.tenant.branches ?? [session.tenant.branch!]
              ).find((item) => item.id === e.target.value);
              if (branch) selectBranch(branch);
            }}
          >
            {(session.tenant.branches ?? [session.tenant.branch]).map(
              (branch) => (
                <option value={branch.id} key={branch.id}>
                  {branch.name} · {branch.state}
                </option>
              ),
            )}
          </select>
          <button
            className="account-action"
            onClick={() => setPasswordOpen(true)}
          >
            Alterar minha senha
          </button>
          <button
            onClick={() => {
              localStorage.removeItem("varejo-session");
              setSession(null);
            }}
          >
            Sair
          </button>
        </div>
      </aside>
      <section className="content">
        <header>
          <div>
            <div className="environment-line">
              <small>AMBIENTE DE DEMONSTRAÇÃO</small>
              <TrialRemaining
                status={session.tenant.status}
                expiresAt={session.tenant.expiresAt}
              />
            </div>
            <h1>{page}</h1>
          </div>
          <div className="profile">
            <span>{session.user.name}</span>
            <small>{summary.cashOpen ? "Caixa aberto" : "Caixa fechado"}</small>
            <button
              className="mobile-password"
              onClick={() => setPasswordOpen(true)}
            >
              Alterar senha
            </button>
          </div>
        </header>
        {error && <div className="error">{error}</div>}
        {page === "Caixa" ? (
          <Cash token={session.accessToken} onChange={updated} />
        ) : page === "PDV" ? (
          <Pdv
            token={session.accessToken}
            products={products}
            onSale={updated}
          />
        ) : page === "Estoque" ? (
          <Inventory token={session.accessToken} onChange={updated} />
        ) : page === "Produtos" ? (
          <Products
            products={products}
            token={session.accessToken}
            onCreated={updated}
          />
        ) : page === "Usuários" ? (
          <Users token={session.accessToken} roles={session.user.roles} />
        ) : page === "Filial" ? (
          <Branch session={session} onSelect={selectBranch} />
        ) : (
          <Overview summary={summary} onNavigate={setPage} page={page} />
        )}
      </section>
      {passwordOpen && (
        <ChangePassword
          token={session.accessToken}
          onClose={() => setPasswordOpen(false)}
        />
      )}
    </main>
  );
}
function ChangePassword({
  token,
  onClose,
}: {
  token: string;
  onClose: () => void;
}) {
  const [error, setError] = useState(""),
    [loading, setLoading] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget),
      currentPassword = String(form.get("currentPassword") ?? ""),
      newPassword = String(form.get("newPassword") ?? ""),
      confirmation = String(form.get("confirmation") ?? "");
    if (newPassword !== confirmation) {
      setError("A confirmação não corresponde à nova senha");
      return;
    }
    setLoading(true);
    try {
      await request("/auth/password", token, {
        method: "PATCH",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      alert("Senha alterada com sucesso.");
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }
  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Alterar minha senha"
    >
      <form className="password-modal" onSubmit={submit}>
        <div className="modal-title">
          <div>
            <small>SEGURANÇA DA CONTA</small>
            <h2>Alterar minha senha</h2>
          </div>
          <button type="button" className="secondary" onClick={onClose}>
            Fechar
          </button>
        </div>
        {error && <div className="error">{error}</div>}
        <label>
          Senha atual
          <input
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            minLength={8}
            required
          />
        </label>
        <label>
          Nova senha
          <input
            name="newPassword"
            type="password"
            autoComplete="new-password"
            minLength={12}
            required
          />
          <small>Utilize pelo menos 12 caracteres.</small>
        </label>
        <label>
          Confirmar nova senha
          <input
            name="confirmation"
            type="password"
            autoComplete="new-password"
            minLength={12}
            required
          />
        </label>
        <button disabled={loading}>
          {loading ? "Alterando..." : "Salvar nova senha"}
        </button>
      </form>
    </div>
  );
}
function Login({ onLogin }: { onLogin: (s: Session) => void }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      onLogin(
        await request<Session>("/auth/login", undefined, {
          method: "POST",
          body: JSON.stringify({
            access: form.get("access"),
            password: form.get("password"),
          }),
        }),
      );
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="public-home">
      <header className="public-header">
        <div className="public-brand">
          <a className="public-logo" href="/">
            <span>V</span>
            <BrandName />
          </a>
          <OmegaCredit />
        </div>
        <nav aria-label="Navegação principal">
          <a href="#recursos">Recursos</a>
          <a href="#segmentos">Para quem é</a>
          <a href="#como-funciona">Como funciona</a>
          <a href="#planos">Planos</a>
          <a href="#suporte">Suporte 24h</a>
          <a href="/teste">Teste grátis</a>
          <a className="header-login" href="#entrar">
            Entrar
          </a>
        </nav>
      </header>
      <div className="login login-commercial">
        <section className="login-offer">
          <div className="brand dark">
            <span>V</span> <BrandName /> <OmegaCredit />
          </div>
        <small>VENDA+ • CONTROLE MAIS • DECIDA MELHOR</small>
          <h1>Seu negócio vendendo rápido, com caixa e estoque sob controle.</h1>
          <p>
            Um sistema simples para registrar vendas, acompanhar o que entra e
            sai e enxergar os números da operação em um só lugar.
          </p>
          <ul id="beneficios">
            <li><strong>Venda sem complicação:</strong> PDV direto e rápido</li>
            <li><strong>Evite surpresas:</strong> estoque baixado a cada venda</li>
            <li><strong>Feche com segurança:</strong> entradas e retiradas no caixa</li>
            <li><strong>Gerencie de qualquer lugar:</strong> computador ou celular</li>
          </ul>
          <div className="free-trial-call">
            <strong>Experimente grátis por 7 dias</strong>
            <span>
              Cadastre sua empresa sem compromisso. Após nossa liberação, seus 7
              dias começam a contar.
            </span>
            <a href="/teste">Quero testar grátis</a>
          </div>
          <div className="support-call" id="suporte">
            <span>24h</span>
            <div>
              <strong>Suporte quando você precisar</strong>
              <p>
                Atendimento contínuo para orientar sua equipe e acompanhar
                situações importantes da operação.
              </p>
              <a href="https://wa.me/5511978436640?text=Ol%C3%A1%2C%20quero%20saber%20mais%20sobre%20o%20Venda%2B." target="_blank" rel="noopener noreferrer">WhatsApp: +55 11 97843-6640</a>
            </div>
          </div>
        </section>
        <form id="entrar" onSubmit={submit}>
          <div className="brand dark">
            <span>V</span> <BrandName /> <OmegaCredit />
          </div>
          <h1>Entre na sua conta</h1>
          <p>Acesse a operação da sua empresa.</p>
          {error && <div className="error">{error}</div>}
          <label>
            E-mail ou nome de acesso
            <input
              name="access"
              type="text"
              placeholder="seu@email.com ou seu acesso"
              required
            />
          </label>
          <label>
            Senha
            <input
              name="password"
              type="password"
              placeholder="Sua senha"
              required
            />
          </label>
          <button disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
          <small>
            Ainda não tem acesso?{" "}
            <a href="/teste">Solicite seus 7 dias grátis.</a>
          </small>
        </form>
      </div>
      <section className="trust-strip" aria-label="Principais vantagens">
        <span><b>7 dias grátis</b> para conhecer</span>
        <span><b>Dados separados</b> por empresa</span>
        <span><b>Suporte 24h</b> para sua operação</span>
        <span><b>Acesso responsivo</b> no celular e computador</span>
      </section>
      <section className="product-showcase" aria-labelledby="product-showcase-title">
        <div className="showcase-heading">
          <small>VEJA O VENDA+ EM AÇÃO</small>
          <h2 id="product-showcase-title">Poder tecnológico sem limites.</h2>
          <p>O limite é a nossa imaginação, alinhada às necessidades do seu negócio. Conheça três pontos essenciais de uma operação conectada, simples de entender e pronta para crescer com você.</p>
          <div className="showcase-principles"><span><b>Facilitador da vida</b><small>menos tarefas repetidas e mais tempo para o que importa</small></span><span><b>Poder de consciência e comunicação</b><small>informações claras para toda a equipe trabalhar alinhada</small></span><span><b>Poder pessoal</b><small>autonomia para compreender, decidir e agir com segurança</small></span></div>
        </div>
        <div className="showcase-grid">
          <article>
            <div className="app-preview dashboard-preview" aria-label="Exemplo do painel de visão geral">
              <div className="preview-top"><i></i><i></i><i></i><span>Visão geral</span></div>
              <div className="preview-shell"><aside><b>V+</b><em></em><em></em><em></em><em></em></aside><div><small>PAINEL EM TEMPO REAL</small><h4>Visão geral</h4><div className="preview-metrics"><span><small>Faturamento</small><b>R$ 28.450</b></span><span><small>Vendas</small><b>814</b></span><span><small>Estoque</small><b>2.397</b></span></div><div className="preview-chart"><i></i><i></i><i></i><i></i><i></i><i></i></div></div></div>
            </div>
            <div className="showcase-copy"><span>01 · DECISÃO</span><h3>Enxergue o negócio inteiro</h3><p>Faturamento, vendas, produtos e estoque aparecem juntos. Você entende o que está acontecendo sem depender de várias planilhas ou conferências demoradas.</p></div>
          </article>
          <article>
            <div className="app-preview pdv-preview" aria-label="Exemplo da tela de vendas PDV">
              <div className="preview-top"><i></i><i></i><i></i><span>PDV</span></div>
              <div className="pdv-screen"><div><small>PRODUTOS</small><div className="preview-products"><span><i></i><b>Café</b><small>R$ 8,00</small></span><span><i></i><b>Suco</b><small>R$ 9,00</small></span><span><i></i><b>Lanche</b><small>R$ 18,00</small></span><span><i></i><b>Água</b><small>R$ 5,00</small></span></div></div><aside><small>VENDA ATUAL</small><p><span>Lanche × 2</span><b>R$ 36,00</b></p><p><span>Suco × 1</span><b>R$ 9,00</b></p><strong><span>Total</span>R$ 45,00</strong><button>Finalizar venda</button></aside></div>
            </div>
            <div className="showcase-copy"><span>02 · VELOCIDADE</span><h3>Venda rápido e atualize tudo</h3><p>O operador registra a venda em poucos passos. No mesmo momento, o caixa recebe a movimentação e o estoque baixa automaticamente.</p></div>
          </article>
          <article>
            <div className="app-preview stock-preview" aria-label="Exemplo da tela de controle de estoque">
              <div className="preview-top"><i></i><i></i><i></i><span>Estoque</span></div>
              <div className="stock-screen"><small>CONTROLE DE ESTOQUE</small><h4>Saldos e movimentações</h4><div><span><b>Produto</b><b>Saldo</b><b>Situação</b></span><span><i>Original 350ml</i><b>100</b><em>Disponível</em></span><span><i>Heineken 350ml</i><b>18</b><em>Atenção</em></span><span><i>Água 500ml</i><b>64</b><em>Disponível</em></span></div></div>
            </div>
            <div className="showcase-copy"><span>03 · CONTROLE</span><h3>Saiba o que entra e o que sai</h3><p>Consulte saldos, registre entradas e ajustes e identifique itens que precisam de atenção. Mais clareza para comprar melhor e reduzir perdas.</p></div>
          </article>
        </div>
        <div className="showcase-cta"><div><strong>Não é apenas um sistema. É uma visão mais clara da sua empresa.</strong><span>Teste com seus próprios produtos, equipe e rotina durante 7 dias.</span></div><a href="/teste">Quero ver funcionando</a></div>
      </section>
      <section className="segment-section" id="segmentos" aria-labelledby="segment-title">
        <div className="section-heading"><small>FEITO PARA QUEM VENDE TODOS OS DIAS</small><h2 id="segment-title">Uma operação organizada, seja qual for o seu balcão.</h2><p>O Venda+ se adapta à rotina de negócios que precisam vender com agilidade e manter produtos, equipe e caixa organizados.</p></div>
        <div className="segment-grid"><article><span>01</span><h3>Restaurantes</h3><p>Registre pedidos e acompanhe vendas, produtos e movimentações do dia.</p></article><article><span>02</span><h3>Bares</h3><p>Ganhe velocidade no atendimento e veja o estoque baixar automaticamente.</p></article><article><span>03</span><h3>Adegas</h3><p>Controle variedade, quantidade, preços e acesso da equipe em uma única tela.</p></article><article><span>04</span><h3>Lojas</h3><p>Centralize catálogo, caixa, filiais e indicadores para decidir com mais clareza.</p></article><article><span>05</span><h3>Advogados e contratos</h3><p>Organize serviços, responsáveis, recebimentos e acessos conforme o fluxo do escritório.</p></article><article><span>06</span><h3>Consultórios</h3><p>Acompanhe serviços, recebimentos, equipe e unidades em um ambiente centralizado.</p></article><article><span>07</span><h3>Materiais para construção</h3><p>Controle um catálogo amplo, movimentações de estoque, caixa e diferentes usuários.</p></article><article><span>08</span><h3>Locadoras de veículos</h3><p>Adapte cadastros, cobranças, responsáveis e filiais ao processo da sua operação.</p></article></div>
      </section>
      <section className="value-section" id="recursos" aria-labelledby="valor-venda-mais">
        <div className="value-intro"><small>CONTROLE QUE GERA VALOR</small><h2 id="valor-venda-mais">Transforme cada venda em informação para decidir melhor.</h2><p>O Venda+ reúne a operação em painéis simples: o caixa registra, o estoque acompanha, a gestão compara e você controla acessos, filiais e resultados de onde estiver.</p></div>
        <div className="value-numbers"><article><strong>R$ 105 mil</strong><span>em vendas acompanhadas por mês</span><p>Exemplo: 100 vendas por dia, com ticket médio de R$ 35, durante 30 dias.</p></article><article><strong>R$ 2,1 mil</strong><span>de valor potencialmente preservado</span><p>Simulação ilustrativa de uma redução de 2% em perdas sobre R$ 105 mil.</p></article><article><strong>7,5 horas</strong><span>liberadas no fechamento mensal</span><p>Exemplo de economia de 15 minutos por dia com caixa e indicadores organizados.</p></article></div>
        <small className="simulation-note">Os números são exemplos ilustrativos e não representam garantia de faturamento ou economia.</small>
        <div className="feature-panels"><article><b>01</b><h3>Venda e recebimento</h3><p>PDV ágil, carrinho, formas de pagamento, histórico e baixa automática do estoque.</p></article><article><b>02</b><h3>Gestão por painéis</h3><p>Faturamento, quantidade de vendas, produtos e estoque reunidos para leitura rápida.</p></article><article><b>03</b><h3>Controle operacional</h3><p>Caixa, entradas, retiradas, ajustes, filiais e perfis de acesso separados por responsabilidade.</p></article><article><b>04</b><h3>Acesso seguro</h3><p>Contas individuais, permissões por função, bloqueio administrativo e histórico de alterações.</p></article><article><b>05</b><h3>Suporte 24 horas</h3><p>Acompanhamento contínuo para dúvidas e situações importantes da operação.</p></article><article><b>06</b><h3>Em qualquer tela</h3><p>Use pelo computador, tablet ou celular, mantendo as informações centralizadas.</p></article></div>
      </section>
      <section className="operation-section" id="como-funciona" aria-labelledby="operation-title">
        <div className="section-heading"><small>DA VENDA À DECISÃO</small><h2 id="operation-title">Tudo conectado para você trabalhar com menos retrabalho.</h2></div>
        <div className="operation-flow"><article><b>1</b><div><h3>Registre a venda</h3><p>O operador seleciona os produtos e a forma de pagamento no PDV.</p></div></article><i>→</i><article><b>2</b><div><h3>Atualize o estoque</h3><p>Os itens vendidos são baixados automaticamente, sem lançar duas vezes.</p></div></article><i>→</i><article><b>3</b><div><h3>Acompanhe o caixa</h3><p>Abertura, vendas, suprimentos e retiradas ficam reunidos para conferência.</p></div></article><i>→</i><article><b>4</b><div><h3>Decida pelos números</h3><p>O painel apresenta faturamento, vendas, produtos e unidades disponíveis.</p></div></article></div>
      </section>
      <section className="control-highlight">
        <div><small>CONTROLE SEM PRENDER VOCÊ AO BALCÃO</small><h2>Veja sua operação de onde estiver.</h2><p>Separe usuários por função, administre filiais e consulte os principais indicadores em uma interface preparada para computador, tablet e celular.</p><ul><li>Administrador, gerente, caixa e estoque com acessos próprios</li><li>Dados e configurações isolados para cada empresa</li><li>Histórico de alterações administrativas</li><li>Monitoramento e suporte 24 horas</li></ul></div>
        <aside><span>PAINEL EM TEMPO REAL</span><strong>Vendas + Estoque + Caixa</strong><p>Uma visão centralizada reduz conferências manuais e ajuda a identificar diferenças antes que elas cresçam.</p><a href="/teste">Começar meus 7 dias grátis</a></aside>
      </section>
      <Pricing />
      <ErpSurvey />
      <section className="public-faq" aria-labelledby="faq-title">
        <div className="section-heading"><small>PERGUNTAS FREQUENTES</small><h2 id="faq-title">Comece com tranquilidade.</h2></div>
        <div><details open><summary>Preciso instalar alguma coisa?</summary><p>Não. O Venda+ funciona pelo navegador no computador, tablet ou celular.</p></details><details><summary>Quando começam os 7 dias grátis?</summary><p>Depois do seu cadastro ser analisado e liberado, o período de teste começa a contar.</p></details><details><summary>Meus dados ficam misturados com os de outra empresa?</summary><p>Não. Cada empresa possui ambiente, usuários, dados e configurações independentes.</p></details><details><summary>Consigo controlar quem acessa o sistema?</summary><p>Sim. Você cria usuários e define funções como administrador, gerente, caixa ou estoque.</p></details></div>
      </section>
      <section className="final-cta"><small>PRONTO PARA ORGANIZAR SUA OPERAÇÃO?</small><h2>Teste o Venda+ gratuitamente por 7 dias.</h2><p>Cadastre sua empresa sem compromisso e conheça o sistema com acompanhamento da nossa equipe.</p><a href="/teste">Quero testar o Venda+</a><span>Sem cobrança para solicitar o teste.</span></section>
      <footer className="public-footer">
        <div>
          <strong>
            <BrandName /> <OmegaCredit />
          </strong>
          <p>Sistema de vendas e gestão de estoque para restaurantes, bares, adegas e lojas.</p>
        </div>
        <div>
          <strong>Recursos</strong>
          <a href="#recursos">PDV e estoque</a>
          <a href="#como-funciona">Como funciona</a>
          <a href="/teste">Teste grátis</a>
        </div>
        <div>
          <strong>Atendimento</strong>
          <a href="#suporte">Suporte 24 horas</a>
          <a href="https://wa.me/5511978436640?text=Ol%C3%A1%2C%20quero%20saber%20mais%20sobre%20o%20Venda%2B." target="_blank" rel="noopener noreferrer">WhatsApp: +55 11 97843-6640</a>
          <span>Ambiente seguro e monitorado</span>
          <a href="/privacidade">Privacidade e dados de acesso</a>
        </div>
        <small>
          © {new Date().getFullYear()} Venda+. Todos os direitos
          reservados.
        </small>
      </footer>
    </div>
  );
}
function Overview({
  summary,
  onNavigate,
  page,
}: {
  summary: Summary;
  onNavigate: (p: string) => void;
  page: string;
}) {
  if (page === "Fiscal") return <CommercialFiscal />;
  if (page !== "Visão geral")
    return (
      <div className="empty">
        <h2>{page}</h2>
        <p>
          Este módulo será implementado depois da operação de vendas e estoque.
        </p>
      </div>
    );
  const metrics = [
    [
      "Faturamento",
      summary.revenue.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      }),
    ],
    ["Vendas", String(summary.orders)],
    ["Itens em estoque", String(summary.stockUnits)],
    ["Produtos", String(summary.products)],
  ];
  return (
    <>
      <div className="notice">
        <strong>Operação conectada</strong>
        <span>Vendas realizadas no PDV baixam o estoque automaticamente.</span>
      </div>
      <div className="metrics">
        {metrics.map(([label, value]) => (
          <article key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>Dados reais da demonstração</small>
          </article>
        ))}
      </div>
      <div className="modules">
        {[
          ["PDV", "Realize uma venda"],
          ["Estoque", "Consulte e ajuste saldos"],
          ["Produtos", "Cadastre novos itens"],
        ].map(([name, description], i) => (
          <article key={name} onClick={() => onNavigate(name)}>
            <i>{`0${i + 1}`}</i>
            <div>
              <h3>{name}</h3>
              <p>{description}</p>
            </div>
            <b>→</b>
          </article>
        ))}
      </div>
    </>
  );
}
function Products({
  products,
  token,
  onCreated,
}: {
  products: Product[];
  token: string;
  onCreated: () => void;
}) {
  const [open, setOpen] = useState(false),
    [importOpen, setImportOpen] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      const product = await request<Product>("/products", token, {
        method: "POST",
        body: JSON.stringify({
          sku: form.get("sku"),
          name: form.get("name"),
          price: Number(form.get("price")),
          ncm: form.get("ncm") || undefined,
        }),
      });
      const quantity = Number(form.get("quantity"));
      if (quantity > 0)
        await request("/inventory/adjustments", token, {
          method: "POST",
          body: JSON.stringify({
            productId: product.id,
            quantity,
            note: "Estoque inicial",
          }),
        });
      setOpen(false);
      setError("");
      onCreated();
    } catch (err) {
      setError((err as Error).message);
    }
  }
  async function importList(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget),
      quantity = Number(f.get("quantity")),
      lines = String(f.get("list") ?? "")
        .split(/\r?\n/)
        .map((x) => x.trim())
        .filter(Boolean);
    try {
      const batch = Date.now().toString(36).toUpperCase(),
        items = lines.map((line, index) => {
          const match = line.match(/^(.*?)\s+R\$\s*([\d.,]+)$/i);
          if (!match)
            throw Error(`Linha ${index + 1} inválida: use Nome R$ 0,00`);
          const price = Number(match[2].replace(/\./g, "").replace(",", "."));
          if (!Number.isFinite(price))
            throw Error(`Preço inválido na linha ${index + 1}`);
          const name = match[1].trim().replace(/(\d)\s+ml\b/gi, "$1ml");
          return {
            sku: `IMP-${batch}-${String(index + 1).padStart(3, "0")}`,
            name,
            price,
            quantity,
          };
        });
      const result = await request<{ created: number }>(
        "/products/import",
        token,
        { method: "POST", body: JSON.stringify({ items }) },
      );
      setImportOpen(false);
      setMessage(
        `${result.created} produtos importados com ${quantity} unidades cada.`,
      );
      setError("");
      onCreated();
    } catch (err) {
      setError((err as Error).message);
    }
  }
  return (
    <>
      <div className="toolbar">
        <p>{products.length} produtos cadastrados</p>
        <div className="toolbar-actions">
          <button
            className="secondary"
            onClick={() => {
              setImportOpen(!importOpen);
              setOpen(false);
            }}
          >
            {importOpen ? "Cancelar importação" : "Importar lista"}
          </button>
          <button
            onClick={() => {
              setOpen(!open);
              setImportOpen(false);
            }}
          >
            {open ? "Cancelar" : "Novo produto"}
          </button>
        </div>
      </div>
      {error && <div className="error">{error}</div>}
      {message && <div className="success">{message}</div>}
      {importOpen && (
        <form className="bulk-import" onSubmit={importList}>
          <label>
            Produtos, um por linha
            <textarea
              name="list"
              rows={10}
              placeholder="Original Lata 350ml R$ 6,00"
              required
            />
          </label>
          <label>
            Quantidade inicial
            <input
              name="quantity"
              type="number"
              min="0"
              step="0.001"
              defaultValue="100"
              required
            />
          </label>
          <button>Importar produtos</button>
          <small>
            Formato: Nome do produto R$ 0,00. Espaços antes de “ml” são
            removidos automaticamente.
          </small>
        </form>
      )}
      {open && (
        <form className="product-form product-form-wide" onSubmit={submit}>
          <label>
            SKU
            <input name="sku" required />
          </label>
          <label>
            Nome
            <input name="name" required minLength={2} />
          </label>
          <label>
            Preço
            <input name="price" type="number" min="0" step="0.01" required />
          </label>
          <label>
            Quantidade inicial
            <input
              name="quantity"
              type="number"
              min="0"
              step="0.001"
              defaultValue="0"
              required
            />
          </label>
          <label>
            NCM
            <input name="ncm" minLength={8} maxLength={8} />
          </label>
          <button>Salvar produto</button>
        </form>
      )}
      <div className="table products-table">
        <div className="product-row head">
          <span>SKU</span>
          <span>Produto</span>
          <span>NCM</span>
          <span>Preço</span>
          <span>Quantidade</span>
          <span>Cadastro</span>
        </div>
        {products.map((p) => (
          <div className="product-row" key={p.id}>
            <span>{p.sku}</span>
            <strong>{p.name}</strong>
            <span>{p.ncm ?? "—"}</span>
            <span>{money(p.price)}</span>
            <b>{p.quantity ?? 0}</b>
            <time>{new Date(p.createdAt).toLocaleString("pt-BR")}</time>
          </div>
        ))}
      </div>
    </>
  );
}
function Inventory({
  token,
  onChange,
}: {
  token: string;
  onChange: () => void;
}) {
  const [stock, setStock] = useState<Stock[]>([]);
  const [movements, setMovements] = useState<
    Array<{
      id: string;
      product: string;
      type: string;
      quantity: number;
      note: string;
      createdAt: string;
    }>
  >([]);
  const [error, setError] = useState("");
  const load = useCallback(
    () =>
      Promise.all([
        request<Stock[]>("/inventory", token),
        request<typeof movements>("/inventory/movements", token),
      ]).then(([s, m]) => {
        setStock(s);
        setMovements(m);
      }),
    [token],
  );
  useEffect(() => {
    void load();
  }, [load]);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const target = e.currentTarget;
    const form = new FormData(target);
    try {
      await request("/inventory/adjustments", token, {
        method: "POST",
        body: JSON.stringify({
          productId: form.get("productId"),
          quantity: Number(form.get("quantity")),
          note: form.get("note"),
        }),
      });
      setError("");
      await load();
      onChange();
      target.reset();
    } catch (err) {
      setError((err as Error).message);
    }
  }
  return (
    <>
      <form className="stock-form" onSubmit={submit}>
        {error && <div className="error">{error}</div>}
        <label>
          Produto
          <select name="productId" required>
            <option value="">Selecione</option>
            {stock.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — saldo {p.quantity}
              </option>
            ))}
          </select>
        </label>
        <label>
          Quantidade
          <input
            name="quantity"
            type="number"
            step="0.001"
            placeholder="Use negativo para saída"
            required
          />
        </label>
        <label>
          Motivo
          <input name="note" defaultValue="Entrada de mercadoria" required />
        </label>
        <button>Registrar movimento</button>
      </form>
      <h2 className="subtitle">Saldos</h2>
      <div className="stock-grid">
        {stock.map((p) => (
          <article key={p.id}>
            <span>{p.sku}</span>
            <strong>{p.name}</strong>
            <b className={p.quantity <= 5 ? "low" : ""}>{p.quantity}</b>
            <small>unidades</small>
          </article>
        ))}
      </div>
      <h2 className="subtitle">Últimos movimentos</h2>
      <div className="table">
        <div className="movement head">
          <span>Produto</span>
          <span>Tipo</span>
          <span>Quantidade</span>
          <span>Motivo</span>
        </div>
        {movements.slice(0, 8).map((m) => (
          <div className="movement" key={m.id}>
            <strong>{m.product}</strong>
            <span>{m.type}</span>
            <span className={m.quantity < 0 ? "negative" : "positive"}>
              {m.quantity > 0 ? "+" : ""}
              {m.quantity}
            </span>
            <span>{m.note}</span>
          </div>
        ))}
      </div>
    </>
  );
}
function Pdv({
  token,
  products,
  onSale,
}: {
  token: string;
  products: Product[];
  onSale: () => void;
}) {
  const [stock, setStock] = useState<Stock[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [orders, setOrders] = useState<Order[]>([]);
  const [method, setMethod] = useState("PIX");
  const [message, setMessage] = useState("");
  const load = useCallback(
    () =>
      Promise.all([
        request<Stock[]>("/inventory", token),
        request<Order[]>("/sales/orders", token),
      ]).then(([s, o]) => {
        setStock(s);
        setOrders(o);
      }),
    [token],
  );
  useEffect(() => {
    void load();
  }, [load]);
  const total = products.reduce(
    (sum, p) => sum + (cart[p.id] ?? 0) * p.price,
    0,
  );
  async function checkout() {
    try {
      const items = Object.entries(cart)
        .filter(([, quantity]) => quantity > 0)
        .map(([productId, quantity]) => ({ productId, quantity }));
      const order = await request<Order>("/sales/checkout", token, {
        method: "POST",
        body: JSON.stringify({ items, paymentMethod: method }),
      });
      setCart({});
      setMessage(`Venda #${order.number} concluída — ${money(order.total)}`);
      await load();
      onSale();
    } catch (err) {
      setMessage((err as Error).message);
    }
  }
  return (
    <div className="pdv">
      <section>
        <div className="product-cards">
          {stock.map((p) => (
            <button
              key={p.id}
              disabled={p.quantity <= 0}
              onClick={() =>
                setCart((old) => ({ ...old, [p.id]: (old[p.id] ?? 0) + 1 }))
              }
            >
              <small>{p.sku}</small>
              <strong>{p.name}</strong>
              <span>{money(p.price)}</span>
              <i>Saldo: {p.quantity}</i>
            </button>
          ))}
        </div>
        <h2 className="subtitle">Vendas recentes</h2>
        {orders.slice(0, 5).map((o) => (
          <div className="order" key={o.id}>
            <span>#{o.number}</span>
            <strong>{money(o.total)}</strong>
            <small>{o.paymentMethod}</small>
          </div>
        ))}
      </section>
      <aside className="cart">
        <h2>Venda atual</h2>
        {products
          .filter((p) => cart[p.id])
          .map((p) => (
            <div className="cart-item" key={p.id}>
              <span>{p.name}</span>
              <div>
                <button
                  onClick={() =>
                    setCart((old) => ({
                      ...old,
                      [p.id]: Math.max(0, old[p.id] - 1),
                    }))
                  }
                >
                  −
                </button>
                <b>{cart[p.id]}</b>
                <button
                  onClick={() =>
                    setCart((old) => ({ ...old, [p.id]: old[p.id] + 1 }))
                  }
                >
                  +
                </button>
              </div>
              <strong>{money(p.price * cart[p.id])}</strong>
            </div>
          ))}
        {!Object.values(cart).some(Boolean) && (
          <p className="muted">Clique em um produto para adicionar.</p>
        )}
        <div className="total">
          <span>Total</span>
          <strong>{money(total)}</strong>
        </div>
        <label>
          Pagamento
          <select value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="PIX">PIX</option>
            <option value="DINHEIRO">Dinheiro</option>
            <option value="CREDITO">Crédito</option>
            <option value="DEBITO">Débito</option>
          </select>
        </label>
        <button disabled={total === 0} onClick={checkout}>
          Finalizar venda
        </button>
        {message && (
          <div className={message.startsWith("Venda") ? "success" : "error"}>
            {message}
          </div>
        )}
      </aside>
    </div>
  );
}
function Cash({ token, onChange }: { token: string; onChange: () => void }) {
  type State = {
    session: null | { id: string; openedAt: string };
    summary: null | {
      expectedCash: number;
      sales: number;
      supplies: number;
      withdrawals: number;
      byPayment: Record<string, number>;
    };
    movements: Array<{
      id: string;
      type: string;
      amount: number;
      note: string;
    }>;
  };
  const [state, setState] = useState<State>({
    session: null,
    summary: null,
    movements: [],
  });
  const [error, setError] = useState("");
  const load = useCallback(
    () => request<State>("/cash/current", token).then(setState),
    [token],
  );
  useEffect(() => {
    void load();
  }, [load]);
  async function action(path: string, body: object) {
    try {
      await request(`/cash/${path}`, token, {
        method: "POST",
        body: JSON.stringify(body),
      });
      setError("");
      await load();
      onChange();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  if (!state.session)
    return (
      <div className="detail">
        <h2>Caixa fechado</h2>
        <p>Abra o caixa antes de realizar vendas.</p>
        {error && <div className="error">{error}</div>}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            void action("open", { openingAmount: Number(f.get("amount")) });
          }}
        >
          <label>
            Fundo de troco
            <input
              name="amount"
              type="number"
              min="0"
              step="0.01"
              defaultValue="100"
            />
          </label>
          <button>Abrir caixa</button>
        </form>
      </div>
    );
  return (
    <>
      <div className="cash-summary">
        <article>
          <span>Vendas</span>
          <strong>{money(state.summary?.sales ?? 0)}</strong>
        </article>
        <article>
          <span>Dinheiro esperado</span>
          <strong>{money(state.summary?.expectedCash ?? 0)}</strong>
        </article>
        <article>
          <span>Suprimentos</span>
          <strong>{money(state.summary?.supplies ?? 0)}</strong>
        </article>
        <article>
          <span>Sangrias</span>
          <strong>{money(state.summary?.withdrawals ?? 0)}</strong>
        </article>
      </div>
      {error && <div className="error">{error}</div>}
      <div className="cash-actions">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            void action("movements", {
              type: f.get("type"),
              amount: Number(f.get("amount")),
              note: f.get("note"),
            });
          }}
        >
          <select name="type">
            <option value="SUPPLY">Suprimento</option>
            <option value="WITHDRAWAL">Sangria</option>
          </select>
          <input
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Valor"
            required
          />
          <input name="note" placeholder="Motivo" required />
          <button>Registrar</button>
        </form>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            void action("close", { declaredAmount: Number(f.get("declared")) });
          }}
        >
          <input
            name="declared"
            type="number"
            min="0"
            step="0.01"
            placeholder="Dinheiro contado"
            required
          />
          <button>Fechar caixa</button>
        </form>
      </div>
      <h2 className="subtitle">Movimentos do caixa</h2>
      <div className="table">
        {state.movements.map((m) => (
          <div className="movement" key={m.id}>
            <strong>{m.type}</strong>
            <span>{money(m.amount)}</span>
            <span>{m.note}</span>
          </div>
        ))}
      </div>
    </>
  );
}
function Users({ token, roles }: { token: string; roles: string[] }) {
  const [users, setUsers] = useState<
      Array<{
        id: string;
        name: string;
        email: string;
        access?: string;
        roles: string[];
        status?: string;
      }>
    >([]),
    [open, setOpen] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const load = useCallback(
    () => request<typeof users>("/auth/users", token).then(setUsers),
    [token],
  );
  useEffect(() => {
    void load();
  }, [load]);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const target = e.currentTarget,
      f = new FormData(target);
    try {
      await request("/auth/users", token, {
        method: "POST",
        body: JSON.stringify({
          name: f.get("name"),
          username: f.get("username"),
          password: f.get("password"),
          role: f.get("role"),
        }),
      });
      target.reset();
      setOpen(false);
      setError("");
      setMessage("Usuário criado com sucesso.");
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  }
  const labels: Record<string, string> = {
    ADMIN: "Administrador",
    MANAGER: "Gerente",
    CASHIER: "Caixa",
    STOCK: "Estoque",
  };
  return (
    <>
      {error && <div className="error">{error}</div>}
      {message && <div className="success">{message}</div>}
      <div className="toolbar">
        <p>{users.length} usuário(s) cadastrado(s)</p>
        <button onClick={() => setOpen((v) => !v)}>
          {open ? "Cancelar" : "Novo usuário"}
        </button>
      </div>
      {open && (
        <form className="user-form" onSubmit={submit}>
          <label>
            Nome
            <input name="name" minLength={2} required />
          </label>
          <label>
            Nome de acesso
            <input
              name="username"
              minLength={3}
              maxLength={30}
              pattern="[a-z0-9._-]+"
              placeholder="Ex.: carlos.caixa"
              required
            />
          </label>
          <label>
            Senha provisória
            <input name="password" type="password" minLength={8} required />
          </label>
          <label>
            Perfil
            <select name="role">
              <option value="CASHIER">Caixa</option>
              <option value="STOCK">Estoque</option>
              {roles.includes("ADMIN") && (
                <option value="MANAGER">Gerente</option>
              )}
              {roles.includes("ADMIN") && (
                <option value="ADMIN">Administrador</option>
              )}
            </select>
          </label>
          <button>Criar usuário</button>
        </form>
      )}
      <div className="table">
        <div className="row users head">
          <span>Nome</span>
          <span>Acesso</span>
          <span>Perfil</span>
        </div>
        {users.map((u) => (
          <div className="row users" key={u.id}>
            <strong>{u.name}</strong>
            <span>{u.access ?? u.email}</span>
            <span>
              {u.roles.map((role) => labels[role] ?? role).join(", ")}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
function Branch({
  session,
  onSelect,
}: {
  session: Session;
  onSelect: (branch: BranchInfo) => void;
}) {
  type FullBranch = BranchInfo & {
    taxId: string;
    cityCode: string;
    taxRegime: string;
    stateRegistration: string;
  };
  const [branches, setBranches] = useState<FullBranch[]>([]),
    [open, setOpen] = useState(false),
    [error, setError] = useState("");
  const load = useCallback(
    () =>
      request<FullBranch[]>("/branches", session.accessToken).then(setBranches),
    [session.accessToken],
  );
  useEffect(() => {
    void load();
  }, [load]);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const target = e.currentTarget,
      f = new FormData(target);
    try {
      const created = await request<FullBranch>(
        "/branches",
        session.accessToken,
        {
          method: "POST",
          body: JSON.stringify({
            name: f.get("name"),
            taxId: f.get("taxId"),
            state: f.get("state"),
            cityCode: f.get("cityCode"),
            taxRegime: f.get("taxRegime"),
            stateRegistration: f.get("stateRegistration"),
          }),
        },
      );
      const all = [...branches, created],
        next = {
          ...session,
          tenant: {
            ...session.tenant,
            branches: all.map(({ id, name, state }) => ({ id, name, state })),
            branch: {
              id: created.id,
              name: created.name,
              state: created.state,
            },
          },
        };
      localStorage.setItem("varejo-session", JSON.stringify(next));
      setBranches(all);
      onSelect(next.tenant.branch);
      setOpen(false);
      setError("");
      target.reset();
    } catch (err) {
      setError((err as Error).message);
    }
  }
  return (
    <>
      {error && <div className="error">{error}</div>}
      <div className="toolbar">
        <p>{branches.length} filial(is) cadastrada(s)</p>
        <button onClick={() => setOpen((v) => !v)}>
          {open ? "Cancelar" : "Nova filial"}
        </button>
      </div>
      {open && (
        <form className="branch-form" onSubmit={submit}>
          <label>
            Nome da unidade
            <input name="name" required />
          </label>
          <label>
            CNPJ
            <input name="taxId" minLength={14} required />
          </label>
          <label>
            UF
            <select name="state">
              <option>SP</option>
              <option>RJ</option>
            </select>
          </label>
          <label>
            Código IBGE
            <input name="cityCode" minLength={7} maxLength={7} required />
          </label>
          <label>
            Inscrição estadual
            <input name="stateRegistration" required />
          </label>
          <label>
            Regime tributário
            <select name="taxRegime">
              <option value="SIMPLES_NACIONAL">Simples Nacional</option>
              <option value="REGIME_NORMAL">Regime normal</option>
            </select>
          </label>
          <button>Criar filial</button>
        </form>
      )}
      <div className="branch-grid">
        {branches.map((branch) => (
          <article
            className={branch.id === session.tenant.branch?.id ? "active" : ""}
            key={branch.id}
          >
            <small>{branch.state}</small>
            <h3>{branch.name}</h3>
            <p>
              CNPJ: {branch.taxId}
              <br />
              IE: {branch.stateRegistration}
              <br />
              IBGE: {branch.cityCode}
            </p>
            <button onClick={() => onSelect(branch)}>
              {branch.id === session.tenant.branch?.id
                ? "Filial selecionada"
                : "Usar esta filial"}
            </button>
          </article>
        ))}
      </div>
    </>
  );
}
function CommercialFiscal() {
  const [token] = useState(
    () =>
      JSON.parse(localStorage.getItem("varejo-session") ?? "{}")
        .accessToken as string,
  );
  const [settings, setSettings] = useState<{
    state: string;
    taxRegime: string;
  } | null>(null);
  const [docs, setDocs] = useState<
    Array<{
      id: string;
      orderNumber: number;
      model: string;
      status: string;
      number: number;
      accessKey: string;
    }>
  >([]);
  const [parties, setParties] = useState<
    Array<{ id: string; type: string; name: string; document: string }>
  >([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [msg, setMsg] = useState("");
  const load = useCallback(
    () =>
      Promise.all([
        request<typeof settings>("/commercial/fiscal/settings", token),
        request<typeof docs>("/commercial/fiscal/documents", token),
        request<typeof parties>("/commercial/parties", token),
        request<Order[]>("/sales/orders", token),
      ]).then(([s, d, p, o]) => {
        setSettings(s);
        setDocs(d);
        setParties(p);
        setOrders(o.filter((x) => x.status === "PAID"));
      }),
    [token],
  );
  useEffect(() => {
    void load();
  }, [load]);
  async function send(path: string, method: string, body: object) {
    try {
      await request(path, token, { method, body: JSON.stringify(body) });
      setMsg("Salvo com sucesso");
      await load();
    } catch (e) {
      setMsg((e as Error).message);
    }
  }
  return (
    <>
      <div className="notice">
        <strong>Homologação simulada</strong>
        <span>Nenhum documento desta tela é transmitido à SEFAZ.</span>
      </div>
      <div className="fiscal-grid">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            void send("/commercial/fiscal/settings", "PUT", {
              state: f.get("state"),
              taxRegime: f.get("taxRegime"),
              stateRegistration: f.get("ie"),
              cityCode: f.get("city"),
              nfeSeries: 1,
              nfceSeries: 1,
            });
          }}
        >
          <h3>Configuração fiscal</h3>
          <select name="state" defaultValue={settings?.state ?? "SP"}>
            <option>SP</option>
            <option>RJ</option>
          </select>
          <input
            name="taxRegime"
            defaultValue="SIMPLES_NACIONAL"
            placeholder="Regime"
          />
          <input name="ie" placeholder="Inscrição estadual" required />
          <input
            name="city"
            placeholder="Código IBGE (7 dígitos)"
            minLength={7}
            maxLength={7}
            required
          />
          <button>Salvar configuração</button>
        </form>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            void send("/commercial/parties", "POST", {
              type: f.get("type"),
              name: f.get("name"),
              document: f.get("document"),
            });
          }}
        >
          <h3>Cliente ou fornecedor</h3>
          <select name="type">
            <option value="CUSTOMER">Cliente</option>
            <option value="SUPPLIER">Fornecedor</option>
          </select>
          <input name="name" placeholder="Nome" required />
          <input name="document" placeholder="CPF ou CNPJ" required />
          <button>Cadastrar</button>
        </form>
      </div>
      {msg && <div className="success">{msg}</div>}
      <div className="toolbar">
        <p>{parties.length} clientes/fornecedores</p>
        <div className="issue">
          <select id="order">
            <option value="">Escolha uma venda</option>
            {orders.map((o) => (
              <option value={o.id} key={o.id}>
                Venda #{o.number} — {money(o.total)}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              const id = (document.getElementById("order") as HTMLSelectElement)
                .value;
              if (id)
                void send("/commercial/fiscal/issue", "POST", {
                  orderId: id,
                  model: "65",
                });
            }}
          >
            Simular NFC-e
          </button>
        </div>
      </div>
      <div className="table">
        <div className="row head">
          <span>Venda</span>
          <span>Modelo</span>
          <span>Status</span>
          <span>Número</span>
        </div>
        {docs.map((d) => (
          <div className="row" key={d.id}>
            <span>#{d.orderNumber}</span>
            <strong>{d.model === "65" ? "NFC-e" : "NF-e"}</strong>
            <span>{d.status}</span>
            <span>{d.number}</span>
          </div>
        ))}
      </div>
    </>
  );
}
const money = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const pagesFor = (roles: string[]) =>
  roles.includes("ADMIN") || roles.includes("MANAGER")
    ? [
        "Visão geral",
        "Caixa",
        "PDV",
        "Estoque",
        "Produtos",
        "Usuários",
        "Filial",
        "Fiscal",
      ]
    : roles.includes("STOCK")
      ? ["Visão geral", "Estoque", "Produtos"]
      : ["Visão geral", "Caixa", "PDV"];
