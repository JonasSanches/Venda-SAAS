export type PlanCode = "ESSENTIAL" | "PERFORMANCE" | "SCALE";

export const planComparison: Array<{ label: string; included: Record<PlanCode, boolean> }> = [
  { label: "PDV, vendas e formas de pagamento", included: { ESSENTIAL: true, PERFORMANCE: true, SCALE: true } },
  { label: "Produtos e estoque conectado", included: { ESSENTIAL: true, PERFORMANCE: true, SCALE: true } },
  { label: "Abertura, movimentação e fechamento de caixa", included: { ESSENTIAL: true, PERFORMANCE: true, SCALE: true } },
  { label: "Painel com os principais indicadores", included: { ESSENTIAL: true, PERFORMANCE: true, SCALE: true } },
  { label: "1 filial e até 3 usuários", included: { ESSENTIAL: true, PERFORMANCE: true, SCALE: true } },
  { label: "Até 3 filiais e 10 usuários", included: { ESSENTIAL: false, PERFORMANCE: true, SCALE: true } },
  { label: "Até 10 filiais e 50 usuários", included: { ESSENTIAL: false, PERFORMANCE: false, SCALE: true } },
  { label: "Perfis, permissões e controles administrativos", included: { ESSENTIAL: false, PERFORMANCE: true, SCALE: true } },
  { label: "Painéis gerenciais e suporte prioritário", included: { ESSENTIAL: false, PERFORMANCE: true, SCALE: true } },
  { label: "Acompanhamento dedicado para expansão", included: { ESSENTIAL: false, PERFORMANCE: false, SCALE: true } },
  { label: "Suporte 24 horas", included: { ESSENTIAL: true, PERFORMANCE: true, SCALE: true } },
];
