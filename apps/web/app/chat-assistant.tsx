"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type Message = { from: "bot" | "user"; text: string };
type Lang = "pt" | "en";

const copy = {
  pt: {
    welcome: "Olá! Sou o assistente do Venda Mais. Posso explicar os planos, recursos, teste grátis e como a solução se adapta ao seu negócio.",
    title: "Assistente Venda Mais",
    status: "Online • atendimento 24h",
    plans: "Planos",
    features: "Recursos",
    trial: "Teste grátis",
    support: "Suporte",
    placeholder: "Digite sua dúvida...",
    send: "Enviar",
    open: "Abrir atendimento",
  },
  en: {
    welcome: "Hi! I'm the Venda Mais assistant. I can explain plans, features, the free trial and how the solution adapts to your business.",
    title: "Venda Mais Assistant",
    status: "Online • 24/7 assistance",
    plans: "Plans",
    features: "Features",
    trial: "Free trial",
    support: "Support",
    placeholder: "Type your question...",
    send: "Send",
    open: "Open chat",
  },
};

function currentLanguage(): Lang {
  if (typeof window === "undefined") return "pt";
  return (localStorage.getItem("vendamais-language") === "en" || document.documentElement.lang === "en") ? "en" : "pt";
}

function answer(question: string, lang: Lang) {
  const value = question.toLocaleLowerCase("pt-BR");
  const has = (...terms: string[]) => terms.some((term) => value.includes(term));
  if (has("preço", "preco", "valor", "plano", "plan", "price", "cost"))
    return lang === "en"
      ? "We offer three monthly plans, all with 24/7 support: Essential — R$129; Performance — R$249; and Scale — R$499. I can explain which one best fits your operation."
      : "Temos três planos mensais, todos com suporte 24h: Essencial — R$ 129; Performance — R$ 249; e Escala — R$ 499. Posso explicar qual combina melhor com sua operação.";
  if (has("essencial", "essential", "129", "básico", "basico"))
    return lang === "en"
      ? "Essential — R$129/month: ideal for starting with POS, products, inventory, cash control, dashboards and secure user access. Includes 24/7 support."
      : "Essencial — R$ 129/mês: ideal para começar com PDV, produtos, estoque, caixa, indicadores e acessos seguros para a equipe. Inclui suporte 24h.";
  if (has("performance", "249", "médio", "medio", "professional"))
    return lang === "en"
      ? "Performance — R$249/month: for growing operations that need broader management, more users, branches, permissions and administrative control. Includes 24/7 support."
      : "Performance — R$ 249/mês: para operações em crescimento que precisam de gestão ampliada, mais usuários, filiais, permissões e controle administrativo. Inclui suporte 24h.";
  if (has("escala", "scale", "499", "premium", "rede", "franquia"))
    return lang === "en"
      ? "Scale — R$499/month: for businesses with multiple teams or locations that need centralized management, monitoring and a structure ready to expand. Includes 24/7 support."
      : "Escala — R$ 499/mês: para negócios com várias equipes ou unidades que precisam de gestão centralizada, monitoramento e estrutura preparada para expansão. Inclui suporte 24h.";
  if (has("teste", "grátis", "gratis", "trial", "free"))
    return lang === "en"
      ? "You can request a 7-day free trial. The period starts only after your registration is approved, so you don't lose trial time while waiting."
      : "Você pode solicitar 7 dias grátis. O período começa somente depois da aprovação do cadastro, assim você não perde dias enquanto aguarda.";
  if (has("suporte", "atendimento", "ajuda", "support", "help", "24"))
    return lang === "en"
      ? "Every plan includes 24/7 support to guide your team and assist with important operational situations."
      : "Todos os planos incluem suporte 24 horas para orientar sua equipe e acompanhar situações importantes da operação.";
  if (has("recurso", "funcionalidade", "função", "funcao", "feature", "function", "serviço", "servico", "service"))
    return lang === "en"
      ? "Venda Mais brings together POS, products, automatic inventory updates, cash control, management dashboards, users and permissions, branches, administrative history and responsive access on desktop and mobile."
      : "O Venda Mais reúne PDV, produtos, baixa automática de estoque, controle de caixa, painéis de gestão, usuários e permissões, filiais, histórico administrativo e acesso responsivo no computador e celular.";
  if (has("estoque", "inventory", "produto", "product"))
    return lang === "en"
      ? "Inventory is connected to sales: completed POS transactions automatically reduce product balances. You can also record entries, losses and adjustments with a reason."
      : "O estoque é conectado às vendas: operações concluídas no PDV baixam automaticamente os saldos. Também é possível registrar entradas, perdas e ajustes com motivo.";
  if (has("pdv", "venda", "sale", "sell", "caixa", "cash"))
    return lang === "en"
      ? "The POS lets your team select products, quantities and payment methods. Cash opening, sales, deposits and withdrawals stay organized for closing."
      : "No PDV, sua equipe seleciona produtos, quantidades e formas de pagamento. Abertura, vendas, suprimentos e retiradas ficam organizados para o fechamento do caixa.";
  if (has("segurança", "seguranca", "secure", "security", "dados", "data", "usuário", "usuario", "user"))
    return lang === "en"
      ? "Each company has isolated data and settings. Users have individual access and roles such as administrator, manager, cashier and inventory."
      : "Cada empresa possui dados e configurações isolados. Os usuários têm acessos individuais e funções como administrador, gerente, caixa e estoque.";
  if (has("restaurante", "bar", "adega", "advogado", "contrato", "consultório", "consultorio", "construção", "construcao", "locadora", "restaurant", "law", "clinic", "rental", "segmento", "setor"))
    return lang === "en"
      ? "Venda Mais can support restaurants, bars, beverage and retail stores, law firms and contracts, clinics, building supply stores and vehicle rental companies. Registrations, users, branches and controls are aligned with each operation's process."
      : "O Venda Mais atende restaurantes, bares, adegas e lojas, advogados e contratos, consultórios, materiais para construção e locadoras de veículos. Cadastros, usuários, filiais e controles são alinhados ao processo de cada operação.";
  if (has("pagamento", "pix", "cartão", "cartao", "boleto", "payment", "card"))
    return lang === "en"
      ? "Venda Mais subscription payments are processed securely through Mercado Pago, with Pix, credit or debit card, and boleto, subject to Mercado Pago availability."
      : "Os pagamentos da assinatura Venda Mais são processados com segurança pelo Mercado Pago, com Pix, cartão de crédito ou débito e boleto, conforme disponibilidade do Mercado Pago.";
  if (has("celular", "mobile", "tablet", "computador", "browser", "navegador"))
    return lang === "en"
      ? "The system runs in the browser and adapts to desktop, tablet and mobile screens, with no installation required."
      : "O sistema funciona pelo navegador e se adapta ao computador, tablet e celular, sem precisar instalar.";
  return lang === "en"
    ? "I couldn't find that information in the official Venda Mais content. I can help with plans, prices, POS, inventory, cash flow, users, branches, security, payments, the free trial and 24/7 support. For anything else, please contact support."
    : "Não encontrei essa informação no conteúdo oficial do Venda Mais. Posso ajudar sobre planos, valores, PDV, estoque, caixa, usuários, filiais, segurança, pagamentos, teste grátis e suporte 24h. Para outros assuntos, procure o suporte.";
}

export function ChatAssistant() {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<Lang>("pt");
  const [messages, setMessages] = useState<Message[]>([]);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const sync = () => setLang(currentLanguage());
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    setMessages((current) => current.length ? current : [{ from: "bot", text: copy[lang].welcome }]);
  }, [lang]);
  useEffect(() => end.current?.scrollIntoView({ behavior: "smooth" }), [messages, open]);
  const ask = (text: string) => {
    const clean = text.trim();
    if (!clean) return;
    setMessages((current) => [...current, { from: "user", text: clean }, { from: "bot", text: answer(clean, lang) }]);
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    ask(String(data.get("question") ?? ""));
    form.reset();
  };
  const labels = copy[lang];
  return <div className={`sales-chat ${open ? "open" : ""}`}>
    {open && <section className="sales-chat-panel" role="dialog" aria-label={labels.title}>
      <header><div><strong>{labels.title}</strong><small>{labels.status}</small></div><button onClick={() => setOpen(false)} aria-label="Fechar / Close">×</button></header>
      <div className="sales-chat-messages">{messages.map((message, index) => <p key={index} className={message.from}>{message.text}</p>)}<div ref={end}/></div>
      <div className="sales-chat-shortcuts"><button onClick={() => ask(labels.plans)}>{labels.plans}</button><button onClick={() => ask(labels.features)}>{labels.features}</button><button onClick={() => ask(labels.trial)}>{labels.trial}</button><button onClick={() => ask(labels.support)}>{labels.support}</button></div>
      <form onSubmit={submit}><input name="question" placeholder={labels.placeholder} autoComplete="off"/><button>{labels.send}</button></form>
    </section>}
    <button className="sales-chat-toggle" onClick={() => setOpen((value) => !value)} aria-label={labels.open}><span>{open ? "×" : "💬"}</span><b>{open ? "" : "Chat 24h"}</b></button>
  </div>;
}
