import { useId, useState } from 'react';
import type { Asset, AssetKind } from '../types';
import { createAsset } from '../utils/portfolio';
import { hasHolding, SYMBOL_PATTERN } from '../utils/validation';
import Dialog from './Dialog';
import NumberField from './NumberField';

export default function AddAsset({
  remaining,
  assets,
  onAdd,
  onClose,
}: {
  remaining: number;
  assets: Asset[];
  onAdd: (asset: Asset) => void;
  onClose: () => void;
}) {
  const id = useId();
  const [symbol, setSymbol] = useState('');
  const [kind, setKind] = useState<AssetKind>('stock');
  const [target, setTarget] = useState(Math.max(0, remaining));
  const [value, setValue] = useState(0);
  const [valueValid, setValueValid] = useState(true);
  const [targetValid, setTargetValid] = useState(true);
  const [error, setError] = useState('');
  return (
    <Dialog title="Add a holding" onClose={onClose}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const normalized = symbol.trim().toUpperCase();
          if (!SYMBOL_PATTERN.test(normalized)) {
            setError('Use 1–30 letters, digits, dots, colons, or hyphens.');
            return;
          }
          if (hasHolding(assets, { symbol: normalized, kind })) {
            setError('This asset is already in your portfolio.');
            return;
          }
          if (!valueValid || !targetValid) return;
          onAdd(
            createAsset({
              symbol: normalized,
              kind,
              currentValue: value,
              targetPercentage: target / 100,
            }),
          );
        }}
      >
        <label className="form-label" htmlFor={id + '-symbol'}>
          Symbol
        </label>
        <input
          data-initial-focus
          id={id + '-symbol'}
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          placeholder="e.g. VOO"
          maxLength={30}
          required
          aria-describedby={error ? id + '-error' : undefined}
          aria-invalid={!!error}
        />
        <label className="form-label" htmlFor={id + '-kind'}>
          Asset type
        </label>
        <select
          id={id + '-kind'}
          value={kind}
          onChange={(e) => setKind(e.target.value as AssetKind)}
        >
          <option value="stock">Stock / ETF</option>
          <option value="crypto">Crypto</option>
          <option value="other">Other</option>
        </select>
        <div className="form-label">Current value</div>
        <NumberField
          label="New holding current value"
          value={value}
          prefix="$"
          onChange={(amount) => setValue(amount ?? 0)}
          onValidityChange={setValueValid}
        />
        <div className="form-label">Target weight</div>
        <NumberField
          label="New holding target"
          value={target}
          max={100}
          suffix="%"
          onChange={(v) => setTarget(v ?? 0)}
          onValidityChange={setTargetValid}
        />
        {error && (
          <p className="field-error" id={id + '-error'} role="alert">
            {error}
          </p>
        )}
        <div className="dialog-actions">
          <button type="button" className="button secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="button primary"
            disabled={!symbol.trim() || !valueValid || !targetValid}
          >
            Add holding
          </button>
        </div>
      </form>
    </Dialog>
  );
}
