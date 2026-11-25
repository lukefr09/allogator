import { describe, expect, it } from 'vitest';
import {
  decodePortfolioFromUrl,
  encodePortfolioToUrl,
  parsePortfolio,
  serializePortfolio,
} from '../src/utils/urlSharing';
import { examplePortfolio } from '../src/utils/portfolio';
describe('portfolio snapshots', () => {
  it('round-trips a versioned fragment without query parameters or pending request state', () => {
    const state = examplePortfolio();
    state.assets[0].requestId = 'private-pending-id';
    state.assets[0].currentPrice = 100;
    state.assets[0].basis = 'shares';
    state.assets[0].shares = 6;
    state.enableSelling = true;
    const url = encodePortfolioToUrl(state, 'https://example.test/?old=1');
    expect(new URL(url).search).toBe('');
    expect(new URL(url).hash).toMatch(/^#p=/);
    const actual = decodePortfolioFromUrl(url)!;
    expect(actual.newMoney).toBe(state.newMoney);
    expect(actual.enableSelling).toBe(true);
    expect(actual.assets[0]).toMatchObject({
      symbol: 'VOO',
      currentPrice: 100,
      shares: 6,
      basis: 'shares',
      priceSource: 'snapshot',
    });
    expect(actual.assets[0].requestId).toBeUndefined();
  });
  it('accepts legacy links as fixed dollar snapshots', () => {
    const old = {
      assets: [
        { s: 'VOO', v: 600, t: 0.5, sh: 6, p: 100 },
        { s: 'QQQ', v: 200, t: 0.5 },
      ],
      m: 0,
      es: true,
    };
    const result = decodePortfolioFromUrl(
      'https://example.test/?p=' +
        encodeURIComponent(btoa(JSON.stringify(old))),
    )!;
    expect(result.newMoney).toBe(0);
    expect(result.enableSelling).toBe(true);
    expect(result.assets[0].basis).toBe('value');
  });
  it('rejects invalid imports atomically instead of dropping holdings', () => {
    const raw = JSON.parse(serializePortfolio(examplePortfolio()));
    raw.assets[1].symbol = '';
    expect(() => parsePortfolio(JSON.stringify(raw))).toThrow();
    expect(() =>
      decodePortfolioFromUrl('https://example.test/#p=invalid'),
    ).toThrow();
    raw.assets[1].symbol = 'VOO';
    expect(() => parsePortfolio(JSON.stringify(raw))).toThrow();
  });
  it('keeps an over-limit quantity valuation editable in a local draft', () => {
    const state = examplePortfolio();
    Object.assign(state.assets[0], {
      basis: 'shares',
      shares: 10_000_001,
      currentPrice: 100,
    });
    const raw = serializePortfolio(state);
    expect(() => parsePortfolio(raw)).toThrow();
    expect(parsePortfolio(raw, 'draft').assets[0].shares).toBe(10_000_001);
  });
  it('opens snapshots that are at the valuation limit after cent rounding', () => {
    const state = examplePortfolio();
    Object.assign(state.assets[0], {
      basis: 'shares',
      shares: 10_000_000.00004,
      currentPrice: 100,
    });
    const url = encodePortfolioToUrl(state, 'https://example.test/');
    expect(decodePortfolioFromUrl(url)?.assets[0].shares).toBe(
      10_000_000.00004,
    );
  });
  it('keeps editable incomplete target totals and empty portfolios in drafts', () => {
    const state = examplePortfolio();
    state.assets[0].targetPercentage = 0.4;
    expect(
      parsePortfolio(serializePortfolio(state)).assets[0].targetPercentage,
    ).toBe(0.4);
    state.assets = [];
    expect(parsePortfolio(serializePortfolio(state)).assets).toEqual([]);
  });
});

it('requires scalar asset types and holding bases', () => {
  const data = JSON.parse(serializePortfolio(examplePortfolio()));
  data.assets[0].kind = ['stock'];
  expect(() => parsePortfolio(JSON.stringify(data))).toThrow();
  data.assets[0].kind = 'stock';
  data.assets[0].basis = ['value'];
  expect(() => parsePortfolio(JSON.stringify(data))).toThrow();
});
