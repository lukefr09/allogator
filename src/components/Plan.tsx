import type { AllocationResult, Asset } from '../types';
import {
  formatCurrency,
  formatPercentage,
  formatShares,
} from '../utils/formatters';

interface Position {
  asset: Asset;
  color: string;
  currentWeight: number;
  result?: AllocationResult;
}

export function TradePlan({
  positions,
  hasPlan,
  onTarget,
  sellingLimitsPlan,
  projectedValue,
  needsValue,
}: {
  positions: Position[];
  hasPlan: boolean;
  onTarget: boolean;
  sellingLimitsPlan: boolean;
  projectedValue: number;
  needsValue: boolean;
}) {
  const totals = positions.reduce(
    (totals, { result }) => {
      const cents = Math.round((result?.amountToAdd ?? 0) * 100);
      totals.buy += Math.max(0, cents);
      totals.sell += Math.max(0, -cents);
      return totals;
    },
    { buy: 0, sell: 0 },
  );

  return (
    <section className="trade-plan" aria-labelledby="plan-title">
      <div className="plan-heading">
        <h2 id="plan-title">Trade plan</h2>
        {hasPlan && <span className="plan-currency">USD</span>}
      </div>
      {hasPlan ? (
        <>
          <ul className="plan-trades">
            {positions.map(({ asset, result }) => {
              if (!result) return null;
              const amount = result.amountToAdd;
              const action = amount > 0 ? 'Buy' : amount < 0 ? 'Sell' : 'Hold';
              return (
                <li key={asset.id}>
                  <div className="trade-entry" data-trade={asset.symbol}>
                    <strong>{asset.symbol}</strong>
                    <div>
                      <span className={'trade ' + action.toLowerCase()}>
                        {amount === 0
                          ? 'No trade'
                          : action + ' ' + formatCurrency(Math.abs(amount))}
                      </span>
                      {asset.currentPrice && amount !== 0 ? (
                        <small className="trade-units">
                          ≈{' '}
                          {formatShares(Math.abs(amount) / asset.currentPrice)}{' '}
                          {asset.kind === 'stock' ? 'shares' : 'units'}
                        </small>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          <dl className="plan-totals">
            <div>
              <dt>Total to buy</dt>
              <dd>{formatCurrency(totals.buy / 100)}</dd>
            </div>
            {totals.sell > 0 && (
              <div>
                <dt>Total to sell</dt>
                <dd>{formatCurrency(totals.sell / 100)}</dd>
              </div>
            )}
          </dl>
          <div className="plan-value">
            <p>Portfolio after trades</p>
            <strong>{formatCurrency(projectedValue)}</strong>
            {onTarget ? (
              <p className="plan-status">On target</p>
            ) : (
              <p className="plan-constraint" role="status">
                {sellingLimitsPlan
                  ? 'Targets limited by selling settings.'
                  : 'Trades use whole cents, which can affect final weights.'}
              </p>
            )}
          </div>
        </>
      ) : (
        <p className="plan-empty">
          {needsValue
            ? 'Enter a holding value or contribution above $0.'
            : positions.length
              ? 'Check your holdings and targets to see trades.'
              : 'Your trades will appear here when you add holdings and set target weights.'}
        </p>
      )}
    </section>
  );
}

export function AllocationMix({
  positions,
  showCurrent,
  showAfter,
}: {
  positions: Position[];
  showCurrent: boolean;
  showAfter: boolean;
}) {
  return (
    <section className="allocation-mix" aria-labelledby="mix-title">
      <h2 id="mix-title">Allocation mix</h2>
      <table className="mix-table">
        <thead>
          <tr>
            <th scope="col">Asset</th>
            <th scope="col">Now</th>
            <th scope="col">After</th>
          </tr>
        </thead>
        <tbody>
          {(showCurrent || showAfter) && (
            <tr className="mix-visual" aria-hidden="true">
              <td />
              <td>
                <div className="mix-bar">
                  {showCurrent &&
                    positions.map(({ asset, color, currentWeight }) => (
                      <span
                        key={asset.id}
                        style={{
                          backgroundColor: color,
                          width: currentWeight + '%',
                        }}
                      />
                    ))}
                </div>
              </td>
              <td>
                <div className="mix-bar">
                  {showAfter &&
                    positions.map(({ asset, color, result }) => (
                      <span
                        key={asset.id}
                        style={{
                          backgroundColor: color,
                          width: (result?.newPercentage ?? 0) + '%',
                        }}
                      />
                    ))}
                </div>
              </td>
            </tr>
          )}
          {positions.map(({ asset, color, currentWeight, result }) => (
            <tr key={asset.id}>
              <th scope="row">
                <span className="allocation-key">
                  <span
                    className="allocation-dot"
                    aria-hidden="true"
                    style={{ backgroundColor: color }}
                  />
                  <span>{asset.symbol}</span>
                </span>
              </th>
              <td>{showCurrent ? formatPercentage(currentWeight) : '—'}</td>
              <td>{result ? formatPercentage(result.newPercentage) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
