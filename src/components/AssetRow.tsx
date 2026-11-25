import { Fragment, useState } from 'react';
import type { Dispatch } from 'react';
import type { Asset } from '../types';
import { convertHolding } from '../utils/portfolio';
import type { Action } from '../utils/portfolio';
import { formatCurrency } from '../utils/formatters';
import { getValueCents, SYMBOL_PATTERN } from '../utils/validation';
import NumberField from './NumberField';

export default function AssetRow({
  asset,
  color,
  selling,
  dispatch,
  remove,
  quote,
  setValidity,
}: {
  asset: Asset;
  color: string;
  selling: boolean;
  dispatch: Dispatch<Action>;
  remove: () => void;
  quote: () => void;
  setValidity: (key: string, valid: boolean) => void;
}) {
  const [details, setDetails] = useState(false);
  const [priceDraftValid, setPriceDraftValid] = useState(true);
  const [symbolDraft, setSymbolDraft] = useState(asset.symbol);
  const [symbolError, setSymbolError] = useState('');
  const [basisError, setBasisError] = useState('');
  const name = asset.symbol || 'Holding';
  const kind =
    asset.kind === 'stock'
      ? 'Stock / ETF'
      : asset.kind === 'crypto'
        ? 'Crypto'
        : 'Other';
  const valid = (field: string) => (ok: boolean) =>
    setValidity(asset.id + ':' + field, ok);
  return (
    <Fragment>
      <tr className="holding-row" data-asset={asset.symbol}>
        <th scope="row" className="asset-cell">
          <div className="asset-heading">
            <span
              className="asset-marker"
              aria-hidden="true"
              style={{ backgroundColor: color }}
            />
            <div className="asset-identity">
              <span className="asset-name">{name}</span>
              <span className="asset-kind">{kind}</span>
              {selling && asset.noSell && (
                <span className="lock-note">No selling</span>
              )}
            </div>
            <button
              className="edit-button"
              aria-label={details ? `Close ${name} details` : `Edit ${name}`}
              disabled={details && (!!symbolError || !priceDraftValid)}
              aria-expanded={details}
              aria-controls={'details-' + asset.id}
              onClick={() => setDetails(!details)}
            >
              {details ? 'Done' : 'Edit'}
            </button>
          </div>
        </th>
        <td className="holding-value">
          {asset.basis === 'shares' && (
            <span className="quantity-label">Quantity</span>
          )}
          <NumberField
            label={
              name + (asset.basis === 'value' ? ' current value' : ' quantity')
            }
            value={asset.basis === 'value' ? asset.currentValue : asset.shares}
            prefix={asset.basis === 'value' ? '$' : undefined}
            decimals={asset.basis === 'value' ? 2 : 8}
            max={asset.basis === 'value' ? 1e9 : 1e12}
            onChange={(value) =>
              dispatch({
                type: 'edit',
                id: asset.id,
                patch:
                  asset.basis === 'value'
                    ? { currentValue: value ?? 0 }
                    : { shares: value ?? 0 },
              })
            }
            onValidityChange={valid('holding')}
          />
          {asset.basis === 'shares' && (
            <span className="cell-note">
              {asset.currentPrice
                ? formatCurrency(getValueCents(asset) / 100)
                : 'Set a price in details'}
            </span>
          )}
        </td>
        <td className="target-cell">
          <NumberField
            label={name + ' target weight'}
            value={asset.targetPercentage * 100}
            max={100}
            suffix="%"
            onChange={(value) =>
              dispatch({
                type: 'edit',
                id: asset.id,
                patch: { targetPercentage: (value ?? 0) / 100 },
              })
            }
            onValidityChange={valid('target')}
          />
        </td>
        <td className="remove-cell">
          <button
            className="icon-button"
            onClick={remove}
            aria-label={'Remove ' + name}
          >
            ×
          </button>
        </td>
      </tr>
      <tr id={'details-' + asset.id} className="details-row" hidden={!details}>
        <td colSpan={4}>
          <div className="asset-details">
            <div>
              <label htmlFor={asset.id + '-symbol'}>Symbol</label>
              <input
                id={asset.id + '-symbol'}
                value={symbolDraft}
                maxLength={30}
                aria-invalid={!!symbolError}
                aria-describedby={
                  symbolError ? asset.id + '-symbol-error' : undefined
                }
                onChange={(event) => {
                  const value = event.target.value.toUpperCase();
                  setSymbolDraft(value);
                  const ok = SYMBOL_PATTERN.test(value.trim());
                  valid('symbol')(ok);
                  setSymbolError(ok ? '' : 'Enter a valid ticker or symbol.');
                  if (ok)
                    dispatch({
                      type: 'edit',
                      id: asset.id,
                      patch: { symbol: value.trim() },
                    });
                }}
              />
              {symbolError && (
                <span id={asset.id + '-symbol-error'} className="field-error">
                  {symbolError}
                </span>
              )}
            </div>
            <div>
              <label htmlFor={asset.id + '-kind'}>Asset type</label>
              <select
                id={asset.id + '-kind'}
                value={asset.kind}
                onChange={(e) =>
                  dispatch({
                    type: 'edit',
                    id: asset.id,
                    patch: { kind: e.target.value as Asset['kind'] },
                  })
                }
              >
                <option value="stock">Stock / ETF</option>
                <option value="crypto">Crypto</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label htmlFor={asset.id + '-basis'}>Holding entered as</label>
              <select
                id={asset.id + '-basis'}
                value={asset.basis}
                aria-describedby={
                  basisError ? asset.id + '-basis-error' : undefined
                }
                onChange={(e) => {
                  const basis = e.target.value as Asset['basis'];
                  const conversion = convertHolding(asset, basis);
                  setBasisError(conversion.error ?? '');
                  if (!conversion.error)
                    dispatch({ type: 'basis', id: asset.id, basis });
                }}
              >
                <option value="value">Dollars (fixed)</option>
                <option
                  value="shares"
                  disabled={!asset.currentPrice && asset.currentValue > 0}
                >
                  Quantity × price
                  {!asset.currentPrice && asset.currentValue > 0
                    ? ' (set price first)'
                    : ''}
                </option>
              </select>
              {basisError && (
                <p
                  className="field-error"
                  id={asset.id + '-basis-error'}
                  role="status"
                >
                  {basisError}
                </p>
              )}
            </div>
            <div>
              <span className="form-label">USD price per unit</span>
              <NumberField
                label={name + ' USD price'}
                value={asset.currentPrice}
                decimals={8}
                min={0.00000001}
                optional
                prefix="$"
                onChange={(price) =>
                  dispatch({
                    type: 'price',
                    id: asset.id,
                    price: price === 0 ? undefined : price,
                  })
                }
                onValidityChange={(ok) => {
                  setPriceDraftValid(ok);
                  valid('price')(ok);
                }}
              />
            </div>
            {asset.kind === 'stock' && (
              <div className="quote-control">
                <button
                  className="button secondary"
                  onClick={quote}
                  disabled={asset.quoteStatus === 'loading' || !!symbolError}
                >
                  {asset.quoteStatus === 'loading'
                    ? 'Fetching…'
                    : asset.priceSource === 'manual'
                      ? 'Replace with quote'
                      : 'Fetch quote'}
                </button>
              </div>
            )}
            {(asset.quoteError || asset.currentPrice) && (
              <div className="quote-note" role="status">
                {asset.quoteError ? (
                  <span className="field-error">{asset.quoteError}</span>
                ) : asset.priceSource === 'manual' ? (
                  'Manual price'
                ) : asset.quoteTime ? (
                  'Quote · ' + new Date(asset.quoteTime).toLocaleString()
                ) : (
                  'Saved price'
                )}
              </div>
            )}
            {selling && (
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={asset.noSell}
                  onChange={(e) =>
                    dispatch({
                      type: 'edit',
                      id: asset.id,
                      patch: { noSell: e.target.checked },
                    })
                  }
                />
                Do not sell {name}
              </label>
            )}
          </div>
        </td>
      </tr>
    </Fragment>
  );
}
