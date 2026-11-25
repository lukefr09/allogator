import { describe, expect, it } from 'vitest';
import {
  createAsset,
  examplePortfolio,
  portfolioReducer,
} from '../src/utils/portfolio';
import { getValueCents } from '../src/utils/validation';
const quote = {
  price: 200,
  quoteTime: '2026-09-18T01:00:00Z',
  fetchedAt: '2026-09-18T01:01:00Z',
};
describe('async portfolio state', () => {
  it('does not restore a row deleted during a quote request', () => {
    let state = examplePortfolio();
    const asset = state.assets[0];
    state = portfolioReducer(state, {
      type: 'quote-start',
      id: asset.id,
      symbol: asset.symbol,
      requestId: 'one',
    });
    state = portfolioReducer(state, { type: 'remove', id: asset.id });
    state = portfolioReducer(state, {
      type: 'quote-result',
      id: asset.id,
      symbol: asset.symbol,
      requestId: 'one',
      quote,
    });
    expect(state.assets).toHaveLength(2);
    expect(state.assets.some((a) => a.id === asset.id)).toBe(false);
  });
  it('preserves concurrent edits and additions while updating only quote fields', () => {
    let state = examplePortfolio();
    const original = state;
    const asset = state.assets[0];
    state = portfolioReducer(state, {
      type: 'quote-start',
      id: asset.id,
      symbol: asset.symbol,
      requestId: 'one',
    });
    state = portfolioReducer(state, {
      type: 'edit',
      id: asset.id,
      patch: { currentValue: 987, targetPercentage: 0.4 },
    });
    state = portfolioReducer(state, {
      type: 'add',
      asset: createAsset({ symbol: 'IBM' }),
    });
    state = portfolioReducer(state, {
      type: 'quote-result',
      id: asset.id,
      symbol: asset.symbol,
      requestId: 'one',
      quote,
    });
    expect(state.assets).toHaveLength(4);
    expect(state.assets[0]).toMatchObject({
      currentValue: 987,
      targetPercentage: 0.4,
      currentPrice: 200,
    });
    expect(original.assets[0].currentValue).toBe(600);
  });
  it('ignores superseded, renamed, and manually replaced requests', () => {
    for (const operation of ['rename', 'manual', 'new-request']) {
      let state = examplePortfolio();
      const asset = state.assets[0];
      state = portfolioReducer(state, {
        type: 'quote-start',
        id: asset.id,
        symbol: asset.symbol,
        requestId: 'one',
      });
      state =
        operation === 'rename'
          ? portfolioReducer(state, {
              type: 'edit',
              id: asset.id,
              patch: { symbol: 'IBM' },
            })
          : operation === 'manual'
            ? portfolioReducer(state, {
                type: 'price',
                id: asset.id,
                price: 55,
              })
            : portfolioReducer(state, {
                type: 'quote-start',
                id: asset.id,
                symbol: asset.symbol,
                requestId: 'two',
              });
      const before = state.assets[0];
      state = portfolioReducer(state, {
        type: 'quote-result',
        id: asset.id,
        symbol: asset.symbol,
        requestId: 'one',
        quote,
      });
      expect(state.assets[0]).toEqual(before);
    }
  });
  it('does not revalue dollar holdings but does revalue quantity holdings', () => {
    for (const basis of ['value', 'shares'] as const) {
      const asset = createAsset({
        symbol: 'VOO',
        basis,
        currentValue: 600,
        shares: 6,
        currentPrice: 100,
      });
      let state = { assets: [asset], newMoney: 0, enableSelling: false };
      state = portfolioReducer(state, {
        type: 'quote-start',
        id: asset.id,
        symbol: asset.symbol,
        requestId: 'one',
      });
      state = portfolioReducer(state, {
        type: 'quote-result',
        id: asset.id,
        symbol: asset.symbol,
        requestId: 'one',
        quote,
      });
      expect(getValueCents(state.assets[0])).toBe(
        basis === 'value' ? 60000 : 120000,
      );
    }
  });
});

it('keeps the original basis when conversion cannot preserve a supported value', () => {
  for (const asset of [
    createAsset({ symbol: 'AAA', basis: 'shares', shares: 10 }),
    createAsset({ symbol: 'AAA', currentValue: 1, currentPrice: 1e9 }),
    createAsset({
      symbol: 'AAA',
      basis: 'shares',
      shares: 10_000_001,
      currentPrice: 100,
    }),
  ]) {
    const state = { assets: [asset], newMoney: 0, enableSelling: false };
    const next = portfolioReducer(state, {
      type: 'basis',
      id: asset.id,
      basis: asset.basis === 'value' ? 'shares' : 'value',
    });
    expect(next.assets[0]).toEqual(asset);
  }
});
