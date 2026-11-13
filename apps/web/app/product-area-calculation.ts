/** Estimate whole sale units needed to cover an area, including a loss margin. */
export function calculateProductUnits(area: number, coverage: number, lossPercent: number): number | null {
  if (![area, coverage, lossPercent].every(Number.isFinite) || area <= 0 || coverage <= 0 || lossPercent < 0 || lossPercent > 100) return null;
  const ratio = area * (1 + lossPercent / 100) / coverage;
  const quantity = Math.ceil(ratio - Number.EPSILON * Math.max(1, Math.abs(ratio)) * 4);
  return Number.isSafeInteger(quantity) && quantity > 0 ? quantity : null;
}
