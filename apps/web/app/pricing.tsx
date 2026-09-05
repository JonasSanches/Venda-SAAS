"use client";
import { useState } from "react";
import { planComparison, type PlanCode } from "./plan-comparison";
import { billingCycles, cyclePrice, type BillingCycle } from "./pricing-periods";

const plans: Array<{ code: PlanCode; eyebrow: string; name: string; price: number; description: string; featured?: boolean }> = [
  { code: "ESSENTIAL", eyebrow: "PRA COMEÇAR", name: "Essencial", price: 129, description: "Para uma operação menor que precisa organizar vendas, produtos, estoque, caixa e indicadores." },
  { code: "PERFORMANCE", eyebrow: "PRA CRESCER", name: "Performance", price: 249, description: "Para negócios em crescimento que precisam organizar melhor equipe, filiais e gestão.", featured: true },
  { code: "SCALE", eyebrow: "PRA EXPANDIR", name: "Escala", price: 499, description: "Para operações mais complexas, com várias equipes ou unidades e estrutura preparada para expansão." },
];

export function Pricing({ compact = false }: { compact?: boolean }) {
  const [cycle, setCycle] = useState<BillingCycle>("MONTHLY");
  const period = billingCycles.find((item) => item.code === cycle)!;
  return (
    <section className={`pricing-section ${compact ? "compact" : ""}`} id={compact ? undefined : "planos"}>
      <div className="section-heading">
        <small>PLANOS SIMPLES E SUPORTE 24H</small>
        <h2>Escolha somente depois de testar.</h2>
        <p>O cadastro e os 7 dias de teste são gratuitos. Você não paga nada agora. Conheça o sistema primeiro e escolha o plano mais adequado depois.</p>
      </div>
      <div className="billing-cycle-tabs" aria-label="Período do plano">{billingCycles.map((item) => <button type="button" className={cycle === item.code ? "active" : ""} onClick={() => setCycle(item.code)} key={item.code}>{item.label}{item.discount > 0 && <small>Economize {item.discount * 100}%</small>}</button>)}</div>
      <div className="pricing-grid">
        {plans.map((plan) => <article className={plan.featured ? "featured" : undefined} key={plan.code}>
          <span>{plan.eyebrow}</span><h3>{plan.name}</h3><strong><small>R$</small> {cyclePrice(plan.price, cycle).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} <small>/{period.label.toLowerCase()}</small></strong>
          {cycle !== "MONTHLY" && <div className="cycle-saving"><b>{Math.round(period.discount * 100)}% de desconto</b><span>equivale a R$ {(cyclePrice(plan.price, cycle) / period.months).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} por mês</span></div>}
          <p>{plan.description}</p>
          <ul className="plan-feature-list">{planComparison.map((feature) => { const included = feature.included[plan.code]; return <li className={included ? "included" : "excluded"} key={feature.label}><i aria-hidden="true">{included ? "✓" : "×"}</i><span>{feature.label}</span><small className="sr-only">{included ? "Incluído" : "Não incluído"}</small></li>; })}</ul>
        </article>)}
      </div>
      <a className="pricing-cta" href="/teste">Começar meus 7 dias grátis</a>
      <small className="pricing-note">Sem cobrança no cadastro. Planos semestrais e anuais são cobrados pelo período escolhido; no cartão, o parcelamento depende da aprovação do Mercado Pago.</small>
    </section>
  );
}
