import type { Asset, Portfolio } from '../types';

export const MAX_VALUE = 1_000_000_000;
export const MAX_ASSETS = 20;
export const SYMBOL_PATTERN = /^[A-Z0-9][A-Z0-9.:-]{0,29}$/;
export const toCents = (value: number) => Math.round(value * 100);
export const toBasisPoints = (weight: number) => Math.round(weight * 10_000);
export const getValueCents = (asset: Asset) =>
  toCents(
    asset.basis === 'shares'
      ? asset.shares * (asset.currentPrice ?? 0)
      : asset.currentValue,
  );
export const calculateTotalPercentage = (assets: Asset[]) =>
  assets.reduce(
    (sum, asset) => sum + toBasisPoints(asset.targetPercentage),
    0,
  ) / 100;

export function hasHolding(
  assets: Asset[],
  { symbol, kind }: Pick<Asset, 'symbol' | 'kind'>,
): boolean {
  return assets.some((asset) => asset.symbol === symbol && asset.kind === kind);
}

export function isBounded(value: unknown, max = MAX_VALUE): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= max
  );
}

export function validatePortfolio({ assets, newMoney }: Portfolio) {
  const errors: string[] = [];
  if (!assets.length) errors.push('Add a holding to create your plan.');
  if (assets.length > MAX_ASSETS) errors.push('Use up to 20 holdings.');
  if (
    !isBounded(newMoney) ||
    Math.abs(newMoney * 100 - toCents(newMoney)) > 0.0001
  ) {
    errors.push(
      'Enter a contribution between $0 and $1 billion, with at most two decimal places.',
    );
  }
  const keys = assets.map((a) => a.kind + ':' + a.symbol);
  if (new Set(keys).size !== keys.length)
    errors.push('Each asset can appear only once.');
  for (const asset of assets) {
    const name = asset.symbol || 'Holding';
    if (!SYMBOL_PATTERN.test(asset.symbol))
      errors.push(
        'Use a symbol with 1–30 letters, digits, dots, colons, or hyphens.',
      );
    if (!isBounded(asset.currentValue) || !isBounded(asset.shares, 1e12))
      errors.push(name + ': enter a valid holding.');
    if (
      !isBounded(asset.targetPercentage, 1) ||
      Math.abs(
        asset.targetPercentage * 10_000 - toBasisPoints(asset.targetPercentage),
      ) > 0.000001
    ) {
      errors.push(
        name + ': target must be 0–100%, with at most two decimal places.',
      );
    }
    if (
      asset.currentPrice !== undefined &&
      (!isBounded(asset.currentPrice) || asset.currentPrice <= 0)
    ) {
      errors.push(name + ': enter a positive price.');
    }
    if (asset.basis === 'shares' && asset.shares > 0 && !asset.currentPrice) {
      errors.push(name + ': set a price to value your shares.');
    }
    if (
      !Number.isSafeInteger(getValueCents(asset)) ||
      getValueCents(asset) < 0 ||
      getValueCents(asset) > MAX_VALUE * 100
    ) {
      errors.push(name + ': holding value must be at most $1 billion.');
    }
  }
  const total = assets.reduce(
    (sum, a) => sum + toBasisPoints(a.targetPercentage),
    0,
  );
  if (assets.length && total !== 10_000) {
    errors.push(
      total < 10_000
        ? 'Allocate the remaining ' + ((10_000 - total) / 100).toFixed(2) + '%.'
        : 'Reduce targets by ' +
            ((total - 10_000) / 100).toFixed(2) +
            '% to reach 100%.',
    );
  }
  return { isValid: !errors.length, errors: [...new Set(errors)] };
}
