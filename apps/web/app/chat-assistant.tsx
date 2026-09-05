"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type Message = { from: "bot" | "user"; text: string };
type Lang = "pt" | "en";

const copy = {
  pt: {
    welcome: "Olá! Sou o assistente do Venda+. Explico tudo com palavras simples e exemplos. Você pode perguntar sobre preços mensais, semestrais e anuais, painéis de vendas, estoque, entregas configuráveis, caixa, usuários, segurança, pagamento, teste grátis ou suporte 24 horas.",
    title: "Assistente Venda+",
    status: "Online • atendimento 24h",
    plans: "Planos",
    features: "Recursos",
    dashboards: "Painéis e gráficos",
    trial: "Teste grátis",
    support: "Suporte",
    whatsapp: "Falar com uma pessoa no WhatsApp",
    placeholder: "Digite sua dúvida...",
    send: "Enviar",
    open: "Abrir atendimento",
  },
  en: {
    welcome: "Hi! I'm the Venda+ assistant. I explain everything in plain language and with examples. Ask me about monthly, semiannual and annual pricing, sales dashboards, inventory, configurable deliveries, cash control, users, security, payments, the free trial or 24/7 support.",
    title: "Venda+ Assistant",
    status: "Online • 24/7 assistance",
    plans: "Plans",
    features: "Features",
    dashboards: "Dashboards and charts",
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

function renderMessage(text: string) {
  return text.split(/(https:\/\/wa\.me\/5511978436640)/g).map((part, index) => part.startsWith("https://")
    ? <a href={part} target="_blank" rel="noopener noreferrer" key={index}>Abrir WhatsApp</a>
    : part);
}

function answer(question: string, lang: Lang) {
  const value = question.toLocaleLowerCase("pt-BR");
  const has = (...terms: string[]) => terms.some((term) => value.includes(term));
  if (has("anual", "annual", "semestral", "semiannual", "desconto", "discount", "parcela", "installment"))
    return lang === "en"
      ? "Venda+ offers three billing periods for every plan:\n\n• MONTHLY: regular price and 30 days of access.\n• SEMIANNUAL: 20% off the total of 6 months and 180 days of access.\n• ANNUAL: 30% off the total of 12 months and 365 days of access.\n\nESSENTIAL: R$129 monthly, R$619.20 semiannual, or R$1,083.60 annual.\nPERFORMANCE: R$249 monthly, R$1,195.20 semiannual, or R$2,091.60 annual.\nSCALE: R$499 monthly, R$2,395.20 semiannual, or R$4,191.60 annual.\n\nPix, debit card and boleto charge the full selected period. For credit cards, Mercado Pago may offer up to 6 or 12 installments, subject to approval and account availability. This is not an automatic recurring subscription: the customer authorizes the payment."
      : "O Venda+ oferece três períodos em todos os planos:\n\n• MENSAL: preço normal e 30 dias de acesso.\n• SEMESTRAL: 20% de desconto sobre 6 meses e 180 dias de acesso.\n• ANUAL: 30% de desconto sobre 12 meses e 365 dias de acesso.\n\nESSENCIAL: R$ 129 mensal, R$ 619,20 semestral ou R$ 1.083,60 anual.\nPERFORMANCE: R$ 249 mensal, R$ 1.195,20 semestral ou R$ 2.091,60 anual.\nESCALA: R$ 499 mensal, R$ 2.395,20 semestral ou R$ 4.191,60 anual.\n\nPix, débito e boleto cobram o total do período. No crédito, o Mercado Pago poderá oferecer até 6 ou 12 parcelas, conforme aprovação e disponibilidade. Não é assinatura recorrente automática: o cliente autoriza o pagamento.";
  if (has("entrega", "delivery", "rota", "pedido atrasado", "motoboy"))
    return lang === "en"
      ? "The delivery preview addresses a common restaurant problem: knowing which orders are waiting, being prepared, on route or delivered. A configured workflow can show the customer, region, expected time, average delivery time, on-time percentage and orders that need immediate action.\n\nImportant: delivery tracking is a configurable workflow and is not yet part of the standard operational module. Our team must first understand your process before confirming its implementation."
      : "O painel de entregas atende uma dor comum de restaurantes: saber quais pedidos estão aguardando, em preparo, em rota ou entregues. Um fluxo configurado pode mostrar cliente, região, previsão, tempo médio, percentual no prazo e pedidos que precisam de ação imediata.\n\nImportante: o controle de entregas é um fluxo configurável e ainda não integra o módulo operacional padrão. Nossa equipe precisa entender seu processo antes de confirmar a implantação.";
  if (has("gráfico", "grafico", "painel", "dashboard", "chart", "relatório", "relatorio", "horário de pico", "horario de pico", "ticket médio", "ticket medio"))
    return lang === "en"
      ? "The demonstration dashboards turn sales into practical management information:\n\n• DAILY CHART: revenue by hour, number of sales, average ticket and peak time. This helps a restaurant schedule staff and prepare inventory for busy hours.\n• WEEKLY CHART: compares each weekday, highlights the strongest day and shows growth or decline versus the previous week.\n• INVENTORY: shows balances and highlights products that need restocking before the next shift.\n\nExample: if 6 PM generated R$820 and Saturday was the strongest day, the manager has evidence to reinforce staffing and stock at those times. The figures shown on the website are illustrative. Click or tap any preview to enlarge it."
      : "Os painéis demonstrativos transformam vendas em informação prática para a gestão:\n\n• GRÁFICO DIÁRIO: vendas por horário, faturamento, quantidade, ticket médio e horário de pico. Isso ajuda o restaurante a preparar equipe e estoque para o movimento.\n• GRÁFICO SEMANAL: compara os dias, mostra o melhor resultado e indica crescimento ou queda em relação à semana anterior.\n• ESTOQUE: apresenta saldos e destaca produtos que precisam de reposição antes do próximo turno.\n\nExemplo: se às 18h entraram R$ 820 e sábado foi o melhor dia, o gerente tem evidência para reforçar equipe e estoque nesses períodos. Os números do site são ilustrativos. Clique ou toque em qualquer print para ampliar.";
  if (has("contato", "telefone", "whatsapp", "falar com", "atendente", "contact", "phone"))
    return lang === "en"
      ? "You can speak directly with the Venda+ team on WhatsApp at +55 11 97843-6640.\n\nOpen WhatsApp: https://wa.me/5511978436640"
      : "Você pode falar diretamente com a equipe do Venda+ pelo WhatsApp +55 11 97843-6640.\n\nAbrir WhatsApp: https://wa.me/5511978436640";
  if (has("omega", "quem criou", "quem desenvolveu", "empresa responsável", "developer", "who made"))
    return lang === "en"
      ? "Venda+ belongs to Omega Group and is developed by Omega Software House, CNPJ 66.223.973/0001-06. Learn more at https://www.omega-ia.com. For direct assistance, use WhatsApp +55 11 97843-6640."
      : "O Venda+ pertence ao Grupo Omega e é desenvolvido pela Omega Software House, CNPJ 66.223.973/0001-06. Conheça em https://www.omega-ia.com. Para atendimento direto, fale no WhatsApp +55 11 97843-6640.";
  if (has("administrador", "gerente", "permissão", "permissao", "perfil", "senha", "bloquear usuário", "bloquear usuario", "administrator", "manager", "permission", "password"))
    return lang === "en"
      ? "Venda+ supports individual access by responsibility. Administrators can manage the business, users, branches and settings; managers follow the operation; cashiers focus on sales and cash control; inventory users handle products and balances. Administrative controls include changing roles, blocking access, resetting passwords and recording important changes in the audit history."
      : "O Venda+ separa o acesso por responsabilidade. O administrador cuida da empresa, usuários, filiais e configurações; o gerente acompanha a operação; o caixa trabalha com vendas e caixa; e o estoque cuida de produtos e saldos. Os controles administrativos incluem trocar perfil, bloquear acesso, redefinir senha e registrar alterações importantes no histórico.";
  if (has("privacidade", "endereço ip", "endereco ip", "visitante", "localização", "localizacao", "lgpd", "privacy", "visitor", "location"))
    return lang === "en"
      ? "Venda+ records technical visits to public pages for security and audience measurement, including IP address, date and time, page, source, device, browser, operating system, language, time zone and approximate location. This information is restricted to platform administration, is not sold and may be retained for up to 365 days. Requests for correction or deletion can be sent to https://wa.me/5511978436640."
      : "O Venda+ registra dados técnicos de acesso às páginas públicas para segurança e medição de audiência: IP, data e hora, página, origem, dispositivo, navegador, sistema, idioma, fuso e localização aproximada. Essas informações ficam restritas à administração, não são vendidas e podem ser mantidas por até 365 dias. Pedidos de correção ou exclusão podem ser enviados em https://wa.me/5511978436640.";
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
      ? "We offer ESSENTIAL at R$129/month, PERFORMANCE at R$249/month and SCALE at R$499/month. Every plan includes 24/7 support and can be paid monthly, semiannually with 20% off, or annually with 30% off. There is also a free 7-day trial with no payment required to register. Ask me about annual or semiannual pricing and I will show every total."
      : "Temos o ESSENCIAL por R$ 129/mês, PERFORMANCE por R$ 249/mês e ESCALA por R$ 499/mês. Todos incluem suporte 24 horas e podem ser pagos mensalmente, no semestral com 20% de desconto ou no anual com 30% de desconto. O teste de 7 dias é gratuito e não exige pagamento no cadastro. Pergunte pelos valores anuais ou semestrais que eu mostro todos os totais.";
  if (has("teste", "grátis", "gratis", "trial", "free", "cadastro", "cadastrar", "cnpj", "register", "signup"))
    return lang === "en"
      ? "The free trial lasts 7 days. First, you complete a simple registration with your business and account owner information. The Venda+ team reviews and approves the request.\n\nThe 7 days only start after approval, so you do not lose trial time while waiting. During the trial, you can learn the interface, register products, organize initial settings and test the daily operation before choosing a plan."
      : "O teste gratuito dura 7 dias e o cadastro não exige CNPJ nem pagamento. Você informa os dados básicos da empresa e da pessoa responsável. A equipe do Venda+ analisa e libera o acesso.\n\nOs 7 dias só começam depois da liberação. Quando terminam, o acesso é bloqueado até a confirmação do pagamento de um plano. Durante o teste, você pode conhecer as telas, cadastrar produtos, organizar as configurações iniciais e experimentar a operação.";
  if (has("suporte", "atendimento", "ajuda", "support", "help", "24"))
    return lang === "en"
      ? "24/7 support is included in every plan. This means you can ask for guidance at any time when you have a question about using the platform or an important operational situation.\n\nThe goal is to help people who are not technology experts. Guidance should be clear, step by step and aligned with the way your business works."
      : "O suporte 24 horas está incluído em todos os planos. Isso significa que você pode pedir orientação a qualquer momento quando tiver dúvida sobre o uso da plataforma ou enfrentar uma situação importante na operação.\n\nA proposta é ajudar também quem não entende muito de tecnologia. A orientação deve ser clara, passo a passo e alinhada à forma como o seu negócio trabalha.";
  if (has("recurso", "funcionalidade", "função", "funcao", "feature", "function", "serviço", "servico", "service"))
    return lang === "en"
      ? "Venda+ organizes the main parts of the operation in one place:\n\n• POS: the screen used to record a sale.\n• Products: names, prices and other product information.\n• Inventory: how many units are available, plus entries, losses and adjustments.\n• Cash control: opening, sales, deposits, withdrawals and closing.\n• Dashboards: a simple view of revenue, sales, products and stock units.\n• Users: individual access and permissions for each responsibility.\n• Branches: organization of different locations.\n• Administrative history: a record of important management changes.\n\nThe system runs on desktop, tablet and mobile, with 24/7 support."
      : "O Venda+ organiza as principais partes da operação em um só lugar:\n\n• PDV: é a tela usada para registrar uma venda.\n• Produtos: cadastro de nomes, preços e outras informações.\n• Estoque: mostra quantas unidades existem e permite registrar entradas, perdas e ajustes.\n• Caixa: organiza abertura, vendas, suprimentos, retiradas e fechamento.\n• Painéis: mostram de forma simples o faturamento, as vendas, os produtos e as unidades em estoque.\n• Usuários: cada pessoa pode ter seu próprio acesso e sua função.\n• Filiais: permite organizar diferentes unidades.\n• Histórico administrativo: registra mudanças importantes feitas na gestão.\n\nO sistema funciona no computador, tablet e celular, com suporte 24 horas.";
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
      ? "Venda+ can be aligned with different types of operations:\n\n• Restaurants, bars and beverage stores: sales, products, inventory and cash flow.\n• Retail and building supply stores: broad product catalogs, quantities, prices and different employees.\n• Law firms and contracts: organization of services, owners, payments and access.\n• Clinics and practices: services, payments, teams and locations in one environment.\n• Vehicle rental companies: records, payments, owners and branches adapted to the operational process.\n\nThe same simple idea applies to all of them: centralize information, define who can access it and make daily control easier."
      : "O Venda+ pode ser alinhado a diferentes tipos de operação:\n\n• Restaurantes, bares e adegas: vendas, produtos, estoque e caixa.\n• Lojas e materiais para construção: catálogo amplo, quantidades, preços e diferentes funcionários.\n• Advogados e contratos: organização de serviços, responsáveis, recebimentos e acessos.\n• Consultórios: serviços, recebimentos, equipe e unidades em um ambiente centralizado.\n• Locadoras de veículos: cadastros, cobranças, responsáveis e filiais adaptados ao processo da operação.\n\nA ideia simples é a mesma para todos: centralizar informações, definir quem pode acessar e facilitar o controle do dia a dia.";
  if (has("pagamento", "pix", "cartão", "cartao", "boleto", "payment", "card"))
    return lang === "en"
      ? "Venda+ payments are sent to Mercado Pago's secure environment. Customers can use Pix, credit card, debit card or boleto, depending on account availability.\n\nMonthly payments release 30 days, semiannual payments release 180 days and annual payments release 365 days. Access is activated only after Mercado Pago confirms an approved payment. Pix, debit and boleto charge the full period; installments may be available for credit cards, subject to approval. Venda+ never asks for card details in this chat."
      : "O pagamento do Venda+ é direcionado para o ambiente seguro do Mercado Pago. O cliente pode escolher Pix, crédito, débito ou boleto conforme a disponibilidade da conta.\n\nMensal libera 30 dias, semestral libera 180 e anual libera 365. A conta só é ativada depois que o Mercado Pago confirma o pagamento como aprovado. Pix, débito e boleto cobram o total do período; parcelamento é uma possibilidade do cartão de crédito, sujeito à aprovação. O Venda+ não pede dados do cartão por este chat.";
  if (has("celular", "mobile", "tablet", "computador", "browser", "navegador"))
    return lang === "en"
      ? "Venda+ runs in the internet browser, such as Chrome, Safari or Edge. There is no program to install for normal use.\n\nOn a computer, the system uses the larger screen to display more information. On a phone or tablet, menus and content reorganize themselves to fit the smaller screen. The same account can be used according to the employee's permission."
      : "O Venda+ funciona no navegador de internet, como Chrome, Safari ou Edge. Não é necessário instalar um programa para o uso normal.\n\nNo computador, o sistema aproveita a tela maior para mostrar mais informações. No celular ou tablet, os menus e conteúdos se reorganizam para caber na tela menor. A mesma conta pode ser usada de acordo com a permissão do funcionário.";
  return lang === "en"
    ? "I don't have reliable information about that in the official Venda+ content, so I won't invent an answer. Please speak directly with our team on WhatsApp at +55 11 97843-6640.\n\nOpen WhatsApp: https://wa.me/5511978436640"
    : "Não encontrei uma informação confiável sobre isso no conteúdo oficial do Venda+, então não vou inventar uma resposta. Fale diretamente com nossa equipe pelo WhatsApp +55 11 97843-6640.\n\nAbrir WhatsApp: https://wa.me/5511978436640";
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
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);
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
      <div className="sales-chat-messages">{messages.map((message, index) => <p key={index} className={message.from}>{renderMessage(message.text)}</p>)}<div ref={end}/></div>
      <div className="sales-chat-shortcuts"><button onClick={() => ask(labels.plans)}>{labels.plans}</button><button onClick={() => ask(labels.dashboards)}>{labels.dashboards}</button><button onClick={() => ask(labels.features)}>{labels.features}</button><button onClick={() => ask(labels.trial)}>{labels.trial}</button><button onClick={() => ask(labels.support)}>{labels.support}</button></div>
      <a className="sales-chat-whatsapp" href="https://wa.me/5511978436640?text=Ol%C3%A1%2C%20preciso%20de%20ajuda%20sobre%20o%20Venda%2B." target="_blank" rel="noopener noreferrer">{labels.whatsapp}</a>
      <form onSubmit={submit}><input name="question" placeholder={labels.placeholder} autoComplete="off"/><button>{labels.send}</button></form>
    </section>}
    <button className="sales-chat-toggle" onClick={() => setOpen((value) => !value)} aria-label={labels.open}><span>{open ? "×" : "💬"}</span><b>{open ? "" : "Chat 24h"}</b></button>
  </div>;
}
