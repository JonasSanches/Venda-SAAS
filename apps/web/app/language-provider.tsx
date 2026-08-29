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
  "VENDA MAIS • CONTROLE MAIS • DECIDA MELHOR": "SELL MORE • CONTROL MORE • DECIDE BETTER",
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
  "FEITO PARA QUEM VENDE TODOS OS DIAS": "BUILT FOR BUSINESSES THAT OPERATE EVERY DAY",
  "Uma operação organizada, seja qual for o seu balcão.": "An organized operation, whatever your business.",
  "O Venda Mais se adapta à rotina de negócios que precisam vender com agilidade e manter produtos, equipe e caixa organizados.": "Venda Mais adapts to businesses that need agility and organized products, teams, cash flow and processes.",
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
  "O Venda Mais reúne a operação em painéis simples: o caixa registra, o estoque acompanha, a gestão compara e você controla acessos, filiais e resultados de onde estiver.": "Venda Mais brings your operation into simple dashboards: cash is recorded, inventory is tracked, management compares results, and you control access and branches from anywhere.",
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
  "Não. O Venda Mais funciona pelo navegador no computador, tablet ou celular.": "No. Venda Mais runs in your browser on desktop, tablet or mobile.",
  "Quando começam os 7 dias grátis?": "When do my 7 free days start?",
  "Meus dados ficam misturados com os de outra empresa?": "Is my data mixed with another company's data?",
  "Não. Cada empresa possui ambiente, usuários, dados e configurações independentes.": "No. Each business has its own environment, users, data and settings.",
  "Consigo controlar quem acessa o sistema?": "Can I control who accesses the system?",
  "Sim. Você cria usuários e define funções como administrador, gerente, caixa ou estoque.": "Yes. Create users and assign roles such as administrator, manager, cashier or inventory.",
  "PRONTO PARA ORGANIZAR SUA OPERAÇÃO?": "READY TO ORGANIZE YOUR OPERATION?",
  "Teste o Venda Mais gratuitamente por 7 dias.": "Try Venda Mais free for 7 days.",
  "Quero testar o Venda Mais": "I want to try Venda Mais",
  "Sem cobrança para solicitar o teste.": "No charge to request your trial.",
  "PLANOS SIMPLES E SUPORTE 24H": "SIMPLE PLANS AND 24/7 SUPPORT",
  "Escolha somente depois de testar.": "Choose only after your trial.",
  "O cadastro e os 7 dias de teste são gratuitos. Você não paga nada agora. Conheça o sistema primeiro e escolha o plano mais adequado depois.": "Registration and the 7-day trial are free. You pay nothing now. Explore the system first and choose the best plan afterward.",
  "PARA COMEÇAR": "TO GET STARTED",
  "PARA CRESCER": "TO GROW",
  "PARA EXPANDIR": "TO EXPAND",
  "Essencial": "Essential",
  "Escala": "Scale",
  "/mês": "/month",
  "Para uma operação menor que precisa organizar vendas, produtos, estoque, caixa e indicadores.": "For a smaller operation that needs to organize sales, products, inventory, cash control and indicators.",
  "Para negócios em crescimento que precisam organizar melhor equipe, filiais e gestão.": "For growing businesses that need better organization for teams, branches and management.",
  "Para operações mais complexas, com várias equipes ou unidades e estrutura preparada para expansão.": "For more complex operations with multiple teams or locations and an expansion-ready structure.",
  "PDV e formas de pagamento": "POS and payment methods",
  "Produtos e estoque conectado": "Products and connected inventory",
  "Abertura e fechamento de caixa": "Cash opening and closing",
  "Painel com os principais números": "Dashboard with key figures",
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
  "ASSINATURA VENDA MAIS": "VENDA MAIS SUBSCRIPTION",
  "Plano mensal": "Monthly plan",
  "E-mail do pagador": "Payer email",
  "Continuar para pagamento": "Continue to payment",
  "Abrindo Mercado Pago...": "Opening Mercado Pago...",
  "Voltar ao Venda Mais": "Back to Venda Mais",
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
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === "characterData")
          translateNode(record.target, locale, true);
        for (const node of Array.from(record.addedNodes)) translateNode(node, locale);
      }
    });
    observer.observe(document.body, {
      childList: true,
      characterData: true,
      subtree: true,
    });
    return () => observer.disconnect();
  }, [locale]);
  const choose = (next: Locale) => {
    localStorage.setItem("vendamais-language", next);
    setLocale(next);
  };
  return <>{children}<div className="language-switcher" style={{ position: "fixed", top: 12, right: 12, bottom: "auto" }} role="group" aria-label="Idioma / Language"><button className={locale === "pt-BR" ? "active" : ""} onClick={() => choose("pt-BR")} aria-label="Português">PT</button><button className={locale === "en" ? "active" : ""} onClick={() => choose("en")} aria-label="English">EN</button></div></>;
}
