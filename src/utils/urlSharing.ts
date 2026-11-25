import type { Asset, Portfolio } from '../types';
import { createAsset } from './portfolio';
import {
  getValueCents,
  isBounded,
  MAX_ASSETS,
  MAX_VALUE,
  SYMBOL_PATTERN,
  toBasisPoints,
} from './validation';

export const DRAFT_KEY = 'allogator.portfolio.v2';
type RecordValue = Record<string, unknown>;
function record(value: unknown): value is RecordValue {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function fail(): never {
  throw new Error(
    'This portfolio could not be opened. Check the link or start a new portfolio.',
  );
}

export function serializePortfolio(portfolio: Portfolio): string {
  return JSON.stringify({
    version: 2,
    money: portfolio.newMoney,
    selling: portfolio.enableSelling,
    assets: portfolio.assets.map((a) => ({
      symbol: a.symbol,
      kind: a.kind,
      basis: a.basis,
      value: a.currentValue,
      shares: a.shares,
      target: toBasisPoints(a.targetPercentage),
      price: a.currentPrice,
      noSell: a.noSell,
      quoteTime: a.quoteTime,
    })),
  });
}

export function parsePortfolio(
  raw: string,
  mode: 'snapshot' | 'legacy' | 'draft' = 'snapshot',
): Portfolio {
  const legacy = mode === 'legacy';
  if (raw.length > 30_000) fail();
  const data: unknown = JSON.parse(raw);
  if (
    !record(data) ||
    (!legacy && data.version !== 2) ||
    !Array.isArray(data.assets) ||
    data.assets.length > MAX_ASSETS
  )
    fail();
  const money = legacy ? data.m : data.money;
  const selling = legacy ? (data.es ?? false) : data.selling;
  if (
    !isBounded(money) ||
    Math.abs(money * 100 - Math.round(money * 100)) > 0.0001 ||
    typeof selling !== 'boolean'
  )
    fail();
  const assets: Asset[] = data.assets.map((item: unknown) => {
    if (!record(item)) fail();
    const symbol = legacy ? item.s : item.symbol;
    const value = legacy ? item.v : item.value;
    const target =
      legacy && typeof item.t === 'number' ? item.t * 10_000 : item.target;
    const price = legacy ? item.p : item.price;
    const shares = (legacy ? item.sh : item.shares) ?? 0;
    const kind = legacy
      ? typeof symbol === 'string' && symbol.includes(':')
        ? 'crypto'
        : 'stock'
      : item.kind;
    const basis = legacy ? 'value' : item.basis;
    const noSell = (legacy ? item.ns : item.noSell) ?? false;
    if (
      typeof symbol !== 'string' ||
      !SYMBOL_PATTERN.test(symbol) ||
      !isBounded(value) ||
      Math.abs(value * 100 - Math.round(value * 100)) > 0.0001 ||
      !isBounded(target, 10_000) ||
      Math.abs(target - Math.round(target)) > 0.000001 ||
      !isBounded(shares, 1e12) ||
      typeof noSell !== 'boolean' ||
      (kind !== 'stock' && kind !== 'crypto' && kind !== 'other') ||
      (basis !== 'value' && basis !== 'shares') ||
      (price !== undefined && (!isBounded(price) || price <= 0))
    )
      fail();
    if (
      item.quoteTime !== undefined &&
      (typeof item.quoteTime !== 'string' ||
        !Number.isFinite(Date.parse(item.quoteTime)))
    )
      fail();
    const asset = createAsset({
      symbol,
      kind: kind as Asset['kind'],
      basis: basis as Asset['basis'],
      currentValue: value,
      shares,
      targetPercentage: Math.round(target) / 10_000,
      currentPrice: price as number | undefined,
      priceSource: price === undefined ? undefined : 'snapshot',
      quoteTime: item.quoteTime as string | undefined,
      noSell,
    });
    if (mode !== 'draft' && getValueCents(asset) > MAX_VALUE * 100) fail();
    return asset;
  });
  if (
    mode !== 'draft' &&
    new Set(assets.map((a) => a.kind + ':' + a.symbol)).size !== assets.length
  )
    fail();
  return { assets, newMoney: money, enableSelling: selling };
}

export function encodePortfolioToUrl(
  portfolio: Portfolio,
  base = window.location.href,
): string {
  const url = new URL(base);
  url.search = '';
  url.hash =
    'p=' +
    btoa(serializePortfolio(portfolio))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  return url.toString();
}
export function decodePortfolioFromUrl(
  href = window.location.href,
): Portfolio | null {
  const url = new URL(href);
  const fragment = new URLSearchParams(url.hash.slice(1)).get('p');
  const old = url.searchParams.get('p');
  if (fragment === null && old === null) return null;
  try {
    const encoded = fragment ?? old!;
    if (encoded.length > 40_000) fail();
    return parsePortfolio(
      atob(encoded.replace(/-/g, '+').replace(/_/g, '/')),
      fragment === null ? 'legacy' : 'snapshot',
    );
  } catch {
    return fail();
  }
}
