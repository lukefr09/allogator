# Allogator

Portfolio rebalancing calculator. Runs in the browser, no account needed.

**Live:** [allogator.xyz](https://allogator.xyz)

## What it does

You have a portfolio with target allocations (e.g., 60% VTI, 30% VXUS, 10% BND). You want to add $1,000. Allogator tells you exactly how much to put into each position to get as close to your targets as possible.

## Features

**Price fetching** — Enter a ticker symbol and prices are pulled automatically via Finnhub. Supports stocks and crypto. For unsupported tickers, click the pencil icon to enter a price manually.

**Two input modes** — Enter holdings as dollar values or share counts. Toggle between them with the $/# switch.

**Buy-only mode** — Default mode. Only tells you what to buy with new money. Never suggests selling.

**Sell-enabled mode** — Toggle "Allow selling" to rebalance by both buying and selling. The calculator determines the optimal trades to hit your targets exactly.

**Asset locking** — In sell mode, lock specific assets to prevent them from being sold. Useful for tax lots you don't want to touch.

**Shareable URLs** — Copy a link that preserves your portfolio setup. Useful for sharing or bookmarking.

**Local only** — Everything runs in your browser. Nothing is sent to a server except price lookups.

## Running locally

Requires Node.js 16+ and a [Finnhub API key](https://finnhub.io) (free tier works).

```bash
git clone https://github.com/lukefr09/allogator.git
cd allogator
npm install
```

Create `.env`:
```
VITE_FINNHUB_API_KEY=your_key
```

```bash
npm run dev      # dev server
npm run build    # production build
```

## How the algorithm works

1. Calculates current vs target allocation for each asset
2. Prioritizes underweight positions first
3. Distributes remaining funds proportionally to targets
4. Rounds to the cent

In sell mode, it calculates the net difference needed for each position and outputs both buy and sell amounts.

## Limits

- 20 assets max per portfolio
- Finnhub free tier: 60 API calls/minute
- Prices cached for 5 minutes

## License

MIT
