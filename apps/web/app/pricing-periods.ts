export type BillingCycle = "MONTHLY" | "SEMIANNUAL" | "ANNUAL";

export const billingCycles = [
  { code: "MONTHLY" as const, label: "Mensal", months: 1, discount: 0, days: 30 },
  { code: "SEMIANNUAL" as const, label: "Semestral", months: 6, discount: 0.2, days: 180 },
  { code: "ANNUAL" as const, label: "Anual", months: 12, discount: 0.3, days: 365 },
];

export const cyclePrice = (monthly: number, cycle: BillingCycle) => {
  const period = billingCycles.find((item) => item.code === cycle)!;
  return Math.round(monthly * period.months * (1 - period.discount) * 100) / 100;
};

