import { describe, expect, it } from 'vitest';
import { calculateAllocations } from '../src/utils/calculations';
import { createAsset, examplePortfolio } from '../src/utils/portfolio';
import { getValueCents, validatePortfolio } from '../src/utils/validation';
import type { Asset } from '../src/types';

const holding = (
  symbol: string,
  value: number,
  target: number,
  noSell = false,
) =>
  createAsset({
    symbol,
    currentValue: value,
    targetPercentage: target,
    noSell,
  });
function assertInvariants(assets: Asset[], cash: number, selling: boolean) {
  const result = calculateAllocations(assets, cash, selling);
  const cents = result.map((r) => Math.round(r.amountToAdd * 100));
  expect(cents.reduce((sum, c) => sum + c, 0)).toBe(Math.round(cash * 100));
  const total =
    assets.reduce((sum, a) => sum + getValueCents(a), 0) +
    Math.round(cash * 100);
  result.forEach((r, i) => {
    const final = Math.round(r.newValue * 100);
    expect(final).toBeGreaterThanOrEqual(0);
    if (!selling || assets[i].noSell)
      expect(cents[i]).toBeGreaterThanOrEqual(0);
    expect(final).toBe(getValueCents(assets[i]) + cents[i]);
    expect(r.newPercentage).toBe(total ? (final / total) * 100 : 0);
  });
  return result;
}

describe('allocation contract', () => {
  it('matches the default portfolio and the corrected README example', () => {
    const p = examplePortfolio();
    expect(
      calculateAllocations(p.assets, p.newMoney).map((r) => r.amountToAdd),
    ).toEqual([400, 300, 300]);
    expect(
      calculateAllocations(
        [
          holding('VOO', 1800, 0.5),
          holding('QQQ', 900, 0.3),
          holding('NVDA', 300, 0.2),
        ],
        1000,
      ).map((r) => r.amountToAdd),
    ).toEqual([200, 300, 500]);
  });
  it('reconciles all 9,900 selling-mode cent cases from the audit', () => {
    for (let cents = 1; cents <= 100; cents++)
      for (let weight = 1; weight < 100; weight++) {
        const assets = [
          holding('AAA', 0, weight / 100),
          holding('BBB', 0, (100 - weight) / 100),
        ];
        const r = calculateAllocations(assets, cents / 100, true);
        expect(
          r.reduce((sum, a) => sum + Math.round(a.amountToAdd * 100), 0),
        ).toBe(cents);
      }
  });
  it('shares money between symmetric underweights and ignores row ordering', () => {
    const assets = [
      holding('AAA', 800, 0.5),
      holding('BBB', 100, 0.25),
      holding('CCC', 100, 0.25),
    ];
    const original = calculateAllocations(assets, 100);
    expect(original.map((r) => r.amountToAdd)).toEqual([0, 50, 50]);
    expect(calculateAllocations([...assets].reverse(), 100).reverse()).toEqual(
      original,
    );
  });
  it('uses deterministic penny tie breaks', () => {
    const assets = [holding('AAA', 0, 0.5), holding('BBB', 0, 0.5)];
    expect(
      calculateAllocations(assets, 0.01, true).map((r) => r.amountToAdd),
    ).toEqual([0.01, 0]);
    expect(
      calculateAllocations([...assets].reverse(), 0.01, true).reverse(),
    ).toEqual(calculateAllocations(assets, 0.01, true));
  });
  it('supports zero contribution, zero targets, locked positions, and zero-value portfolios', () => {
    expect(
      assertInvariants(
        [holding('AAA', 800, 0.5), holding('BBB', 200, 0.5)],
        0,
        true,
      ).map((r) => r.amountToAdd),
    ).toEqual([-300, 300]);
    expect(
      assertInvariants(
        [holding('AAA', 800, 0), holding('BBB', 200, 1)],
        100,
        false,
      ).map((r) => r.amountToAdd),
    ).toEqual([0, 100]);
    expect(
      assertInvariants(
        [holding('AAA', 900, 0.5, true), holding('BBB', 100, 0.5)],
        100,
        true,
      ).map((r) => r.amountToAdd),
    ).toEqual([0, 100]);
    expect(
      assertInvariants(
        [holding('AAA', 0, 0.5), holding('BBB', 0, 0.5)],
        0,
        false,
      ).every((r) => r.newPercentage === 0),
    ).toBe(true);
  });
  it('supports a single holding and large cent totals', () => {
    assertInvariants([holding('AAA', 1e9, 1)], 1e9, true);
    assertInvariants(
      Array.from({ length: 20 }, (_, i) =>
        holding('A' + i, 1e9 - i / 100, 0.05),
      ),
      1e9,
      true,
    );
  });
  it('rejects nonfinite values, excessive precision, and 99.95% target totals', () => {
    expect(() =>
      calculateAllocations(
        [holding('AAA', 0, 0.5), holding('BBB', 0, 0.4995)],
        1e6,
        true,
      ),
    ).toThrow(/remaining/);
    for (const value of [NaN, Infinity, -1, 1e9 + 1]) {
      expect(
        validatePortfolio({
          assets: [holding('AAA', value, 1)],
          newMoney: 0,
          enableSelling: false,
        }).isValid,
      ).toBe(false);
    }
    expect(() => calculateAllocations([holding('AAA', 0, 1)], 0.001)).toThrow();
  });
  it('finds a least-squares optimum against brute force on small cent portfolios', () => {
    for (let a = 0; a <= 4; a++)
      for (let b = 0; b <= 4; b++)
        for (const selling of [false, true]) {
          const assets = [
            holding('AAA', a / 100, 0.5, true),
            holding('BBB', b / 100, 0.3),
            holding('CCC', 0.02, 0.2),
          ];
          const result = assertInvariants(assets, 0.03, selling);
          const total = a + b + 5;
          const target = [0.5, 0.3, 0.2].map((w) => w * total);
          const score = (values: number[]) =>
            values.reduce((sum, v, i) => sum + (v - target[i]) ** 2, 0);
          const actual = score(result.map((r) => Math.round(r.newValue * 100)));
          let best = Infinity;
          for (let x = a; x <= total; x++)
            for (let y = selling ? 0 : b; y <= total - x; y++) {
              const z = total - x - y;
              if (!selling && z < 2) continue;
              best = Math.min(best, score([x, y, z]));
            }
          expect(actual).toBeCloseTo(best, 8);
        }
  });
  it('preserves invariants across 1,000 deterministic mixed portfolios', () => {
    let seed = 123456;
    const next = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed;
    };
    for (let i = 0; i < 1000; i++) {
      const cut1 = next() % 10001,
        cut2 = next() % 10001;
      const low = Math.min(cut1, cut2),
        high = Math.max(cut1, cut2);
      const weights = [low, high - low, 10000 - high];
      const assets = weights.map((bp, index) =>
        holding(
          'A' + index,
          (next() % 10000000) / 100,
          bp / 10000,
          next() % 3 === 0,
        ),
      );
      assertInvariants(assets, (next() % 100000) / 100, i % 2 === 0);
    }
  });
});
