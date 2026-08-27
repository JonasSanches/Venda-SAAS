"use client";
import { FormEvent, useCallback, useEffect, useState } from "react";
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
function TrialRemaining({ status, expiresAt }: { status?: string; expiresAt?: string }) {
  const days = trialDays(expiresAt);
  if (status !== "TRIAL" || days === null) return null;
  return <strong className="trial-remaining">Você ainda tem {days} {days === 1 ? "dia grátis" : "dias grátis"}.</strong>;
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
          <span>V</span> VarejoOS
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
          <button className="account-action" onClick={() => setPasswordOpen(true)}>
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
              <TrialRemaining status={session.tenant.status} expiresAt={session.tenant.expiresAt} />
            </div>
            <h1>{page}</h1>
          </div>
          <div className="profile">
            <span>{session.user.name}</span>
            <small>{summary.cashOpen ? "Caixa aberto" : "Caixa fechado"}</small>
            <button className="mobile-password" onClick={() => setPasswordOpen(true)}>Alterar senha</button>
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
      {passwordOpen && <ChangePassword token={session.accessToken} onClose={() => setPasswordOpen(false)} />}
    </main>
  );
}
function ChangePassword({token,onClose}:{token:string;onClose:()=>void}){
  const[error,setError]=useState(""),[loading,setLoading]=useState(false);
  async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();const form=new FormData(e.currentTarget),currentPassword=String(form.get("currentPassword")??""),newPassword=String(form.get("newPassword")??""),confirmation=String(form.get("confirmation")??"");if(newPassword!==confirmation){setError("A confirmação não corresponde à nova senha");return}setLoading(true);try{await request("/auth/password",token,{method:"PATCH",body:JSON.stringify({currentPassword,newPassword})});alert("Senha alterada com sucesso.");onClose()}catch(err){setError((err as Error).message)}finally{setLoading(false)}}
  return <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Alterar minha senha"><form className="password-modal" onSubmit={submit}><div className="modal-title"><div><small>SEGURANÇA DA CONTA</small><h2>Alterar minha senha</h2></div><button type="button" className="secondary" onClick={onClose}>Fechar</button></div>{error&&<div className="error">{error}</div>}<label>Senha atual<input name="currentPassword" type="password" autoComplete="current-password" minLength={8} required/></label><label>Nova senha<input name="newPassword" type="password" autoComplete="new-password" minLength={12} required/><small>Utilize pelo menos 12 caracteres.</small></label><label>Confirmar nova senha<input name="confirmation" type="password" autoComplete="new-password" minLength={12} required/></label><button disabled={loading}>{loading?"Alterando...":"Salvar nova senha"}</button></form></div>
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
    <div className="login">
      <form onSubmit={submit}>
        <div className="brand dark">
          <span>V</span> VarejoOS
        </div>
        <h1>Entre na sua conta</h1>
        <p>Acesse a operação da sua empresa.</p>
        {error && <div className="error">{error}</div>}
        <label>
          E-mail ou nome de acesso
          <input
            name="access"
            type="text"
            defaultValue="admin@demo.com"
            required
          />
        </label>
        <label>
          Senha
          <input
            name="password"
            type="password"
            defaultValue="Demo@123"
            required
          />
        </label>
        <button disabled={loading}>{loading ? "Entrando..." : "Entrar"}</button>
        <small>Conta de teste preenchida automaticamente.</small>
      </form>
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
            <input name="username" minLength={3} maxLength={30} pattern="[a-z0-9._-]+" placeholder="Ex.: carlos.caixa" required />
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
              {roles.includes("ADMIN") && <option value="MANAGER">Gerente</option>}
              {roles.includes("ADMIN") && <option value="ADMIN">Administrador</option>}
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
