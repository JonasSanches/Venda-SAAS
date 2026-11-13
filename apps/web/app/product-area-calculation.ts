/** Estimate whole sale units needed to cover an area, including a loss margin. */
export function calculateProductUnits(area: number, coverage: number, lossPercent: number): number | null {
  if (![area, coverage, lossPercent].every(Number.isFinite) || area <= 0 || coverage <= 0 || lossPercent < 0 || lossPercent > 100) return null;
  const quantity = Math.ceil(area * (1 + lossPercent / 100) / coverage);
  return Number.isSafeInteger(quantity) && quantity > 0 ? quantity : null;
}
