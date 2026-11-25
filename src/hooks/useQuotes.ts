import { useCallback, useEffect, useRef } from 'react';
import type { Dispatch } from 'react';
import type { Asset } from '../types';
import type { Action } from '../utils/portfolio';
import { fetchQuote } from '../services/priceService';

export function useQuotes(assets: Asset[], dispatch: Dispatch<Action>) {
  const active = useRef(
    new Map<
      string,
      { controller: AbortController; symbol: string; requestId: string }
    >(),
  );
  useEffect(() => {
    for (const [id, pending] of active.current) {
      const asset = assets.find((a) => a.id === id);
      if (
        !asset ||
        asset.symbol !== pending.symbol ||
        asset.kind !== 'stock' ||
        asset.requestId !== pending.requestId
      ) {
        pending.controller.abort();
        active.current.delete(id);
      }
    }
  }, [assets]);
  useEffect(
    () => () => {
      for (const { controller } of active.current.values()) controller.abort();
      active.current.clear();
    },
    [],
  );
  return useCallback(
    async (asset: Asset) => {
      if (asset.kind !== 'stock' || !asset.symbol) return;
      active.current.get(asset.id)?.controller.abort();
      const controller = new AbortController();
      const requestId = crypto.randomUUID();
      active.current.set(asset.id, {
        controller,
        symbol: asset.symbol,
        requestId,
      });
      dispatch({
        type: 'quote-start',
        id: asset.id,
        symbol: asset.symbol,
        requestId,
      });
      const timeout = setTimeout(
        () =>
          controller.abort(
            new Error('Quote timed out. Enter a price or try again.'),
          ),
        8000,
      );
      try {
        const quote = await fetchQuote(asset.symbol, controller.signal);
        dispatch({
          type: 'quote-result',
          id: asset.id,
          symbol: asset.symbol,
          requestId,
          quote,
        });
      } catch (error) {
        dispatch({
          type: 'quote-result',
          id: asset.id,
          symbol: asset.symbol,
          requestId,
          error:
            controller.signal.reason instanceof Error
              ? controller.signal.reason.message
              : error instanceof Error
                ? error.message
                : 'Unable to fetch a price.',
        });
      } finally {
        clearTimeout(timeout);
        if (active.current.get(asset.id)?.controller === controller)
          active.current.delete(asset.id);
      }
    },
    [dispatch],
  );
}
