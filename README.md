# Allogator

A browser-based portfolio rebalancing calculator. Enter holdings, a contribution, and target weights to get a buy or sell plan in USD.

## Who it’s for

Allogator is for self-directed investors who already have a target allocation and want to decide what to buy with their next deposit. Enter each holding’s dollar value and target weight, then review the trade amounts and compare your current allocation with the projected mix. New contributions are buy-only by default. Enable selling to rebalance with existing holdings, including with a $0 contribution.

The calculator opens with an editable example. Choose **Start from scratch** to enter your own holdings.

## What it does

- Dollar-based or quantity-based holdings, with optional prices.
- Buy-only allocation, or selling with per-holding locks.
- Trades reconciled to the cent, including a $0-contribution rebalance.
- Manual prices for any asset; optional Finnhub quotes for US stocks and ETFs.
- Versioned share links and opt-in local saving. No accounts or analytics.

Dollar holdings stay fixed when prices change. Quantity-based holdings are valued as quantity × price. Crypto and other assets require a manual USD price.

## Run locally

Use Node 24 (see `.nvmrc`).

```sh
npm ci
npm run dev
```

The calculator works without credentials. To enable stock/ETF quotes, copy `.env.example` to `.env` and set `FINNHUB_API_KEYS` to your Finnhub key, or a comma-separated list of keys. Restart the dev server. The Vite server implements the same quote service as the production API.

Keep keys server-side. Do not use a `VITE_` prefix.

```sh
npm run check       # Typecheck app, server, and tests; run unit tests; build
npx playwright install chromium
npm run test:e2e    # Desktop/mobile flows, races, and accessibility checks
npm run preview    # Preview the static build; quotes require the deployed API
```

## Calculation contract

1. Targets use integer basis points: 0.01% increments summing to exactly 100%.
2. Holding values and contributions are converted to integer cents.
3. The algorithm minimizes the sum of squared percentage-point deviations from targets. Buy-only holdings and locked holdings cannot decrease; other holdings cannot become negative.
4. Final positions are rounded to cents using largest remainders. Ties are resolved by asset type and symbol, independently of row order.
5. Trades equal final minus current values. Net trades equal the contribution exactly. All displayed percentages come from final rounded positions.

Example: holdings of $1,800 VOO, $900 QQQ, and $300 NVDA; targets 50%/30%/20%; contribution $1,000. The plan buys $200/$300/$500, giving $2,000/$1,200/$800.

When constraints prevent the target allocation, the result says so. A target of 0% is valid in either mode.

## Prices and constraints

Quote requests are explicit; opening the app or a shared portfolio does not fetch prices. Successful server quotes are cached for up to 60 seconds; the UI shows market quote time. Manual and imported prices remain fixed until changed. Requests have timeouts, per-instance request limits, bounded caches, and same-symbol request deduplication. The per-instance limit is not a global provider quota: configure hosting-level limits for a public deployment with significant traffic.

Prices must be in USD. Automatic quotes support US stocks and ETFs; unsupported instruments can use manual pricing. Trade quantities assume fractional units and are estimates, not executable broker orders. Fees, taxes, minimum orders, exchange rates, and market movement are excluded.

## Sharing and storage

New links put a versioned portfolio snapshot in the URL fragment (`#p=...`), which is not included in the HTTP request to the host. This is encoding, not encryption: anyone with the link can read holdings, amounts, targets, and prices. Existing `?p=...` links can be imported and are converted in the address bar after loading. Legacy links may already have reached server logs before that conversion.

Shared data is validated atomically. Invalid links show an error instead of silently dropping holdings. Imported prices do not auto-refresh.

“Save on this device” writes the last valid field entries to local storage. Unchecking it erases the saved copy. Shared links take precedence over a saved draft without overwriting it unless saving is explicitly enabled.

## Deployment

Build command: `npm run build`. Static output: `dist/`.

On Vercel, the `api/quote.ts` function provides automatic quotes. Set `FINNHUB_API_KEYS` in the server environment. The API and local development adapter share `server/quote.ts`. No deployment or environment changes are required for manual-price use.

The application needs modern browsers supporting native HTML dialogs and AbortController. Automated browser checks cover Chromium at desktop and mobile widths; run a Safari/VoiceOver pass before claiming broader accessibility conformance.

## Project layout

- `src/utils/calculations.ts`: constrained allocation and cent reconciliation.
- `src/utils/portfolio.ts`: immutable state transitions and request identity checks.
- `src/utils/urlSharing.ts`: versioned snapshots and legacy import.
- `src/hooks/useQuotes.ts`: bounded client requests and cancellation.
- `src/components/`: labeled inputs, holding rows, and native dialogs.
- `server/quote.ts`: validated quote adapter and bounded per-instance state.
- `tests/`: financial invariants, import/state regression tests, and browser flows.

[MIT license](LICENSE.md).
