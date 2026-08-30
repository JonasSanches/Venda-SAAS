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
type AnalyticsReport={summary:{total:number;uniqueVisitors:number;today:number};daily:Array<{day:string;visits:number}>;visits:Array<{id:string;visitedAt:string;ipAddress?:string;path:string;referrer?:string;device?:string;browser?:string;operatingSystem?:string;language?:string;timezone?:string;platform?:string;screenWidth?:number;screenHeight?:number;viewportWidth?:number;viewportHeight?:number;country?:string;region?:string;city?:string}>;pagination:{page:number;pageSize:number;total:number;totalPages:number}};
type SurveyResponse={id:string;submittedAt:string;name:string;company:string;contact:string;language?:string;ipAddress?:string;answers:Record<string,string[]>};

export default function Admin() {
  const [session, setSession] = useState<Session | null>(null),
    [items, setItems] = useState<any[]>([]),
    [users, setUsers] = useState<PlatformUser[]>([]),
    [q, setQ] = useState(""),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [showUser, setShowUser] = useState(false),
    [detail, setDetail] = useState<any | null>(null),
    [audit, setAudit] = useState<any[]>([]),
    [analytics,setAnalytics]=useState<AnalyticsReport|null>(null),
    [surveys,setSurveys]=useState<SurveyResponse[]>([]),
    [analyticsDays,setAnalyticsDays]=useState(30),
    [analyticsLoading,setAnalyticsLoading]=useState(false);
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
      const [trials, platformUsers, surveyResponses] = await Promise.all([
        call("/platform/trials"),
        call("/platform/users"),
        call("/analytics/surveys"),
      ]);
      setItems(trials);
      setUsers(platformUsers);
      setSurveys(surveyResponses);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function loadAnalytics(days=analyticsDays,page=1){setAnalyticsLoading(true);try{setAnalytics(await call(`/analytics?days=${days}&page=${page}`));setError("")}catch(e){setError((e as Error).message)}finally{setAnalyticsLoading(false)}}
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
    if (session) {void load();void loadAnalytics(30,1)}
  }, [session]);
  async function extend(id: string) {
    const value = prompt(
      "Ajuste os dias do teste. Use um número positivo para acrescentar ou negativo para retirar (ex.: 7 ou -3).",
      "7",
    );
    if (value === null) return;
    const days = Number(value);
    if (Number.isInteger(days) && days !== 0 && days >= -365 && days <= 365) {
      await call(`/platform/trials/${id}/extend`, { days });
      await load();
      if (detail?.tenantId === id) await openDetail(id);
      return;
    }
    alert("Informe um número inteiro de -365 a 365, exceto zero.");
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
      const [data, logs] = await Promise.all([
        call(`/platform/trials/${id}`),
        call(`/platform/trials/${id}/audit`),
      ]);
      setDetail(data);
      setAudit(logs);
      setError("");
    } catch (err) {
      setError((err as Error).message);
    }
  }
  async function refreshDetail(id: string) {
    const [data, logs] = await Promise.all([
      call(`/platform/trials/${id}`),
      call(`/platform/trials/${id}/audit`),
    ]);
    setDetail(data);
    setAudit(logs);
    await load();
  }
  async function updateClient(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      await call(`/platform/trials/${detail.tenantId}/update`, {
        name: f.get("name"),
        phone: f.get("phone"),
        city: f.get("city"),
        state: f.get("state"),
        segment: f.get("segment"),
      });
      await refreshDetail(detail.tenantId);
      setMessage("Cadastro atualizado com sucesso.");
      setError("");
    } catch (err) {
      setError((err as Error).message);
    }
  }
  async function changeClientStatus(status: string) {
    if (!confirm(`Confirma a alteração da conta para ${status}?`)) return;
    try {
      await call(`/platform/trials/${detail.tenantId}/status`, { status });
      await refreshDetail(detail.tenantId);
      setMessage("Situação da conta atualizada.");
      setError("");
    } catch (err) {
      setError((err as Error).message);
    }
  }
  async function changeUser(userId: string, path: string, body: object) {
    try {
      await call(
        `/platform/trials/${detail.tenantId}/users/${userId}/${path}`,
        body,
      );
      await refreshDetail(detail.tenantId);
      setMessage("Usuário atualizado com sucesso.");
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
      await refreshDetail(tenantId);
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
          <button className="secondary" onClick={()=>document.getElementById("visitas")?.scrollIntoView({behavior:"smooth"})}>Visitas</button>
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
      <section className="analytics-admin" id="visitas">
        <div className="analytics-title"><div><small>INTELIGÊNCIA DE ACESSO</small><h2>Painel de visitantes</h2><p>Visitas à página pública, teste gratuito e pagamento · horário de Brasília.</p></div><div><select value={analyticsDays} onChange={e=>{const days=Number(e.target.value);setAnalyticsDays(days);void loadAnalytics(days,1)}}><option value={7}>Últimos 7 dias</option><option value={30}>Últimos 30 dias</option><option value={90}>Últimos 90 dias</option><option value={365}>Último ano</option></select><button className="secondary" disabled={analyticsLoading} onClick={()=>void loadAnalytics(analyticsDays,analytics?.pagination.page??1)}>{analyticsLoading?"Atualizando...":"Atualizar"}</button></div></div>
        <div className="analytics-metrics"><article><small>VISITAS NO PERÍODO</small><strong>{analytics?.summary.total??0}</strong></article><article><small>VISITANTES ÚNICOS</small><strong>{analytics?.summary.uniqueVisitors??0}</strong></article><article><small>VISITAS HOJE</small><strong>{analytics?.summary.today??0}</strong></article></div>
        <div className="analytics-chart"><h3>Volume diário</h3><div>{analytics?.daily.length?analytics.daily.map(item=>{const max=Math.max(...analytics.daily.map(day=>day.visits),1);return <span key={item.day} title={`${item.day}: ${item.visits} visita(s)`}><i style={{height:`${Math.max(8,item.visits/max*100)}%`}}></i><small>{item.day.slice(5).replace("-","/")}</small></span>}):<p>Nenhuma visita registrada no período.</p>}</div></div>
        <div className="analytics-table-card"><div><h3>Acessos recentes</h3><p>{analytics?.pagination.total??0} registros no período</p></div><div className="analytics-table"><table><thead><tr><th>Data e hora</th><th>IP</th><th>Dispositivo</th><th>Localidade aproximada</th><th>Página</th><th>Origem</th></tr></thead><tbody>{analytics?.visits.map(visit=>{const location=[visit.city,visit.region,visit.country,visit.timezone].filter(Boolean).join(" · ");return <tr key={visit.id}><td>{new Date(visit.visitedAt).toLocaleString("pt-BR",{timeZone:"America/Sao_Paulo"})}</td><td><code>{visit.ipAddress||"—"}</code></td><td>{visit.device||visit.platform||"—"}<small>{[visit.browser,visit.operatingSystem,visit.language].filter(Boolean).join(" · ")}</small></td><td>{location||"Não informada"}</td><td>{visit.path}</td><td className="analytics-referrer">{visit.referrer||"Acesso direto"}</td></tr>})}</tbody></table>{!analytics?.visits.length&&<p className="analytics-empty">Nenhum acesso encontrado.</p>}</div>
        {analytics&&<div className="analytics-pagination"><button className="secondary" disabled={analyticsLoading||analytics.pagination.page<=1} onClick={()=>void loadAnalytics(analyticsDays,analytics.pagination.page-1)}>Anterior</button><span>Página {analytics.pagination.page} de {analytics.pagination.totalPages}</span><button className="secondary" disabled={analyticsLoading||analytics.pagination.page>=analytics.pagination.totalPages} onClick={()=>void loadAnalytics(analyticsDays,analytics.pagination.page+1)}>Próxima</button></div>}</div>
        <p className="analytics-privacy">🔒 IP e dados técnicos são de acesso exclusivo da administração e devem ser usados somente para segurança e análise, com retenção limitada.</p>
      </section>
      <section className="survey-admin" id="respostas">
        <div className="survey-admin-title"><div><small>PESQUISA DE NECESSIDADES</small><h2>Respostas do questionário</h2><p>{surveys.length} resposta(s) recebida(s), da mais recente para a mais antiga.</p></div><button className="secondary" onClick={()=>void load()}>Atualizar respostas</button></div>
        <div className="survey-response-list">{surveys.map(response=><details key={response.id}><summary><div><strong>{response.name} · {response.company}</strong><span>{response.contact}</span></div><small>{new Date(response.submittedAt).toLocaleString("pt-BR",{timeZone:"America/Sao_Paulo"})}</small></summary><div className="survey-response-data"><span><small>Contato</small><b>{response.contact}</b></span><span><small>Idioma</small><b>{response.language?.toUpperCase()||"—"}</b></span><span><small>IP</small><b>{response.ipAddress||"—"}</b></span>{Object.entries(response.answers).map(([key,values])=><span key={key}><small>{surveyAnswerLabel(key)}</small><b>{Array.isArray(values)&&values.length?values.join(", "):"Não respondeu"}</b></span>)}</div></details>)}{!surveys.length&&<p className="analytics-empty">As novas respostas aparecerão aqui automaticamente.</p>}</div>
      </section>
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
        <article>
          <span>Aguardando aprovação</span>
          <strong>{items.filter((x) => x.status === "PENDING").length}</strong>
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
            {t.status !== "PENDING" && (
              <button onClick={() => extend(t.tenantId)}>Ajustar dias de teste</button>
            )}
            <button
              className="secondary"
              onClick={() => openDetail(t.tenantId)}
            >
              Gerenciar cliente
            </button>
            {t.status !== "ACTIVE" && t.status !== "PENDING" && (
              <button
                onClick={async () => {
                  await call(`/platform/trials/${t.tenantId}/activate`, {});
                  await load();
                }}
              >
                Ativar plano
              </button>
            )}
            {t.status === "PENDING" && (
              <button
                onClick={async () => {
                  await call(`/platform/trials/${t.tenantId}/approve`, {});
                  await load();
                }}
              >
                Liberar 7 dias grátis
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
            <h3>Editar empresa</h3>
            <form className="client-edit-form" onSubmit={updateClient}>
              <label>
                Nome da empresa
                <input
                  name="name"
                  defaultValue={detail.name}
                  minLength={2}
                  required
                />
              </label>
              <label>
                Telefone
                <input
                  name="phone"
                  defaultValue={detail.phone}
                  minLength={10}
                  required
                />
              </label>
              <label>
                Cidade
                <input
                  name="city"
                  defaultValue={detail.city}
                  minLength={2}
                  required
                />
              </label>
              <label>
                Estado
                <select name="state" defaultValue={detail.state}>
                  <option value="SP">SP</option>
                  <option value="RJ">RJ</option>
                </select>
              </label>
              <label>
                Segmento
                <select name="segment" defaultValue={detail.segment}>
                  <option value="RESTAURANT">Restaurante</option>
                  <option value="BAR">Bar</option>
                  <option value="WINERY">Adega</option>
                  <option value="RETAIL">Loja</option>
                </select>
              </label>
              <button>Salvar alterações</button>
            </form>
            <h3>Controle da conta</h3>
            <div className="account-controls">
              <a className="payment-link" href={`/pagamento?cliente=${detail.tenantId}`} target="_blank" rel="noopener noreferrer">Gerar pagamento</a>
              <button onClick={() => changeClientStatus("ACTIVE")}>
                Ativar conta
              </button>
              <button
                className="secondary"
                onClick={() => changeClientStatus("TRIAL")}
              >
                Voltar para teste
              </button>
              <button
                className="danger"
                onClick={() => changeClientStatus("SUSPENDED")}
              >
                Suspender acesso
              </button>
              <button
                className="secondary"
                onClick={() => extend(detail.tenantId)}
              >
                Ajustar dias de teste
              </button>
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
                      {user.access ?? user.email} · {user.roles?.join(", ")} ·{" "}
                      {user.status}
                    </span>
                    <div className="admin-user-controls">
                      <select
                        aria-label="Perfil do usuário"
                        value={user.roles?.[0] ?? "CASHIER"}
                        onChange={(e) =>
                          changeUser(user.id, "role", { role: e.target.value })
                        }
                      >
                        <option value="ADMIN">Administrador</option>
                        <option value="MANAGER">Gerente</option>
                        <option value="CASHIER">Caixa</option>
                        <option value="STOCK">Estoque</option>
                      </select>
                      <button
                        className={user.status === "BLOCKED" ? "" : "danger"}
                        onClick={() =>
                          changeUser(user.id, "status", {
                            status:
                              user.status === "BLOCKED" ? "ACTIVE" : "BLOCKED",
                          })
                        }
                      >
                        {user.status === "BLOCKED" ? "Desbloquear" : "Bloquear"}
                      </button>
                    </div>
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
            <h3>Histórico administrativo</h3>
            <div className="audit-list">
              {audit.length === 0 ? (
                <p>Nenhuma alteração administrativa registrada ainda.</p>
              ) : (
                audit.map((log) => (
                  <article key={log.id}>
                    <strong>{auditLabel(log.action)}</strong>
                    <span>
                      {date(log.createdAt)} · {log.resource}
                      {log.resourceId ? ` · ${log.resourceId}` : ""}
                    </span>
                  </article>
                ))
              )}
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
const auditLabel = (action: string) =>
  ({
    TENANT_UPDATED: "Cadastro da empresa alterado",
    TENANT_STATUS_CHANGED: "Situação da conta alterada",
    PASSWORD_RESET: "Senha provisória redefinida",
    USER_STATUS_CHANGED: "Situação do usuário alterada",
    USER_ROLE_CHANGED: "Perfil do usuário alterado",
    TRIAL_EXTENDED: "Período de teste estendido",
    TRIAL_APPROVED: "Teste gratuito aprovado",
  })[action] ?? action;
const surveyAnswerLabels:Record<string,string>={priority:"Principais prioridades",problem:"Principal problema",manual:"Controles manuais atuais",users:"Quantidade de usuários",branches:"Unidades ou filiais",dashboard:"Informações desejadas no painel",mobile:"Importância do acesso móvel",automation:"Automações desejadas",support:"Suporte preferido",reason:"Motivo para trocar de sistema",budget:"Valor mensal considerado adequado",essential:"Função indispensável"};
const surveyAnswerLabel=(key:string)=>surveyAnswerLabels[key]??key;
