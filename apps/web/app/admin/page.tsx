"use client";
import { FormEvent, useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3101/api";
type Session = {
  accessToken: string;
  user: { name: string; email: string; roles: string[] };
};
type PlatformUser = {
  id: string;
  name: string;
  email: string;
  status: string;
  createdAt: string;
};

export default function Admin() {
  const [session, setSession] = useState<Session | null>(null),
    [items, setItems] = useState<any[]>([]),
    [users, setUsers] = useState<PlatformUser[]>([]),
    [q, setQ] = useState(""),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [showUser, setShowUser] = useState(false),
    [detail, setDetail] = useState<any | null>(null);
  async function call(path: string, body?: object) {
    if (!session) throw Error("Sessão expirada");
    const r = await fetch(API + path, {
        method: body ? "POST" : "GET",
        headers: {
          authorization: `Bearer ${session.accessToken}`,
          "content-type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
      }),
      j = await r.json().catch(() => ({}));
    if (!r.ok)
      throw Error(
        Array.isArray(j.message)
          ? j.message.join(", ")
          : (j.message ?? "Operação não concluída"),
      );
    return j;
  }
  async function load() {
    try {
      const [trials, platformUsers] = await Promise.all([
        call("/platform/trials"),
        call("/platform/users"),
      ]);
      setItems(trials);
      setUsers(platformUsers);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("varejo-session") ?? "null",
      );
      if (
        !saved?.accessToken ||
        !saved.user?.roles?.includes("PLATFORM_ADMIN")
      ) {
        location.replace("/");
        return;
      }
      setSession(saved);
    } catch {
      localStorage.removeItem("varejo-session");
      location.replace("/");
    }
  }, []);
  useEffect(() => {
    if (session) void load();
  }, [session]);
  async function extend(id: string) {
    const days = Number(prompt("Quantos dias deseja acrescentar?", "7"));
    if (days > 0) {
      await call(`/platform/trials/${id}/extend`, { days });
      await load();
    }
  }
  async function createUser(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const target = e.currentTarget,
      f = new FormData(target);
    try {
      await call("/platform/users", {
        name: f.get("name"),
        email: f.get("email"),
        password: f.get("password"),
      });
      target.reset();
      setShowUser(false);
      setMessage("Novo administrador criado com sucesso.");
      setError("");
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  }
  async function openDetail(id: string) {
    try {
      setDetail(await call(`/platform/trials/${id}`));
      setError("");
    } catch (err) {
      setError((err as Error).message);
    }
  }
  async function resetClientPassword(
    e: FormEvent<HTMLFormElement>,
    tenantId: string,
    userId: string,
  ) {
    e.preventDefault();
    const target = e.currentTarget,
      f = new FormData(target),
      newPassword = String(f.get("newPassword") ?? "");
    try {
      await call(`/platform/trials/${tenantId}/users/${userId}/password`, {
        newPassword,
      });
      target.reset();
      setMessage(
        "Senha provisória definida. Oriente o usuário a alterá-la depois de entrar.",
      );
      setError("");
    } catch (err) {
      setError((err as Error).message);
    }
  }
  function goHome() {
    localStorage.removeItem("varejo-session");
    location.href = "/";
  }
  const list = items.filter((x) =>
    `${x.name} ${x.document} ${x.user?.email ?? ""}`
      .toLowerCase()
      .includes(q.toLowerCase()),
  );
  if (!session)
    return (
      <div className="management">
        <p>Carregando monitor...</p>
      </div>
    );
  return (
    <div className="management">
      <header className="admin-header">
        <div>
          <small>ADMINISTRAÇÃO DA PLATAFORMA</small>
          <h1>Monitor de clientes</h1>
        </div>
        <div className="admin-identity">
          <div>
            <strong>{session.user.name}</strong>
            <small>{session.user.email}</small>
          </div>
          <button onClick={() => setShowUser((v) => !v)}>Novo usuário</button>
          <button className="secondary" onClick={goHome}>
            Tela inicial
          </button>
        </div>
      </header>
      {error && <div className="error">{error}</div>}
      {message && <div className="success">{message}</div>}
      {showUser && (
        <form className="admin-user-form" onSubmit={createUser}>
          <h2>Novo administrador</h2>
          <label>
            Nome
            <input name="name" minLength={2} required />
          </label>
          <label>
            E-mail
            <input name="email" type="email" required />
          </label>
          <label>
            Senha provisória
            <input name="password" type="password" minLength={12} required />
            <small>Mínimo de 12 caracteres.</small>
          </label>
          <div>
            <button type="submit">Criar usuário</button>
            <button
              type="button"
              className="secondary"
              onClick={() => setShowUser(false)}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
      <div className="cash-summary">
        <article>
          <span>Total</span>
          <strong>{items.length}</strong>
        </article>
        <article>
          <span>Em teste</span>
          <strong>{items.filter((x) => x.status === "TRIAL").length}</strong>
        </article>
        <article>
          <span>Ativos</span>
          <strong>{items.filter((x) => x.status === "ACTIVE").length}</strong>
        </article>
        <article>
          <span>Expirados</span>
          <strong>{items.filter((x) => x.status === "EXPIRED").length}</strong>
        </article>
      </div>
      <div className="toolbar">
        <input
          placeholder="Buscar cliente"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <span>{users.length} administrador(es) da plataforma</span>
      </div>
      <div className="trial-cards">
        {list.map((t) => (
          <article key={t.tenantId}>
            {t.logoDataUrl ? (
              <img className="client-logo" src={t.logoDataUrl} alt="" />
            ) : (
              <strong>{t.name}</strong>
            )}
            <b className={`status ${t.status.toLowerCase()}`}>{t.status}</b>
            <p>
              {t.name}
              <br />
              {t.user?.email}
              <br />
              {t.phone}
            </p>
            <small>
              Vencimento:{" "}
              {t.expiresAt
                ? new Date(t.expiresAt).toLocaleDateString("pt-BR")
                : "—"}
            </small>
            <button onClick={() => extend(t.tenantId)}>Estender dias</button>
            <button
              className="secondary"
              onClick={() => openDetail(t.tenantId)}
            >
              Ver cadastro completo
            </button>
            {t.status !== "ACTIVE" && (
              <button
                onClick={async () => {
                  await call(`/platform/trials/${t.tenantId}/activate`, {});
                  await load();
                }}
              >
                Ativar plano
              </button>
            )}
          </article>
        ))}
      </div>
      {detail && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <section className="client-detail">
            <header>
              <div>
                <small>CADASTRO DO CLIENTE</small>
                <h2>{detail.name}</h2>
              </div>
              <button className="secondary" onClick={() => setDetail(null)}>
                Fechar
              </button>
            </header>
            <div className="client-data">
              <div>
                <small>CNPJ</small>
                <strong>{detail.document || "—"}</strong>
              </div>
              <div>
                <small>Telefone</small>
                <strong>{detail.phone || "—"}</strong>
              </div>
              <div>
                <small>Cidade/UF</small>
                <strong>
                  {detail.city || "—"} · {detail.state || "—"}
                </strong>
              </div>
              <div>
                <small>Segmento</small>
                <strong>{segmentName(detail.segment)}</strong>
              </div>
              <div>
                <small>Status</small>
                <strong>{detail.status}</strong>
              </div>
              <div>
                <small>Início do teste</small>
                <strong>{date(detail.startsAt)}</strong>
              </div>
              <div>
                <small>Vencimento</small>
                <strong>{date(detail.expiresAt)}</strong>
              </div>
              <div>
                <small>Limites do teste</small>
                <strong>
                  {detail.limits?.users ?? "—"} usuários ·{" "}
                  {detail.limits?.branches ?? "—"} filial
                </strong>
              </div>
            </div>
            <h3>Filiais</h3>
            <div className="detail-list">
              {detail.branches?.map((branch: any) => (
                <article key={branch.id}>
                  <strong>{branch.name}</strong>
                  <span>
                    {branch.state} · IE:{" "}
                    {branch.stateRegistration || "não informada"} · Município
                    IBGE: {branch.cityCode || "não informado"}
                  </span>
                </article>
              ))}
            </div>
            <h3>Usuários da empresa</h3>
            <div className="detail-list">
              {detail.users?.map((user: any) => (
                <article key={user.id}>
                  <div>
                    <strong>{user.name}</strong>
                    <span>
                        {user.access ?? user.email} · {user.roles?.join(", ")} · {user.status}
                    </span>
                  </div>
                  <form
                    onSubmit={(e) =>
                      resetClientPassword(e, detail.tenantId, user.id)
                    }
                  >
                    <input
                      name="newPassword"
                      type="password"
                      minLength={12}
                      placeholder="Nova senha provisória"
                      required
                    />
                    <button>Trocar senha</button>
                  </form>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
const date = (value?: string) =>
  value ? new Date(value).toLocaleString("pt-BR") : "—";
const segmentName = (value?: string) =>
  ({ RESTAURANT: "Restaurante", BAR: "Bar", WINERY: "Adega", RETAIL: "Loja" })[
    value ?? ""
  ] ??
  value ??
  "—";
