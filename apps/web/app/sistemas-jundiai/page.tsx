import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sistema de vendas em Jundiaí | Venda+",
  description: "Sistema de vendas, estoque, pedidos, pós-venda e soluções sob medida para restaurantes, pizzarias, adegas, moda e empresas em Jundiaí.",
  alternates: { canonical: "/sistemas-jundiai" },
  openGraph: {
    title: "Sistema de vendas em Jundiaí | Venda+",
    description: "Vendas, estoque, pedidos e gestão para negócios que precisam operar melhor.",
    url: "https://www.vendamais-app.com/sistemas-jundiai",
    type: "website",
  },
};

const solutions = [
  { icon: "▣", title: "Restaurantes, pizzarias e adegas", text: "Atendimento ágil, pedidos, estoque conectado, caixa, nota fiscal e pós-venda para a rotina de alto giro." },
  { icon: "✦", title: "Moda, têxtil e estamparia", text: "Criação de novos modelos, projetos, estamparia, catálogo, vendas e relacionamento depois da compra." },
  { icon: "◌", title: "Sistemas sob medida", text: "Desenvolvimento de sistemas, SaaS, aplicativos e automações com IA moldados ao processo da sua empresa." },
];

export default function SistemasJundiaiPage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Venda+ — Sistemas de vendas e gestão",
    url: "https://www.vendamais-app.com/sistemas-jundiai",
    description: "Sistemas de vendas, estoque, pedidos, automação e desenvolvimento sob medida para empresas.",
    areaServed: ["Jundiaí", "Campinas", "São Paulo"],
    provider: { "@type": "Organization", name: "Venda+", url: "https://www.vendamais-app.com" },
    serviceType: ["Sistema de vendas", "Desenvolvimento de sistemas", "Automação com inteligência artificial", "Desenvolvimento de aplicativos"],
  };
  return <main className="seo-landing">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    <nav className="seo-nav"><a href="/" className="seo-brand"><i>V</i><b>Venda<span>+</span></b></a><div><a href="/biblioteca">Biblioteca</a><a href="/teste" className="seo-nav-cta">Teste grátis</a></div></nav>
    <section className="seo-hero">
      <div><small>SISTEMAS PARA EMPRESAS EM JUNDIAÍ E REGIÃO</small><h1>Venda, estoque e atendimento funcionando como uma só operação.</h1><p>O Venda+ organiza a rotina de restaurantes, pizzarias, adegas, empresas de moda e negócios que precisam de um sistema feito para sua realidade.</p><div className="seo-actions"><a href="/teste">Começar teste grátis <span>→</span></a><a className="outline" href="#solucoes">Ver soluções</a></div><p className="seo-note">Sem cobrança para solicitar o teste.</p></div>
      <aside className="seo-dashboard" aria-label="Visão resumida do sistema"><header><span>VENDA+ · HOJE</span><b>Operação em movimento</b></header><div className="seo-metrics"><span><small>Pedidos</small><b>48</b><em>+18%</em></span><span><small>Estoque</small><b>1.284</b><em className="ok">em dia</em></span><span><small>Atendimento</small><b>12 min</b><em className="gold">média</em></span></div><div className="seo-lines"><i /><i /><i /><i /><i /><i /></div><footer><b>Vendas, estoque e clientes</b><span>em uma visão clara</span></footer></aside>
    </section>
    <section id="solucoes" className="seo-solutions"><div className="seo-heading"><small>FEITO PARA A OPERAÇÃO REAL</small><h2>Uma plataforma. Várias formas de crescer.</h2><p>Escolha uma solução pronta ou converse com a gente sobre um projeto específico.</p></div><div>{solutions.map(solution => <article key={solution.title}><i>{solution.icon}</i><h3>{solution.title}</h3><p>{solution.text}</p><a href="/teste">Quero conhecer <span>→</span></a></article>)}</div></section>
    <section className="seo-keywords"><div><small>DESENVOLVIMENTO E AUTOMAÇÃO</small><h2>Mais do que um software: uma operação mais inteligente.</h2><p>Desenvolvemos sistemas de vendas, ERP para pequenas empresas, aplicativos, SaaS e agentes de IA para reduzir tarefas repetitivas e transformar dados em decisões.</p></div><ul><li>PDV e controle de caixa</li><li>Estoque e catálogo conectados</li><li>Pedidos, atendimento e pós-venda</li><li>Nota fiscal e gestão operacional</li><li>Automação com inteligência artificial</li><li>Projetos e sistemas sob medida</li></ul></section>
    <section className="seo-final"><small>PRONTO PARA ORGANIZAR A SUA EMPRESA?</small><h2>Conheça o Venda+ com a sua própria operação.</h2><p>Solicite o teste gratuito e veja como o sistema pode se adaptar ao seu negócio.</p><a href="/teste">Quero testar o Venda+ <span>→</span></a></section>
  </main>;
}
