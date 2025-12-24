# Allogator

A portfolio rebalancing calculator with real-time price data integration.

**Live:** [allogator.xyz](https://allogator.xyz)

## Overview

Allogator calculates how to allocate new investments across your portfolio to maintain target percentages. It fetches live prices from Finnhub and runs entirely in the browser with no account required.

## Features

- Real-time stock and cryptocurrency prices via Finnhub API
- Buy-only or sell-enabled rebalancing modes
- Asset locking to prevent selling specific holdings
- Shareable portfolio URLs
- Supports up to 20 assets per portfolio

## Getting Started

### Prerequisites

- Node.js 16+
- Finnhub API key ([free tier available](https://finnhub.io))

### Installation

```bash
git clone https://github.com/lukefr09/allogator.git
cd allogator
npm install
```

Create a `.env` file:

```
VITE_FINNHUB_API_KEY=your_api_key_here
```

### Development

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # Run ESLint
npm run format   # Format with Prettier
```

## How It Works

1. Add assets with their current values and target percentages
2. Enter the amount you want to invest
3. The algorithm calculates optimal allocation:
   - Phase 1: Prioritizes underweight positions
   - Phase 2: Distributes remaining funds proportionally
   - Phase 3: Handles cent-level rounding

When selling mode is enabled, the calculator determines both buy and sell amounts to achieve target allocations. Assets can be locked to prevent selling.

## Project Structure

```
src/
├── components/          # React components
├── hooks/               # Custom React hooks
│   ├── usePortfolio.ts  # Portfolio state and operations
│   └── useGradientAnimation.ts
├── services/
│   └── priceService.ts  # Finnhub API client with caching
├── utils/
│   ├── calculations.ts  # Rebalancing algorithm
│   ├── validation.ts    # Input validation
│   └── urlSharing.ts    # Portfolio URL encoding
├── constants.ts         # Configuration constants
├── types.ts             # TypeScript interfaces
└── App.tsx              # Main application
```

## API Rate Limits

- Finnhub free tier: 60 calls/minute
- Built-in rate limiting: 1.1 seconds between requests
- Price caching: 5 minutes per symbol

## License

MIT
