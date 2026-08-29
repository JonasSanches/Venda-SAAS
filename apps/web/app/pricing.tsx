export function Pricing({ compact = false }: { compact?: boolean }) {
  return (
    <section className={`pricing-section ${compact ? "compact" : ""}`} id={compact ? undefined : "planos"}>
      <div className="section-heading">
        <small>PLANOS SIMPLES E SUPORTE 24H</small>
        <h2>Escolha somente depois de testar.</h2>
        <p>O cadastro e os 7 dias de teste são gratuitos. Você não paga nada agora. Conheça o sistema primeiro e escolha o plano mais adequado depois.</p>
      </div>
      <div className="pricing-grid">
        <article>
          <span>PARA COMEÇAR</span><h3>Essencial</h3><strong><small>R$</small> 129 <small>/mês</small></strong>
          <p>Para uma operação menor que precisa organizar vendas, produtos, estoque, caixa e indicadores.</p>
          <ul><li>PDV e formas de pagamento</li><li>Produtos e estoque conectado</li><li>Abertura e fechamento de caixa</li><li>Painel com os principais números</li><li>Suporte 24 horas</li></ul>
        </article>
        <article className="featured">
          <span>PARA CRESCER</span><h3>Performance</h3><strong><small>R$</small> 249 <small>/mês</small></strong>
          <p>Para negócios em crescimento que precisam organizar melhor equipe, filiais e gestão.</p>
          <ul><li>Rotina de vendas, estoque e caixa</li><li>Usuários separados por função</li><li>Organização por filiais</li><li>Controles administrativos ampliados</li><li>Suporte 24 horas</li></ul>
        </article>
        <article>
          <span>PARA EXPANDIR</span><h3>Escala</h3><strong><small>R$</small> 499 <small>/mês</small></strong>
          <p>Para operações mais complexas, com várias equipes ou unidades e estrutura preparada para expansão.</p>
          <ul><li>Gestão centralizada da operação</li><li>Equipes, permissões e filiais</li><li>Monitoramento administrativo</li><li>Histórico para maior controle</li><li>Suporte 24 horas</li></ul>
        </article>
      </div>
      <a className="pricing-cta" href="/teste">Começar meus 7 dias grátis</a>
      <small className="pricing-note">Sem cobrança no cadastro. Valores mensais dos planos após o período gratuito.</small>
    </section>
  );
}
