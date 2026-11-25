import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import type { Asset, Portfolio } from './types';
import { examplePortfolio, portfolioReducer } from './utils/portfolio';
import { calculateAllocations } from './utils/calculations';
import {
  calculateTotalPercentage,
  getValueCents,
  hasHolding,
  MAX_ASSETS,
  toBasisPoints,
  validatePortfolio,
} from './utils/validation';
import { formatCurrency } from './utils/formatters';
import {
  decodePortfolioFromUrl,
  DRAFT_KEY,
  encodePortfolioToUrl,
  parsePortfolio,
  serializePortfolio,
} from './utils/urlSharing';
import { useQuotes } from './hooks/useQuotes';
import AssetRow from './components/AssetRow';
import AddAsset from './components/AddAsset';
import Dialog from './components/Dialog';
import NumberField from './components/NumberField';
import { AllocationMix, TradePlan } from './components/Plan';

const emptyPortfolio: Portfolio = {
  assets: [],
  newMoney: 0,
  enableSelling: false,
};
const holdingColors = [
  '#406953',
  '#b2873e',
  '#7896a1',
  '#b27d4c',
  '#aa84ab',
  '#498a89',
  '#d3aa53',
  '#776eab',
  '#b96f71',
  '#80a880',
  '#526f92',
  '#bb9776',
  '#789364',
  '#776051',
  '#567d77',
  '#bc8fbe',
  '#ac9947',
  '#c68558',
  '#7486ac',
  '#a68187',
];
type PortfolioSource = 'example' | 'own' | 'saved' | 'shared';
type Undo =
  | { type: 'remove'; asset: Asset; index: number }
  | { type: 'reset'; portfolio: Portfolio; source: PortfolioSource };

function initialize(): {
  portfolio: Portfolio;
  source: PortfolioSource;
  notice: string;
} {
  try {
    const shared = decodePortfolioFromUrl();
    if (shared)
      return {
        portfolio: shared,
        source: 'shared',
        notice: '',
      };
  } catch (error) {
    return {
      portfolio: emptyPortfolio,
      source: 'own',
      notice:
        error instanceof Error
          ? error.message
          : 'Unable to open this portfolio.',
    };
  }
  try {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft)
      return {
        portfolio: parsePortfolio(draft, 'draft'),
        source: 'saved',
        notice: '',
      };
  } catch {
    return {
      portfolio: emptyPortfolio,
      source: 'own',
      notice:
        'Your saved portfolio could not be read. It has not been overwritten.',
    };
  }
  return {
    portfolio: examplePortfolio(),
    source: 'example',
    notice: '',
  };
}
function withoutQuoteRequest(asset: Asset): Asset {
  return {
    ...asset,
    requestId: undefined,
    quoteStatus: undefined,
    quoteError: undefined,
  };
}

export default function App() {
  const [initial] = useState(initialize);
  const [portfolio, dispatch] = useReducer(portfolioReducer, initial.portfolio);
  const [saveDraft, setSaveDraft] = useState(initial.source === 'saved');
  const [source, setSource] = useState(initial.source);
  const [notice, setNotice] = useState(initial.notice);
  const [invalid, setInvalid] = useState<Record<string, boolean>>({});
  const [undo, setUndo] = useState<Undo | null>(null);
  const [inputEpoch, setInputEpoch] = useState(0);
  const [dialog, setDialog] = useState<'add' | 'share' | null>(null);
  const [shareUrl, setShareUrl] = useState('');
  const [copyStatus, setCopyStatus] = useState('');
  const workspaceRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const fetchPrice = useQuotes(portfolio.assets, dispatch);
  const setValidity = useCallback((key: string, valid: boolean) => {
    setInvalid((old) => {
      if (!!old[key] === !valid) return old;
      const next = { ...old };
      if (valid) delete next[key];
      else next[key] = true;
      return next;
    });
  }, []);
  const currentIds = new Set(portfolio.assets.map((a) => a.id));
  const hasDraftError = Object.keys(invalid).some(
    (key) => key === 'contribution' || currentIds.has(key.split(':')[0]),
  );
  const validation = validatePortfolio(portfolio);
  const currentCents = portfolio.assets.reduce(
    (sum, asset) => sum + getValueCents(asset),
    0,
  );
  const newCents = currentCents + Math.round(portfolio.newMoney * 100);
  const results =
    validation.isValid && !hasDraftError && newCents > 0
      ? calculateAllocations(
          portfolio.assets,
          portfolio.newMoney,
          portfolio.enableSelling,
        )
      : [];
  const targets = calculateTotalPercentage(portfolio.assets);
  const resultById = new Map(results.map((result) => [result.id, result]));
  const positions = portfolio.assets.map((asset, index) => ({
    asset,
    color: holdingColors[index],
    currentWeight:
      currentCents > 0 ? (getValueCents(asset) / currentCents) * 100 : 0,
    result: resultById.get(asset.id),
  }));
  const hasPlan = results.length > 0;
  const onTarget =
    hasPlan && results.every((result) => Math.abs(result.difference) < 0.005);
  const hasHoldings = positions.length > 0;
  const holdingsValued =
    !hasDraftError &&
    portfolio.assets.every(
      ({ basis, shares, currentPrice }) =>
        basis === 'value' || shares === 0 || currentPrice !== undefined,
    );
  const sellingLimitsPlan =
    hasPlan &&
    !onTarget &&
    portfolio.assets.some(
      (asset) =>
        (!portfolio.enableSelling || asset.noSell) &&
        getValueCents(asset) * 10_000 >
          newCents * toBasisPoints(asset.targetPercentage),
    );

  useEffect(() => {
    if (
      new URLSearchParams(location.search).has('p') &&
      initial.source === 'shared'
    ) {
      history.replaceState(null, '', encodePortfolioToUrl(initial.portfolio));
    }
  }, [initial]);
  useEffect(() => {
    const openHashSnapshot = () => {
      if (!new URLSearchParams(location.hash.slice(1)).has('p')) return;
      setDialog(null);
      setSaveDraft(false);
      setUndo(null);
      setInvalid({});
      setInputEpoch((value) => value + 1);
      try {
        const shared = decodePortfolioFromUrl();
        if (shared) {
          dispatch({ type: 'replace', portfolio: shared });
          setSource('shared');
          setNotice('');
        }
      } catch (error) {
        dispatch({
          type: 'replace',
          portfolio: emptyPortfolio,
        });
        setSource('own');
        setNotice(
          error instanceof Error
            ? error.message
            : 'Unable to open this portfolio.',
        );
      }
    };
    window.addEventListener('hashchange', openHashSnapshot);
    return () => window.removeEventListener('hashchange', openHashSnapshot);
  }, []);
  useEffect(() => {
    if (!saveDraft || hasDraftError) return;
    try {
      localStorage.setItem(DRAFT_KEY, serializePortfolio(portfolio));
    } catch {
      setNotice(
        'Saving is unavailable in this browser. Copy a share link to keep your portfolio.',
      );
      setSaveDraft(false);
    }
  }, [portfolio, saveDraft, hasDraftError]);

  const undoError =
    undo?.type === 'remove'
      ? positions.length >= MAX_ASSETS
        ? 'Restoring this holding would exceed the limit.'
        : hasHolding(portfolio.assets, undo.asset)
          ? 'A holding with this symbol and type already exists.'
          : ''
      : '';

  function replace(next: Portfolio, nextSource: PortfolioSource) {
    setUndo({
      type: 'reset',
      portfolio: {
        ...portfolio,
        assets: portfolio.assets.map(withoutQuoteRequest),
      },
      source,
    });
    dispatch({ type: 'replace', portfolio: next });
    setSource(nextSource);
    setInvalid({});
    setInputEpoch((x) => x + 1);
    setNotice('');
    history.replaceState(null, '', location.pathname);
  }
  function restorePrevious() {
    if (!undo || undoError) return;
    if (undo.type === 'remove') {
      dispatch({ type: 'add', asset: undo.asset, index: undo.index });
    } else {
      dispatch({ type: 'replace', portfolio: undo.portfolio });
      setSource(undo.source);
      setInvalid({});
      setInputEpoch((value) => value + 1);
    }
    setUndo(null);
  }

  function openShare() {
    setShareUrl(encodePortfolioToUrl(portfolio));
    setCopyStatus('');
    setDialog('share');
  }
  return (
    <div className="site-shell">
      <a
        className="skip-link"
        href="#calculator"
        onClick={(event) => {
          event.preventDefault();
          workspaceRef.current?.focus();
        }}
      >
        Skip to calculator
      </a>
      <header className="site-header">
        <div className="header-inner">
          <div className="site-brand">
            <img src="/allogator.svg" width="36" height="36" alt="" />
            <span>Allogator</span>
          </div>
          <nav className="header-actions" aria-label="Portfolio actions">
            <a
              href="https://github.com/lukefr09/allogator"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
            <button
              className="button secondary"
              onClick={openShare}
              disabled={!validation.isValid || hasDraftError}
            >
              Share portfolio
            </button>
          </nav>
        </div>
      </header>
      <main className="app-shell">
        {notice && (
          <div className="notice" role="status">
            <span>{notice}</span>
            <button className="text-button" onClick={() => setNotice('')}>
              Dismiss
            </button>
          </div>
        )}
        <div className="intro">
          <h1>Portfolio rebalancer</h1>
          <div className="scenario">
            {source === 'shared' && (
              <span className="scenario-label">Shared portfolio</span>
            )}
            {(hasHoldings ||
              portfolio.newMoney > 0 ||
              portfolio.enableSelling) && (
              <button
                className="text-button"
                onClick={() => replace(emptyPortfolio, 'own')}
              >
                {source === 'example' ? 'Start from scratch' : 'Start over'}
              </button>
            )}
          </div>
        </div>
        <div
          id="calculator"
          className="workspace"
          tabIndex={-1}
          ref={workspaceRef}
        >
          <div className="workspace-inputs">
            <section
              className="contribution-settings"
              aria-labelledby="contribution-title"
            >
              <div className="contribution-money">
                <h2 id="contribution-title">Contribution</h2>
                <NumberField
                  key={inputEpoch}
                  label="New contribution"
                  value={portfolio.newMoney}
                  prefix="$"
                  onChange={(value) =>
                    dispatch({ type: 'contribution', value: value ?? 0 })
                  }
                  onValidityChange={(valid) =>
                    setValidity('contribution', valid)
                  }
                />
              </div>
              <div className="selling-control">
                <label>
                  <input
                    type="checkbox"
                    checked={portfolio.enableSelling}
                    aria-describedby="selling-help"
                    onChange={(event) =>
                      dispatch({ type: 'selling', value: event.target.checked })
                    }
                  />
                  Allow selling
                </label>
                <small id="selling-help">
                  {portfolio.enableSelling
                    ? 'Enter $0 to rebalance existing holdings.'
                    : 'Use new cash only.'}
                </small>
              </div>
            </section>
            <section aria-labelledby="holdings-title">
              <div className="holdings-heading">
                <div>
                  <h2 id="holdings-title">Holdings</h2>
                  {hasHoldings && (
                    <a
                      className="plan-jump"
                      href="#trade-plan"
                      onClick={(event) => {
                        event.preventDefault();
                        resultsRef.current?.focus({ preventScroll: true });
                        resultsRef.current?.scrollIntoView();
                      }}
                    >
                      View trade plan <span aria-hidden="true">↓</span>
                    </a>
                  )}
                </div>
                <button
                  className="button primary add-button"
                  onClick={() => setDialog('add')}
                  disabled={positions.length >= MAX_ASSETS}
                >
                  <span aria-hidden="true">+</span> Add holding
                </button>
              </div>
              {hasHoldings ? (
                <table className="holdings-table">
                  <caption className="sr-only">
                    Current holdings and desired weights
                  </caption>
                  <colgroup>
                    <col />
                    <col className="value-column" />
                    <col className="target-column" />
                    <col className="remove-column" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th scope="col">Asset</th>
                      <th scope="col">Current value</th>
                      <th scope="col">Target weight</th>
                      <th scope="col">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.map(({ asset, color }, index) => (
                      <AssetRow
                        key={inputEpoch + ':' + asset.id}
                        asset={asset}
                        color={color}
                        selling={portfolio.enableSelling}
                        dispatch={dispatch}
                        setValidity={setValidity}
                        quote={() => {
                          void fetchPrice(asset);
                        }}
                        remove={() => {
                          setUndo({
                            type: 'remove',
                            asset: withoutQuoteRequest(asset),
                            index,
                          });
                          dispatch({ type: 'remove', id: asset.id });
                        }}
                      />
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="totals-row">
                      <th scope="row">Total</th>
                      <td className="total-current">
                        <strong>
                          {holdingsValued
                            ? formatCurrency(currentCents / 100)
                            : '—'}
                        </strong>
                      </td>
                      <td className="total-target">
                        <span
                          className={
                            targets === 100
                              ? 'target-total complete'
                              : 'target-total'
                          }
                        >
                          {targets.toFixed(2)}%
                        </span>
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              ) : (
                <div className="empty-holdings">
                  <h3>Add your first holding</h3>
                  <p>
                    Use the dollar value shown in your brokerage. You can enter
                    shares and a price in the holding’s details.
                  </p>
                </div>
              )}
              {(hasDraftError || (!validation.isValid && hasHoldings)) && (
                <div className="validation-message" role="status">
                  {hasDraftError ? (
                    <p>Check the highlighted fields.</p>
                  ) : (
                    <ul>
                      {validation.errors.map((error) => (
                        <li key={error}>{error}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              {(positions.length >= MAX_ASSETS || undo) && (
                <div className="holdings-status">
                  {positions.length >= MAX_ASSETS && (
                    <span>20-holding limit reached</span>
                  )}
                  {undo && (
                    <button
                      className="text-button"
                      disabled={!!undoError}
                      onClick={restorePrevious}
                    >
                      {undo.type === 'remove' ? 'Undo removal' : 'Undo reset'}
                    </button>
                  )}
                  {undoError && <span>{undoError}</span>}
                </div>
              )}
            </section>
          </div>
          <div
            id="trade-plan"
            className="workspace-results"
            tabIndex={-1}
            ref={resultsRef}
          >
            <TradePlan
              positions={positions}
              hasPlan={hasPlan}
              onTarget={onTarget}
              sellingLimitsPlan={sellingLimitsPlan}
              projectedValue={newCents / 100}
              needsValue={
                validation.isValid && !hasDraftError && newCents === 0
              }
            />
            {hasHoldings && (
              <AllocationMix
                positions={positions}
                showCurrent={holdingsValued && currentCents > 0}
                showAfter={hasPlan}
              />
            )}
          </div>
        </div>
        <footer className="workspace-footer">
          <label className="check-label">
            <input
              type="checkbox"
              checked={saveDraft}
              onChange={(event) => {
                try {
                  if (event.target.checked)
                    localStorage.setItem(
                      DRAFT_KEY,
                      serializePortfolio(portfolio),
                    );
                  else localStorage.removeItem(DRAFT_KEY);
                  setSaveDraft(event.target.checked);
                } catch {
                  setNotice(
                    'Local storage is unavailable. You can keep your portfolio with a share link.',
                  );
                }
              }}
            />
            Save on this device
          </label>
          {source !== 'example' && (
            <button
              className="text-button"
              onClick={() => replace(examplePortfolio(), 'example')}
            >
              Load example
            </button>
          )}
        </footer>
      </main>
      {dialog === 'add' && (
        <AddAsset
          assets={portfolio.assets}
          remaining={Math.round((100 - targets) * 100) / 100}
          onClose={() => setDialog(null)}
          onAdd={(asset) => {
            dispatch({ type: 'add', asset });
            setDialog(null);
          }}
        />
      )}
      {dialog === 'share' && (
        <Dialog title="Share portfolio" onClose={() => setDialog(null)}>
          <p>
            Includes your holdings and amounts. Anyone with the link can read
            them.
          </p>
          <label className="form-label" htmlFor="share-url">
            Portfolio link
          </label>
          <textarea
            id="share-url"
            readOnly
            value={shareUrl}
            onFocus={(e) => e.target.select()}
            rows={3}
          />
          <div className="dialog-actions">
            <button
              className="button secondary"
              onClick={() => setDialog(null)}
            >
              Done
            </button>
            <button
              className="button primary"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(shareUrl);
                  setCopyStatus('Link copied.');
                } catch {
                  setCopyStatus('Select the link above and copy it manually.');
                }
              }}
            >
              Copy link
            </button>
          </div>
          <p role="status" className="copy-status">
            {copyStatus}
          </p>
        </Dialog>
      )}
    </div>
  );
}
