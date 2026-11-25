import { useEffect, useId, useRef, useState } from 'react';
interface Props {
  label: string;
  value?: number;
  onChange: (value: number | undefined) => void;
  onValidityChange: (valid: boolean) => void;
  decimals?: number;
  max?: number;
  min?: number;
  optional?: boolean;
  prefix?: string;
  suffix?: string;
  className?: string;
}
export default function NumberField({
  label,
  value,
  onChange,
  onValidityChange,
  decimals = 2,
  max = 1e9,
  min = 0,
  optional = false,
  prefix,
  suffix,
  className = '',
}: Props) {
  const id = useId();
  const format = (n?: number) =>
    n === undefined
      ? ''
      : decimals === 0
        ? String(n)
        : n.toFixed(decimals).replace(/\.?0+$/, '');
  const [draft, setDraft] = useState(() => format(value));
  const [error, setError] = useState('');
  const focused = useRef(false);
  const validity = useRef(onValidityChange);
  validity.current = onValidityChange;
  useEffect(() => {
    if (!focused.current) {
      setDraft(format(value));
      setError('');
      validity.current(true);
    }
  }, [value, decimals]);
  useEffect(() => () => validity.current(true), []);
  function update(text: string) {
    setDraft(text);
    let message = '';
    const pattern = new RegExp('^\\d+(?:\\.\\d{0,' + decimals + '})?$');
    if (!text.trim() && !optional) message = 'Enter a number.';
    else if (text && (!pattern.test(text) || !Number.isFinite(Number(text))))
      message = 'Use up to ' + decimals + ' decimal places.';
    else if (text && Number(text) < min) message = 'Enter a positive number.';
    else if (text && Number(text) > max)
      message = 'Maximum: ' + max.toLocaleString('en-US') + '.';
    setError(message);
    onValidityChange(!message);
    if (!message) onChange(text ? Number(text) : undefined);
  }
  return (
    <div className={'number-field ' + className}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className={'input-wrap' + (error ? ' invalid' : '')}>
        {prefix && <span aria-hidden="true">{prefix}</span>}
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={draft}
          aria-invalid={!!error}
          aria-describedby={error ? id + '-error' : undefined}
          onFocus={() => {
            focused.current = true;
          }}
          onChange={(e) => update(e.target.value)}
          onBlur={() => {
            focused.current = false;
            if (!error) setDraft(format(value));
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur();
          }}
        />
        {suffix && <span aria-hidden="true">{suffix}</span>}
      </div>
      {error && (
        <span className="field-error" id={id + '-error'}>
          {error}
        </span>
      )}
    </div>
  );
}
