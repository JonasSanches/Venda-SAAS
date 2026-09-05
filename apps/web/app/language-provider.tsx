"use client";

import { useEffect, useState } from "react";

type Locale = "pt-BR" | "en";

const english: Record<string, string> = {
  "Uma empresa do Grupo Omega": "An Omega Group company",
  "Recursos": "Features",
  "Planos": "Plans",
  "Para quem é": "Who it is for",
  "Como funciona": "How it works",
  "Suporte 24h": "24/7 support",
  "Teste grátis": "Free trial",
  "Entrar": "Sign in",
  "VENDA+ • CONTROLE MAIS • DECIDA MELHOR": "SELL MORE • CONTROL MORE • DECIDE BETTER",
  "Seu negócio vendendo rápido, com caixa e estoque sob controle.": "Fast sales with cash flow and inventory under control.",
  "Um sistema simples para registrar vendas, acompanhar o que entra e sai e enxergar os números da operação em um só lugar.": "A simple system to record sales, track everything coming in and going out, and see your operation in one place.",
  "Venda sem complicação:": "Simple selling:",
  "PDV direto e rápido": "a fast, straightforward POS",
  "Evite surpresas:": "Avoid surprises:",
  "estoque baixado a cada venda": "inventory updated with every sale",
  "Feche com segurança:": "Close securely:",
  "entradas e retiradas no caixa": "cash deposits and withdrawals",
  "Gerencie de qualquer lugar:": "Manage from anywhere:",
  "computador ou celular": "desktop or mobile",
  "Experimente grátis por 7 dias": "Try it free for 7 days",
  "Cadastre sua empresa sem compromisso. Após nossa liberação, seus 7 dias começam a contar.": "Register your business with no commitment. Your 7 free days start after approval.",
  "Quero testar grátis": "Start my free trial",
  "Suporte quando você precisar": "Support whenever you need it",
  "Atendimento contínuo para orientar sua equipe e acompanhar situações importantes da operação.": "Continuous assistance to guide your team and support important operational situations.",
  "Entre na sua conta": "Sign in to your account",
  "Acesse a operação da sua empresa.": "Access your business operation.",
  "E-mail ou nome de acesso": "Email or username",
  "Senha": "Password",
  "Sua senha": "Your password",
  "Entrando...": "Signing in...",
  "Ainda não tem acesso?": "Don't have access yet?",
  "Solicite seus 7 dias grátis.": "Request your 7 free days.",
  "7 dias grátis": "7-day free trial",
  "para conhecer": "to explore the platform",
  "Dados separados": "Isolated data",
  "por empresa": "for every business",
  "para sua operação": "for your operation",
  "Acesso responsivo": "Responsive access",
  "no celular e computador": "on mobile and desktop",
  "VEJA O VENDA+ EM AÇÃO": "SEE VENDA+ IN ACTION",
  "Poder tecnológico sem limites.": "Limitless technological power.",
  "O limite é a nossa imaginação, alinhada às necessidades do seu negócio. Conheça três pontos essenciais de uma operação conectada, simples de entender e pronta para crescer com você.": "The limit is our imagination, aligned with your business needs. Discover three essential parts of a connected operation that is easy to understand and ready to grow with you.",
  "Facilitador da vida": "Making life easier",
  "menos tarefas repetidas e mais tempo para o que importa": "fewer repetitive tasks and more time for what matters",
  "Poder de consciência e comunicação": "The power of awareness and communication",
  "informações claras para toda a equipe trabalhar alinhada": "clear information that keeps the entire team aligned",
  "Poder pessoal": "Personal empowerment",
  "autonomia para compreender, decidir e agir com segurança": "autonomy to understand, decide and act with confidence",
  "Enxergue o negócio inteiro": "See your entire business",
  "Faturamento, vendas, produtos e estoque aparecem juntos. Você entende o que está acontecendo sem depender de várias planilhas ou conferências demoradas.": "Revenue, sales, products and inventory appear together. Understand what is happening without relying on multiple spreadsheets or time-consuming checks.",
  "Venda rápido e atualize tudo": "Sell fast and update everything",
  "O operador registra a venda em poucos passos. No mesmo momento, o caixa recebe a movimentação e o estoque baixa automaticamente.": "The operator records a sale in just a few steps. At the same time, cash flow is updated and inventory is automatically reduced.",
  "Saiba o que entra e o que sai": "Know what comes in and goes out",
  "Consulte saldos, registre entradas e ajustes e identifique itens que precisam de atenção. Mais clareza para comprar melhor e reduzir perdas.": "Check balances, record incoming stock and adjustments, and identify items that need attention. Gain clarity to buy better and reduce losses.",
  "Não é apenas um sistema. É uma visão mais clara da sua empresa.": "It is more than a system. It is a clearer view of your business.",
  "Teste com seus próprios produtos, equipe e rotina durante 7 dias.": "Try it with your own products, team and routine for 7 days.",
  "Quero ver funcionando": "I want to see it working",
  "FEITO PARA QUEM VENDE TODOS OS DIAS": "BUILT FOR BUSINESSES THAT OPERATE EVERY DAY",
  "Uma operação organizada, seja qual for o seu balcão.": "An organized operation, whatever your business.",
  "O Venda+ se adapta à rotina de negócios que precisam vender com agilidade e manter produtos, equipe e caixa organizados.": "Venda+ adapts to businesses that need agility and organized products, teams, cash flow and processes.",
  "Restaurantes": "Restaurants",
  "Registre pedidos e acompanhe vendas, produtos e movimentações do dia.": "Record orders and track daily sales, products and transactions.",
  "Bares": "Bars",
  "Ganhe velocidade no atendimento e veja o estoque baixar automaticamente.": "Serve faster while inventory updates automatically.",
  "Adegas": "Wine and beverage stores",
  "Controle variedade, quantidade, preços e acesso da equipe em uma única tela.": "Control assortment, quantities, prices and team access in one place.",
  "Lojas": "Retail stores",
  "Centralize catálogo, caixa, filiais e indicadores para decidir com mais clareza.": "Centralize catalog, cash flow, branches and indicators for clearer decisions.",
  "Advogados e contratos": "Law firms and contracts",
  "Organize serviços, responsáveis, recebimentos e acessos conforme o fluxo do escritório.": "Organize services, owners, payments and access according to your firm's workflow.",
  "Consultórios": "Clinics and practices",
  "Acompanhe serviços, recebimentos, equipe e unidades em um ambiente centralizado.": "Track services, payments, teams and locations in one centralized environment.",
  "Materiais para construção": "Building supply stores",
  "Controle um catálogo amplo, movimentações de estoque, caixa e diferentes usuários.": "Control a broad catalog, inventory movements, cash flow and different users.",
  "Locadoras de veículos": "Vehicle rental companies",
  "Adapte cadastros, cobranças, responsáveis e filiais ao processo da sua operação.": "Adapt records, payments, owners and branches to your operational process.",
  "CONTROLE QUE GERA VALOR": "CONTROL THAT CREATES VALUE",
  "Transforme cada venda em informação para decidir melhor.": "Turn every sale into information for better decisions.",
  "O Venda+ reúne a operação em painéis simples: o caixa registra, o estoque acompanha, a gestão compara e você controla acessos, filiais e resultados de onde estiver.": "Venda+ brings your operation into simple dashboards: cash is recorded, inventory is tracked, management compares results, and you control access and branches from anywhere.",
  "em vendas acompanhadas por mês": "in monthly tracked sales",
  "de valor potencialmente preservado": "in potentially preserved value",
  "liberadas no fechamento mensal": "saved during monthly closing",
  "Os números são exemplos ilustrativos e não representam garantia de faturamento ou economia.": "These figures are illustrative examples and do not guarantee revenue or savings.",
  "Venda e recebimento": "Sales and payments",
  "Gestão por painéis": "Dashboard management",
  "Controle operacional": "Operational control",
  "Acesso seguro": "Secure access",
  "Suporte 24 horas": "24/7 support",
  "Em qualquer tela": "On every screen",
  "DA VENDA À DECISÃO": "FROM TRANSACTION TO DECISION",
  "Tudo conectado para você trabalhar com menos retrabalho.": "Everything connected so your team does less repetitive work.",
  "Registre a venda": "Record the transaction",
  "Atualize o estoque": "Update inventory",
  "Acompanhe o caixa": "Track cash flow",
  "Decida pelos números": "Decide with data",
  "CONTROLE SEM PRENDER VOCÊ AO BALCÃO": "CONTROL WITHOUT BEING TIED TO THE COUNTER",
  "Veja sua operação de onde estiver.": "See your operation from anywhere.",
  "PAINEL EM TEMPO REAL": "REAL-TIME DASHBOARD",
  "Vendas + Estoque + Caixa": "Sales + Inventory + Cash",
  "Começar meus 7 dias grátis": "Start my 7 free days",
  "PERGUNTAS FREQUENTES": "FREQUENTLY ASKED QUESTIONS",
  "Comece com tranquilidade.": "Get started with confidence.",
  "Preciso instalar alguma coisa?": "Do I need to install anything?",
  "Não. O Venda+ funciona pelo navegador no computador, tablet ou celular.": "No. Venda+ runs in your browser on desktop, tablet or mobile.",
  "Quando começam os 7 dias grátis?": "When do my 7 free days start?",
  "Meus dados ficam misturados com os de outra empresa?": "Is my data mixed with another company's data?",
  "Não. Cada empresa possui ambiente, usuários, dados e configurações independentes.": "No. Each business has its own environment, users, data and settings.",
  "Consigo controlar quem acessa o sistema?": "Can I control who accesses the system?",
  "Sim. Você cria usuários e define funções como administrador, gerente, caixa ou estoque.": "Yes. Create users and assign roles such as administrator, manager, cashier or inventory.",
  "PRONTO PARA ORGANIZAR SUA OPERAÇÃO?": "READY TO ORGANIZE YOUR OPERATION?",
  "Teste o Venda+ gratuitamente por 7 dias.": "Try Venda+ free for 7 days.",
  "Quero testar o Venda+": "I want to try Venda+",
  "Sem cobrança para solicitar o teste.": "No charge to request your trial.",
  "PLANOS SIMPLES E SUPORTE 24H": "SIMPLE PLANS AND 24/7 SUPPORT",
  "Escolha somente depois de testar.": "Choose only after your trial.",
  "O cadastro e os 7 dias de teste são gratuitos. Você não paga nada agora. Conheça o sistema primeiro e escolha o plano mais adequado depois.": "Registration and the 7-day trial are free. You pay nothing now. Explore the system first and choose the best plan afterward.",
  "PARA COMEÇAR": "TO GET STARTED",
  "PARA CRESCER": "TO GROW",
  "PARA EXPANDIR": "TO EXPAND",
  "PRA COMEÇAR": "TO GET STARTED",
  "PRA CRESCER": "TO GROW",
  "PRA EXPANDIR": "TO EXPAND",
  "Essencial": "Essential",
  "Escala": "Scale",
  "/mês": "/month",
  "Para uma operação menor que precisa organizar vendas, produtos, estoque, caixa e indicadores.": "For a smaller operation that needs to organize sales, products, inventory, cash control and indicators.",
  "Para negócios em crescimento que precisam organizar melhor equipe, filiais e gestão.": "For growing businesses that need better organization for teams, branches and management.",
  "Para operações mais complexas, com várias equipes ou unidades e estrutura preparada para expansão.": "For more complex operations with multiple teams or locations and an expansion-ready structure.",
  "PDV e formas de pagamento": "POS and payment methods",
  "PDV, vendas e formas de pagamento": "POS, sales and payment methods",
  "Produtos e estoque conectado": "Products and connected inventory",
  "Abertura e fechamento de caixa": "Cash opening and closing",
  "Abertura, movimentação e fechamento de caixa": "Cash opening, transactions and closing",
  "Painel com os principais números": "Dashboard with key figures",
  "Painel com os principais indicadores": "Dashboard with key indicators",
  "1 filial e até 3 usuários": "1 branch and up to 3 users",
  "Até 3 filiais e 10 usuários": "Up to 3 branches and 10 users",
  "Até 10 filiais e 50 usuários": "Up to 10 branches and 50 users",
  "Perfis, permissões e controles administrativos": "Roles, permissions and administrative controls",
  "Painéis gerenciais e suporte prioritário": "Management dashboards and priority support",
  "Acompanhamento dedicado para expansão": "Dedicated guidance for expansion",
  "Incluído": "Included",
  "Não incluído": "Not included",
  "Rotina de vendas, estoque e caixa": "Sales, inventory and cash routines",
  "Usuários separados por função": "Users separated by role",
  "Organização por filiais": "Branch organization",
  "Controles administrativos ampliados": "Extended administrative controls",
  "Gestão centralizada da operação": "Centralized operation management",
  "Equipes, permissões e filiais": "Teams, permissions and branches",
  "Monitoramento administrativo": "Administrative monitoring",
  "Histórico para maior controle": "History for greater control",
  "Sem cobrança no cadastro. Valores mensais dos planos após o período gratuito.": "No charge upon registration. Monthly plan prices apply after the free period.",
  "Visão geral": "Overview",
  "RESUMO DO PROPRIETÁRIO · HOJE": "OWNER SUMMARY · TODAY",
  "Seu negócio em poucos segundos": "Your business in a few seconds",
  "Faturamento hoje": "Revenue today",
  "Ticket médio": "Average ticket",
  "ATENÇÃO AGORA": "NEEDS ATTENTION",
  "6 produtos precisam de reposição": "6 products need restocking",
  "Ver estoque →": "View inventory →",
  "O limite é a nossa imaginação, alinhada às necessidades do seu negócio. Veja exemplos práticos de vendas do dia, desempenho semanal, estoque e um fluxo de entregas que pode ser configurado para sua operação.": "Our imagination, aligned with your business needs, is the limit. See practical examples of daily sales, weekly performance, inventory and a delivery workflow that can be configured for your operation.",
  "Vendas · Hoje": "Sales · Today",
  "FATURAMENTO HOJE": "REVENUE TODAY",
  "98 vendas": "98 sales",
  "Pico de vendas: 18h": "Sales peak: 6 PM",
  "R$ 820 no período": "R$ 820 in the period",
  "01 · VENDAS DO DIA": "01 · DAILY SALES",
  "Descubra os horários que mais vendem": "Discover your strongest sales hours",
  "O gráfico diário mostra a evolução das vendas por horário, o faturamento, o ticket médio e o pico do dia. Exemplo: às 18h foram vendidos R$ 820, ajudando a planejar equipe e reposição.": "The daily chart shows sales by hour, revenue, average ticket and the day's peak. In this example, R$ 820 was sold at 6 PM, helping plan staffing and restocking.",
  "Vendas · Semana": "Sales · Week",
  "FATURAMENTO SEMANAL": "WEEKLY REVENUE",
  "+12,4% sobre a semana anterior": "+12.4% over the previous week",
  "642 vendas": "642 sales",
  "Melhor dia: sábado": "Best day: Saturday",
  "R$ 4.920 em vendas": "R$ 4,920 in sales",
  "02 · VISÃO SEMANAL": "02 · WEEKLY VIEW",
  "Compare resultados e reconheça tendências": "Compare results and recognize trends",
  "A visão semanal permite comparar cada dia e perceber crescimento ou queda. No exemplo, sábado faturou R$ 4.920 e a semana cresceu 12,4% em relação à anterior.": "The weekly view compares each day and reveals growth or decline. In this example, Saturday generated R$ 4,920 and the week grew 12.4% over the previous one.",
  "03 · ESTOQUE": "03 · INVENTORY",
  "Reponha antes que o produto acabe": "Restock before products run out",
  "Consulte saldos, registre entradas e ajustes e identifique itens em atenção. No exemplo, a Heineken chegou a 18 unidades e já aparece destacada para reposição.": "Review balances, record incoming stock and adjustments, and identify items needing attention. In this example, Heineken reached 18 units and is highlighted for restocking.",
  "Entregas · Hoje": "Deliveries · Today",
  "PEDIDOS DE HOJE": "TODAY'S ORDERS",
  "24 entregas": "24 deliveries",
  "CONCLUÍDAS": "COMPLETED",
  "EM ROTA": "ON ROUTE",
  "AGUARDANDO": "WAITING",
  "Em rota": "On route",
  "Preparando": "Preparing",
  "Entregue": "Delivered",
  "Fluxo configurável conforme sua operação": "Workflow configurable for your operation",
  "04 · ENTREGAS CONFIGURÁVEIS": "04 · CONFIGURABLE DELIVERIES",
  "Saiba o que está parado, em rota ou entregue": "Know what is waiting, on route or delivered",
  "Um fluxo configurável pode reunir pedido, cliente, região, previsão e situação da entrega. Assim, a equipe responde com clareza e o gestor identifica atrasos antes da reclamação.": "A configurable workflow can bring together the order, customer, region, estimated time and delivery status. This helps the team respond clearly and lets managers identify delays before complaints arrive.",
  "Dados demonstrativos para exemplificar a leitura dos painéis. O fluxo de entregas é configurável e ainda não integra o módulo operacional padrão.": "Demonstration data illustrating how the dashboards are read. The delivery workflow is configurable and is not yet part of the standard operational module.",
  "Saiba onde agir antes de perder venda": "Know where to act before losing a sale",
  "Veja quanto entrou hoje, o valor médio de cada venda e quais produtos precisam de reposição. Informação pronta para decidir sem depender de várias planilhas.": "See today's revenue, the average value of each sale and which products need restocking. Decision-ready information without relying on multiple spreadsheets.",
  "Caixa": "Cash register",
  "Estoque": "Inventory",
  "Produtos": "Products",
  "Usuários": "Users",
  "Filial": "Branch",
  "Fiscal": "Tax",
  "EMPRESA ATUAL": "CURRENT BUSINESS",
  "Alterar minha senha": "Change my password",
  "Sair": "Sign out",
  "AMBIENTE DE DEMONSTRAÇÃO": "DEMO ENVIRONMENT",
  "Caixa aberto": "Cash register open",
  "Caixa fechado": "Cash register closed",
  "Operação conectada": "Connected operation",
  "Faturamento": "Revenue",
  "Vendas": "Sales",
  "Itens em estoque": "Items in inventory",
  "Produtos cadastrados": "Registered products",
  "Novo produto": "New product",
  "Produto": "Product",
  "Preço": "Price",
  "Quantidade": "Quantity",
  "Cadastro": "Created",
  "Cadastrar produto": "Add product",
  "Abrir caixa": "Open cash register",
  "Fechar caixa": "Close cash register",
  "Registrar movimento": "Record movement",
  "Forma de pagamento": "Payment method",
  "Finalizar venda": "Complete sale",
  "Dinheiro": "Cash",
  "Crédito": "Credit card",
  "Débito": "Debit card",
  "Nome": "Name",
  "Confirmar": "Confirm",
  "Salvar": "Save",
  "Fechar": "Close",
  "Voltar": "Back",
  "Cancelar": "Cancel",
  "Carregando...": "Loading...",
  "Criar teste gratuito": "Create free trial",
  "Voltar ao login": "Back to sign in",
  "Teste grátis por 7 dias": "Free 7-day trial",
  "Personalize a plataforma para sua empresa.": "Customize the platform for your business.",
  "Crie sua conta": "Create your account",
  "Empresa": "Business",
  "Segmento": "Industry",
  "Cidade": "City",
  "Responsável": "Account owner",
  "E-mail": "Email",
  "CONFIGURAÇÃO GUIADA": "GUIDED SETUP",
  "Pular por agora": "Skip for now",
  "Configure a empresa": "Configure your business",
  "Cadastre o primeiro produto": "Add your first product",
  "Abra o caixa": "Open the cash register",
  "Faça a primeira venda": "Complete your first sale",
  "Salvar empresa": "Save business",
  "Escolha um produto": "Choose a product",
  "Concluir primeira venda": "Complete first sale",
  "Configuração concluída!": "Setup complete!",
  "Entrar no painel": "Open dashboard",
  "ASSINATURA VENDA+": "VENDA+ SUBSCRIPTION",
  "Plano mensal": "Monthly plan",
  "E-mail do pagador": "Payer email",
  "Continuar para pagamento": "Continue to payment",
  "Abrindo Mercado Pago...": "Opening Mercado Pago...",
  "Voltar ao Venda+": "Back to Venda+",
  "ADMINISTRAÇÃO DA PLATAFORMA": "PLATFORM ADMINISTRATION",
  "Monitor de clientes": "Customer monitor",
  "Novo usuário": "New user",
  "Tela inicial": "Home",
  "Buscar cliente": "Search customers",
  "Total": "Total",
  "Em teste": "On trial",
  "Ativos": "Active",
  "Expirados": "Expired",
  "Aguardando aprovação": "Awaiting approval",
  "Gerenciar cliente": "Manage customer",
  "Ajustar dias de teste": "Adjust trial days",
  "Ativar plano": "Activate plan",
  "Liberar 7 dias grátis": "Approve 7 free days",
  "Gerar pagamento": "Create payment",
  "Ativar conta": "Activate account",
  "Voltar para teste": "Return to trial",
  "Suspender acesso": "Suspend access",
  "Dados cadastrais": "Registration data",
  "Controle da conta": "Account control",
  "Filiais": "Branches",
  "Histórico administrativo": "Administrative history",
  "PENDENTE": "PENDING",
  "ATIVO": "ACTIVE",
  "EXPIRADO": "EXPIRED",
  "SUSPENSO": "SUSPENDED",
};

const dynamic: Array<[RegExp, (match: RegExpMatchArray) => string]> = [
  [/^Você ainda tem (\d+) dia grátis\.$/, (m) => `You still have ${m[1]} free day.`],
  [/^Você ainda tem (\d+) dias grátis\.$/, (m) => `You still have ${m[1]} free days.`],
  [/^(\d+) produtos cadastrados$/, (m) => `${m[1]} registered products`],
  [/^(\d+) de 4 etapas concluídas$/, (m) => `${m[1]} of 4 steps completed`],
  [/^Vamos preparar (.+)$/, (m) => `Let's set up ${m[1]}`],
  [/^Vencimento: (.+)$/, (m) => `Expires: ${m[1]}`],
];

const originals = new WeakMap<Node, string>();
const attributeOriginals = new WeakMap<Element, Map<string, string>>();

function translated(value: string) {
  const exact = english[value];
  if (exact) return exact;
  for (const [pattern, output] of dynamic) {
    const match = value.match(pattern);
    if (match) return output(match);
  }
  return value;
}

function translateNode(root: Node, locale: Locale, captureChanges = false) {
  const nodes: Node[] = [root];
  while (nodes.length) {
    const node = nodes.pop()!;
    if (node.nodeType === Node.TEXT_NODE) {
      const current = node.textContent ?? "";
      if (!current.trim()) continue;
      if (captureChanges && originals.has(node)) {
        const saved = originals.get(node)!;
        const savedTrimmed = saved.trim();
        const expected = saved.replace(
          savedTrimmed,
          locale === "en" ? translated(savedTrimmed) : savedTrimmed,
        );
        if (current !== expected) originals.set(node, current);
      }
      if (!originals.has(node)) originals.set(node, current);
      const original = originals.get(node)!;
      const trimmed = original.trim();
      const replacement = locale === "en" ? translated(trimmed) : trimmed;
      const next = original.replace(trimmed, replacement);
      if (node.textContent !== next) node.textContent = next;
      continue;
    }
    if (node instanceof Element) {
      for (const attribute of ["placeholder", "title", "aria-label"]) {
        const current = node.getAttribute(attribute);
        if (!current) continue;
        let saved = attributeOriginals.get(node);
        if (!saved) {
          saved = new Map();
          attributeOriginals.set(node, saved);
        }
        if (!saved.has(attribute)) saved.set(attribute, current);
        const original = saved.get(attribute)!;
        node.setAttribute(attribute, locale === "en" ? translated(original) : original);
      }
      nodes.push(...Array.from(node.childNodes));
    }
  }
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>("pt-BR");
  useEffect(() => {
    const saved = localStorage.getItem("vendamais-language") as Locale | null;
    const detected = navigator.language.toLowerCase().startsWith("pt") ? "pt-BR" : "en";
    setLocale(saved === "pt-BR" || saved === "en" ? saved : detected);
  }, []);
  useEffect(() => {
    document.documentElement.lang = locale;
    document.cookie = `vendamais-language=${locale};path=/;max-age=31536000;SameSite=Lax`;
    translateNode(document.body, locale);
    // Do not observe React-managed content. Mutating chat/dashboard nodes while
    // React reconciles them can invalidate its references and crash the page.
  }, [locale]);
  const choose = (next: Locale) => {
    localStorage.setItem("vendamais-language", next);
    setLocale(next);
  };
  return <>{children}<div className="language-switcher" style={{ position: "fixed", top: 12, right: 12, bottom: "auto" }} role="group" aria-label="Idioma / Language"><button className={locale === "pt-BR" ? "active" : ""} onClick={() => choose("pt-BR")} aria-label="Português">PT</button><button className={locale === "en" ? "active" : ""} onClick={() => choose("en")} aria-label="English">EN</button></div></>;
}
