type HelpCenterProps = { segment?: string; embedded?: boolean };

const dailyTasks = [
  ["01", "Começar com segurança", "Confira empresa e filial, use seu próprio acesso e revise seu perfil antes de operar."],
  ["02", "Cadastrar produtos", "Organize nome, código, preço e imagem. Um catálogo bem feito torna a venda mais rápida."],
  ["03", "Controlar estoque", "Registre entrada, ajuste ou perda com motivo. Não repita uma baixa que já veio de uma venda concluída."],
  ["04", "Vender no PDV", "Busque ou leia o item, confira quantidades e pagamento e só então conclua a venda."],
  ["05", "Conferir o caixa", "Abra o turno, registre suprimentos e retiradas e faça o fechamento com conferência."],
  ["06", "Acompanhar resultados", "Use a visão geral para entender movimento, faturamento, ticket médio e pontos de atenção."],
];

const quickAnswers = [
  ["Não encontro uma função", "Confira se você está na filial correta e se o seu perfil tem a permissão necessária. O menu muda por função e segmento."],
  ["O produto não aparece no PDV", "Pesquise pelo nome, SKU ou código de barras e confirme se o produto foi cadastrado para a operação."],
  ["O saldo parece diferente", "Revise vendas, entradas, ajustes e perdas antes de criar uma nova movimentação manual."],
  ["Preciso usar pelo celular", "Abra o Venda+ no navegador. Em ações de leitura, permita o acesso à câmera somente quando for usar o scanner."],
];

const segmentGuide: Record<string, { title: string; text: string }> = {
  PIZZERIA: { title: "Pizzaria", text: "Cadastre tamanhos, sabores, adicionais e ficha técnica; depois use o fluxo de pedidos e cozinha conforme sua permissão." },
  RESTAURANT: { title: "Restaurante", text: "Organize produtos, atendimento e produção. Mantenha os itens e os preços atualizados antes do turno." },
  APPAREL_CUSTOMIZATION: { title: "Estamparia e personalizados", text: "No Estúdio de moldes, escolha a bermuda, posicione a arte em frente e costas e salve como produto ou ficha visual." },
  QR_SALES: { title: "Menu Digital por QR Code", text: "Mantenha cardápio, preço e disponibilidade corretos antes de divulgar o link ou o QR Code aos clientes." },
  TRANSPORTATION: { title: "Transportadoras", text: "Registre eventos e evidências antes de iniciar cobranças ou acompanhamentos do fluxo de transporte." },
};

export function HelpCenter({ segment, embedded = false }: HelpCenterProps) {
  const segmentContent = segment ? segmentGuide[segment] : undefined;
  return <section className={`help-center ${embedded ? "help-center-embedded" : ""}`}>
    {!embedded && <header className="help-public-header"><a href="/" className="help-brand"><i>V</i><b>Venda<span>+</span></b></a><a href="/">Entrar no sistema</a></header>}
    <section className="help-hero"><div><small>AJUDA E TREINAMENTO</small><h1>Aprenda a operar com clareza.</h1><p>Guias simples para sua equipe vender, controlar e decidir melhor no Venda+.</p><div className="help-hero-actions"><a href="#primeiros-passos">Começar pelo básico</a><a href="#ajuda-rapida">Resolver uma dúvida</a></div></div><aside><b>6</b><span>rotinas essenciais para começar</span><em>Use uma tarefa por vez.</em></aside></section>
    <section id="primeiros-passos" className="help-section"><header><small>PRIMEIROS PASSOS</small><h2>O que sua equipe precisa fazer primeiro</h2><p>Cadastre a base da operação antes de vender: filial, pessoas, produtos, estoque e caixa.</p></header><div className="help-task-grid">{dailyTasks.map(([number, title, text])=><article key={number}><small>{number}</small><h3>{title}</h3><p>{text}</p></article>)}</div></section>
    <section className="help-section help-flow"><header><small>FLUXO DO DIA</small><h2>Da abertura ao fechamento</h2></header><ol><li><b>Abra a operação</b><span>Confirme filial, caixa e equipe do turno.</span></li><li><b>Atenda e registre</b><span>Use PDV, clientes e produtos para registrar cada venda corretamente.</span></li><li><b>Controle as mudanças</b><span>Registre entrada, ajuste ou perda de estoque com motivo.</span></li><li><b>Confira e decida</b><span>Revise caixa e indicadores antes do fechamento.</span></li></ol></section>
    {segmentContent && <section className="help-segment"><small>GUIA DO SEU SEGMENTO</small><h2>{segmentContent.title}</h2><p>{segmentContent.text}</p></section>}
    <section className="help-section"><header><small>TRILHAS POR FUNÇÃO</small><h2>Escolha o seu tipo de trabalho</h2></header><div className="help-role-grid"><article><b>Atendimento e vendas</b><p>PDV, busca de produto, cliente, quantidade, pagamento e conferência antes de concluir.</p></article><article><b>Caixa e gestão</b><p>Abertura, movimentações, fechamento e leitura de indicadores para tomar decisões.</p></article><article><b>Estoque</b><p>Produtos, recebimento, ajustes, perdas, saldos e reposição.</p></article><article><b>Administrador</b><p>Usuários, permissões, filiais, configurações e acompanhamento da operação.</p></article></div></section>
    <section id="ajuda-rapida" className="help-section help-faq"><header><small>AJUDA RÁPIDA</small><h2>Encontre a resposta antes de parar a operação</h2></header>{quickAnswers.map(([question, answer])=><details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</section>
    <section className="help-video-plan"><div><small>VÍDEOS DE TREINAMENTO</small><h2>Série prática em preparação</h2><p>Os próximos vídeos usarão telas reais do Venda+ e dados demonstrativos: primeiro acesso, produtos, estoque, caixa, PDV, usuários, filiais e módulos por segmento.</p></div><a href="https://wa.me/5511978436640?text=Ol%C3%A1%2C%20preciso%20de%20ajuda%20com%20o%20Venda%2B." target="_blank" rel="noreferrer">Falar com o suporte</a></section>
  </section>;
}
