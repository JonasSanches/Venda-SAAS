"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type Message = { from: "bot" | "user"; text: string };
type Lang = "pt" | "en";

const copy = {
  pt: {
    welcome: "Olá! Sou o assistente do Venda Mais. Estou aqui para explicar tudo com palavras simples e exemplos. Você pode perguntar sobre preços, planos, vendas, estoque, caixa, usuários, filiais, segurança, pagamento, teste grátis ou suporte 24 horas.",
    title: "Assistente Venda Mais",
    status: "Online • atendimento 24h",
    plans: "Planos",
    features: "Recursos",
    trial: "Teste grátis",
    support: "Suporte",
    whatsapp: "Falar com uma pessoa no WhatsApp",
    placeholder: "Digite sua dúvida...",
    send: "Enviar",
    open: "Abrir atendimento",
  },
  en: {
    welcome: "Hi! I'm the Venda Mais assistant. I'm here to explain everything in plain language and with examples. Ask me about prices, plans, sales, inventory, cash control, users, branches, security, payments, the free trial or 24/7 support.",
    title: "Venda Mais Assistant",
    status: "Online • 24/7 assistance",
    plans: "Plans",
    features: "Features",
    trial: "Free trial",
    support: "Support",
    whatsapp: "Talk to a person on WhatsApp",
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
  if (has("essencial", "essential", "129", "básico", "basico"))
    return lang === "en"
      ? "ESSENTIAL — R$129/month\n\nThis is the entry plan for a business that wants to leave notebooks and scattered spreadsheets behind. You can register products, use the POS to record sales, track inventory, open and close the cash register, and see key indicators.\n\nSimple example: when the cashier sells 2 units of a product, the system records the sale and removes those 2 units from inventory.\n\nIt also includes secure team access and 24/7 support. It is a good starting point for a smaller or simpler operation."
      : "ESSENCIAL — R$ 129 por mês\n\nÉ o plano de entrada para quem quer deixar de controlar o negócio em cadernos ou planilhas separadas. Você pode cadastrar produtos, usar o PDV para registrar vendas, acompanhar o estoque, abrir e fechar o caixa e consultar os principais números.\n\nExemplo simples: se o caixa vender 2 unidades de um produto, o sistema registra a venda e retira essas 2 unidades do estoque.\n\nTambém inclui acesso seguro para a equipe e suporte 24 horas. É um bom começo para uma operação menor ou mais simples.";
  if (has("performance", "249", "médio", "medio", "professional"))
    return lang === "en"
      ? "PERFORMANCE — R$249/month\n\nDesigned for a growing business with a larger team or more management needs. In addition to daily sales, inventory and cash control, it helps organize users by responsibility, branches and administrative controls.\n\nExample: the cashier can focus on sales, the inventory employee can adjust balances, and the manager can follow the main indicators. Each person uses their own access.\n\nIt includes 24/7 support and is a good fit when the owner needs more visibility and organization."
      : "PERFORMANCE — R$ 249 por mês\n\nFoi pensado para um negócio que está crescendo, tem uma equipe maior ou precisa de mais organização na gestão. Além de vendas, estoque e caixa, ajuda a separar usuários por responsabilidade, filiais e controles administrativos.\n\nExemplo: o caixa pode cuidar das vendas, a pessoa do estoque pode ajustar quantidades e o gerente pode acompanhar os principais números. Cada pessoa usa seu próprio acesso.\n\nInclui suporte 24 horas e é indicado quando o dono precisa enxergar e organizar melhor a operação.";
  if (has("escala", "scale", "499", "premium", "rede", "franquia"))
    return lang === "en"
      ? "SCALE — R$499/month\n\nMade for operations with multiple teams, branches or plans to expand. Information from the operation is organized in one management structure, with users, permissions, branches, monitoring and administrative history.\n\nExample: instead of controlling every location in a different file, the administrator uses one platform and keeps each business environment properly separated.\n\nIt includes 24/7 support and is the best option for a more complex operation that needs room to grow."
      : "ESCALA — R$ 499 por mês\n\nÉ voltado para operações com várias equipes, filiais ou planos de expansão. As informações ficam organizadas em uma estrutura central de gestão, com usuários, permissões, filiais, monitoramento e histórico administrativo.\n\nExemplo: em vez de controlar cada unidade em um arquivo diferente, o administrador usa uma única plataforma e mantém cada ambiente devidamente separado.\n\nInclui suporte 24 horas e é a opção mais indicada para uma operação mais complexa e preparada para crescer.";
  if (has("preço", "preco", "valor", "plano", "plan", "price", "cost"))
    return lang === "en"
      ? "We offer three monthly plans, and all of them include 24/7 support:\n\n• ESSENTIAL — R$129/month: for getting started with sales, products, inventory, cash control and indicators.\n\n• PERFORMANCE — R$249/month: for growing businesses that need broader team, branch and management organization.\n\n• SCALE — R$499/month: for more complex operations, multiple teams or locations and an expansion-ready structure.\n\nThere is also a 7-day free trial. If you tell me about your business, I can explain which profile is closest to your needs."
      : "Temos três planos mensais, e todos incluem suporte 24 horas:\n\n• ESSENCIAL — R$ 129/mês: para começar com vendas, produtos, estoque, caixa e indicadores.\n\n• PERFORMANCE — R$ 249/mês: para negócios em crescimento que precisam organizar melhor equipe, filiais e gestão.\n\n• ESCALA — R$ 499/mês: para operações mais complexas, com várias equipes ou unidades e estrutura preparada para expansão.\n\nTambém existe o teste gratuito de 7 dias. Se você contar como é o seu negócio, eu explico qual perfil parece mais próximo da sua necessidade.";
  if (has("teste", "grátis", "gratis", "trial", "free"))
    return lang === "en"
      ? "The free trial lasts 7 days. First, you complete a simple registration with your business and account owner information. The Venda Mais team reviews and approves the request.\n\nThe 7 days only start after approval, so you do not lose trial time while waiting. During the trial, you can learn the interface, register products, organize initial settings and test the daily operation before choosing a plan."
      : "O teste gratuito dura 7 dias. Primeiro, você faz um cadastro simples com os dados da empresa e da pessoa responsável. A equipe do Venda Mais analisa e libera o acesso.\n\nOs 7 dias só começam depois dessa liberação. Assim, você não perde tempo de teste enquanto espera. Durante o período, pode conhecer as telas, cadastrar produtos, organizar as configurações iniciais e experimentar a operação antes de escolher um plano.";
  if (has("suporte", "atendimento", "ajuda", "support", "help", "24"))
    return lang === "en"
      ? "24/7 support is included in every plan. This means you can ask for guidance at any time when you have a question about using the platform or an important operational situation.\n\nThe goal is to help people who are not technology experts. Guidance should be clear, step by step and aligned with the way your business works."
      : "O suporte 24 horas está incluído em todos os planos. Isso significa que você pode pedir orientação a qualquer momento quando tiver dúvida sobre o uso da plataforma ou enfrentar uma situação importante na operação.\n\nA proposta é ajudar também quem não entende muito de tecnologia. A orientação deve ser clara, passo a passo e alinhada à forma como o seu negócio trabalha.";
  if (has("recurso", "funcionalidade", "função", "funcao", "feature", "function", "serviço", "servico", "service"))
    return lang === "en"
      ? "Venda Mais organizes the main parts of the operation in one place:\n\n• POS: the screen used to record a sale.\n• Products: names, prices and other product information.\n• Inventory: how many units are available, plus entries, losses and adjustments.\n• Cash control: opening, sales, deposits, withdrawals and closing.\n• Dashboards: a simple view of revenue, sales, products and stock units.\n• Users: individual access and permissions for each responsibility.\n• Branches: organization of different locations.\n• Administrative history: a record of important management changes.\n\nThe system runs on desktop, tablet and mobile, with 24/7 support."
      : "O Venda Mais organiza as principais partes da operação em um só lugar:\n\n• PDV: é a tela usada para registrar uma venda.\n• Produtos: cadastro de nomes, preços e outras informações.\n• Estoque: mostra quantas unidades existem e permite registrar entradas, perdas e ajustes.\n• Caixa: organiza abertura, vendas, suprimentos, retiradas e fechamento.\n• Painéis: mostram de forma simples o faturamento, as vendas, os produtos e as unidades em estoque.\n• Usuários: cada pessoa pode ter seu próprio acesso e sua função.\n• Filiais: permite organizar diferentes unidades.\n• Histórico administrativo: registra mudanças importantes feitas na gestão.\n\nO sistema funciona no computador, tablet e celular, com suporte 24 horas.";
  if (has("estoque", "inventory", "produto", "product"))
    return lang === "en"
      ? "Inventory shows how many units of each product are available. It is connected to the POS, so completed sales update balances automatically.\n\nExample: if inventory shows 100 beverage cans and the cashier sells 3, the new balance becomes 97. You do not need to subtract them manually.\n\nYou can also record merchandise received, losses or manual adjustments. Each movement can include a reason, making it easier to understand why the quantity changed."
      : "O estoque mostra quantas unidades de cada produto estão disponíveis. Ele é ligado ao PDV, então as vendas concluídas atualizam as quantidades automaticamente.\n\nExemplo: se o estoque mostra 100 latas e o caixa vende 3, o novo saldo passa a ser 97. Você não precisa fazer essa conta manualmente.\n\nTambém é possível registrar entrada de mercadoria, perda ou ajuste manual. Cada movimento pode ter um motivo, facilitando entender por que a quantidade mudou.";
  if (has("pdv", "venda", "sale", "sell", "caixa", "cash"))
    return lang === "en"
      ? "POS means Point of Sale. It is the screen the employee uses at the moment of a sale. The user chooses the product, quantity and payment method, checks the total and completes the transaction.\n\nCash control starts with an opening amount, records sales and can also record deposits or withdrawals. At the end, this information helps the person responsible review the day and close the cash register with more clarity."
      : "PDV significa Ponto de Venda. É a tela que o funcionário usa na hora de vender. A pessoa escolhe o produto, informa a quantidade e a forma de pagamento, confere o total e finaliza a venda.\n\nO controle de caixa começa com um valor de abertura, registra as vendas e também pode registrar suprimentos ou retiradas. No final, essas informações ajudam o responsável a conferir o dia e fechar o caixa com mais clareza.";
  if (has("segurança", "seguranca", "secure", "security", "dados", "data", "usuário", "usuario", "user"))
    return lang === "en"
      ? "Each company has an independent environment. This means one customer cannot see another customer's products, sales, inventory, users or settings.\n\nEach employee can have an individual username and password. Roles help limit what each person should use: an administrator manages the business, a manager follows the operation, a cashier records sales, and an inventory user handles product balances.\n\nImportant administrative changes are recorded in a history for greater control."
      : "Cada empresa possui um ambiente independente. Isso significa que um cliente não consegue ver produtos, vendas, estoque, usuários ou configurações de outro cliente.\n\nCada funcionário pode ter seu próprio nome de acesso e senha. As funções ajudam a separar o que cada pessoa deve usar: o administrador gerencia a empresa, o gerente acompanha a operação, o caixa registra vendas e o usuário de estoque cuida das quantidades.\n\nMudanças administrativas importantes ficam registradas em um histórico para aumentar o controle.";
  if (has("restaurante", "bar", "adega", "advogado", "contrato", "consultório", "consultorio", "construção", "construcao", "locadora", "restaurant", "law", "clinic", "rental", "segmento", "setor"))
    return lang === "en"
      ? "Venda Mais can be aligned with different types of operations:\n\n• Restaurants, bars and beverage stores: sales, products, inventory and cash flow.\n• Retail and building supply stores: broad product catalogs, quantities, prices and different employees.\n• Law firms and contracts: organization of services, owners, payments and access.\n• Clinics and practices: services, payments, teams and locations in one environment.\n• Vehicle rental companies: records, payments, owners and branches adapted to the operational process.\n\nThe same simple idea applies to all of them: centralize information, define who can access it and make daily control easier."
      : "O Venda Mais pode ser alinhado a diferentes tipos de operação:\n\n• Restaurantes, bares e adegas: vendas, produtos, estoque e caixa.\n• Lojas e materiais para construção: catálogo amplo, quantidades, preços e diferentes funcionários.\n• Advogados e contratos: organização de serviços, responsáveis, recebimentos e acessos.\n• Consultórios: serviços, recebimentos, equipe e unidades em um ambiente centralizado.\n• Locadoras de veículos: cadastros, cobranças, responsáveis e filiais adaptados ao processo da operação.\n\nA ideia simples é a mesma para todos: centralizar informações, definir quem pode acessar e facilitar o controle do dia a dia.";
  if (has("pagamento", "pix", "cartão", "cartao", "boleto", "payment", "card"))
    return lang === "en"
      ? "Venda Mais subscription payments are sent to the secure Mercado Pago environment. There, the customer can choose Pix, credit card, debit card or boleto, depending on Mercado Pago availability.\n\nVenda Mais does not ask the customer to send card details through this chat. After Mercado Pago confirms an approved payment, the system can register the confirmation and activate the account."
      : "O pagamento da assinatura Venda Mais é direcionado para o ambiente seguro do Mercado Pago. Lá, o cliente pode escolher Pix, cartão de crédito, cartão de débito ou boleto, conforme a disponibilidade do Mercado Pago.\n\nO Venda Mais não pede dados do cartão por este chat. Depois que o Mercado Pago confirma um pagamento aprovado, o sistema pode registrar a confirmação e ativar a conta.";
  if (has("celular", "mobile", "tablet", "computador", "browser", "navegador"))
    return lang === "en"
      ? "Venda Mais runs in the internet browser, such as Chrome, Safari or Edge. There is no program to install for normal use.\n\nOn a computer, the system uses the larger screen to display more information. On a phone or tablet, menus and content reorganize themselves to fit the smaller screen. The same account can be used according to the employee's permission."
      : "O Venda Mais funciona no navegador de internet, como Chrome, Safari ou Edge. Não é necessário instalar um programa para o uso normal.\n\nNo computador, o sistema aproveita a tela maior para mostrar mais informações. No celular ou tablet, os menus e conteúdos se reorganizam para caber na tela menor. A mesma conta pode ser usada de acordo com a permissão do funcionário.";
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
      <a className="sales-chat-whatsapp" href="https://wa.me/5511978436640?text=Ol%C3%A1%2C%20preciso%20de%20ajuda%20sobre%20o%20Venda%20Mais." target="_blank" rel="noopener noreferrer">{labels.whatsapp}</a>
      <form onSubmit={submit}><input name="question" placeholder={labels.placeholder} autoComplete="off"/><button>{labels.send}</button></form>
    </section>}
    <button className="sales-chat-toggle" onClick={() => setOpen((value) => !value)} aria-label={labels.open}><span>{open ? "×" : "💬"}</span><b>{open ? "" : "Chat 24h"}</b></button>
  </div>;
}
