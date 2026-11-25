import type { Asset, AllocationResult } from '../types';
import {
  getValueCents,
  toBasisPoints,
  toCents,
  validatePortfolio,
} from './validation';

/**
 * Project target values onto the feasible portfolio:
 * minimize the sum of squared percentage-point deviations, subject to
 * cash conservation, nonnegative holdings, and optional no-selling bounds.
 * Round the final positions once, allocating residual cents by largest remainder.
 */
export function calculateAllocations(
  assets: Asset[],
  newMoney: number,
  enableSelling = false,
): AllocationResult[] {
  const validation = validatePortfolio({ assets, newMoney, enableSelling });
  if (!validation.isValid) throw new Error(validation.errors.join(' '));
  const current = assets.map(getValueCents);
  const total =
    current.reduce((sum, value) => sum + value, 0) + toCents(newMoney);
  const desired = assets.map(
    (a) => (total * toBasisPoints(a.targetPercentage)) / 10_000,
  );
  const lower = assets.map((a, i) =>
    !enableSelling || a.noSell ? current[i] : 0,
  );
  const projected = [...lower];
  let free = assets.map((_, i) => i);
  let budget = total;
  while (free.length) {
    const offset =
      (free.reduce((sum, i) => sum + desired[i], 0) - budget) / free.length;
    const constrained = free.filter((i) => desired[i] - offset < lower[i]);
    if (!constrained.length) {
      free.forEach((i) => {
        projected[i] = Math.max(lower[i], desired[i] - offset);
      });
      break;
    }
    const fixed = new Set(constrained);
    constrained.forEach((i) => {
      projected[i] = lower[i];
      budget -= lower[i];
    });
    free = free.filter((i) => !fixed.has(i));
  }
  const final = projected.map(Math.floor);
  let remainder = total - final.reduce((sum, value) => sum + value, 0);
  const order = assets
    .map((asset, i) => ({
      i,
      fraction: projected[i] - final[i],
      key: asset.kind + ':' + asset.symbol,
    }))
    .sort((a, b) =>
      Math.abs(b.fraction - a.fraction) > 1e-7
        ? b.fraction - a.fraction
        : a.key.localeCompare(b.key, 'en'),
    );
  for (const { i } of order) {
    if (remainder <= 0) break;
    final[i]++;
    remainder--;
  }
  if (remainder !== 0) throw new Error('Could not reconcile the trade plan.');
  return assets.map((asset, i) => {
    const percentage = total > 0 ? (final[i] / total) * 100 : 0;
    const target = toBasisPoints(asset.targetPercentage) / 100;
    return {
      id: asset.id,
      symbol: asset.symbol,
      amountToAdd: (final[i] - current[i]) / 100,
      newValue: final[i] / 100,
      newPercentage: percentage,
      targetPercentage: target,
      difference: percentage - target,
    };
  });
}
