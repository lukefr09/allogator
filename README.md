# Allogator 🐊

<p align="center">
  <a href="https://allogator.xyz">Live Demo</a> •
  <a href="#features">Features</a> •
  <a href="#getting-started">Get Started</a> •
  <a href="https://github.com/lukefr09">Built by Luke</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-blue" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue" />
  <img src="https://img.shields.io/badge/License-MIT-green" />
</p>

![Allogator Screenshot](./screenshot.png)

**Optimize your investment allocations with precision**

A modern, real-time portfolio rebalancing calculator that helps you make informed investment decisions. Built with React and TypeScript, featuring live price data integration and smart allocation algorithms.

## 🤔 Why Allogator?

Manually calculating how to rebalance your portfolio is tedious and error-prone. Existing tools are either too complex, require account connections, or cost money. Allogator solves this by providing:

- **No Sign-up Required**: Just open and start using
- **Privacy First**: All calculations happen in your browser
- **Real-time Prices**: Live market data for informed decisions
- **Precise Allocations**: Down to the cent accuracy
- **Free Forever**: Open source and self-hostable

## 💡 Example Use Case

You have a portfolio worth $3,000:
- VOO: $1,800 (60%) - Target: 50%
- QQQ: $900 (30%) - Target: 30%  
- NVDA: $300 (10%) - Target: 20%

With $1,000 to invest, Allogator calculates:
- VOO: $0 (already overweight)
- QQQ: $400 (to maintain 30%)
- NVDA: $600 (to reach 20%)

Perfect allocation every time! 🎯

## ✨ Features

### 🎯 Smart Portfolio Management
- **Real-time Price Updates**: Automatic fetching of current stock and cryptocurrency prices via Finnhub API
- **Dual View Modes**: Switch between dollar amounts and share quantities
- **Target Allocation Tracking**: Set and monitor your desired portfolio percentages
- **Intelligent Rebalancing**: Calculates optimal investment amounts to maintain target allocations

### 📊 Advanced Analytics
- **Allocation Deviation Indicators**: Visual cues showing how far your portfolio is from target
- **After-Investment Preview**: See your portfolio composition after new investments
- **Precision Calculations**: Handles rounding and cent-level accuracy
- **Portfolio Validation**: Real-time error checking and warnings

### 🚀 User Experience
- **Glass Morphism UI**: Modern, responsive design with elegant glass effects
- **Animated Numbers**: Smooth transitions for all numerical displays
- **Tooltip Guidance**: Contextual help throughout the interface
- **URL Sharing**: Share portfolio configurations via generated links
- **Asset Type Disambiguation**: Smart handling of ambiguous symbols (e.g., distinguishing between stock and crypto)

### 💰 Multi-Asset Support
- **Stocks & ETFs**: Support for major stock symbols (VOO, QQQ, NVDA, etc.)
- **Cryptocurrencies**: Integrated support with crypto alias handling
- **Mixed Portfolios**: Seamlessly manage both traditional and crypto assets
- **Up to 20 Assets**: Build comprehensive, diversified portfolios

## 🛠️ Technology Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom glass morphism effects
- **Build Tool**: Vite for fast development and optimized builds
- **Price Data**: Finnhub API integration with intelligent caching
- **State Management**: React hooks with local state optimization

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm
- Finnhub API key (free tier available at [finnhub.io](https://finnhub.io))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/lukefr09/allogator.git
   cd allogator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Create .env file in root directory
   echo "VITE_FINNHUB_API_KEY=your_api_key_here" > .env
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## 📖 Usage Guide

### Basic Workflow
1. **Add Your Assets**: Enter stock symbols or crypto tickers
2. **Set Current Values**: Input your current holdings (in dollars or shares)
3. **Define Target Allocations**: Set your desired percentage for each asset
4. **Enter New Money**: Specify how much you want to invest
5. **Get Recommendations**: View calculated allocation amounts

### Key Features Explained

#### Price Integration
- Prices update automatically when you add assets
- Manual price entry available if API fails
- 5-minute caching to optimize API usage
- Rate limiting protection (1.1s between requests)

#### Allocation Algorithm
- **Phase 1**: Prioritizes underweight positions
- **Phase 2**: Distributes remaining funds proportionally
- **Phase 3**: Handles rounding with cent-level precision

#### View Modes
- **Money Mode**: Work with dollar amounts
- **Shares Mode**: Track exact share quantities
- Automatic conversion between modes when prices are available

## 🏗️ Project Structure

```
src/
├── components/           # React components
│   ├── AddAsset.tsx     # Asset addition form
│   ├── AssetList.tsx    # Portfolio display and editing
│   ├── Header.tsx       # App header with new money input
│   └── ...
├── services/            # External integrations
│   └── priceService.ts  # Finnhub API client
├── utils/               # Utility functions
│   ├── calculations.ts  # Portfolio rebalancing logic
│   ├── validation.ts    # Input validation
│   ├── cryptoAliases.ts # Crypto symbol handling
│   └── ...
├── types.ts            # TypeScript interfaces
└── App.tsx             # Main application component
```

## 🔧 Configuration

### Environment Variables
- `VITE_FINNHUB_API_KEY`: Your Finnhub API key for price data

### API Rate Limits
- Free Finnhub tier: 60 calls/minute
- Built-in rate limiting: 1.1 seconds between requests
- Intelligent caching: 5-minute cache per symbol

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Finnhub.io](https://finnhub.io) for financial data API
- [Tailwind CSS](https://tailwindcss.com) for styling framework
- [Vite](https://vitejs.dev) for build tooling

## 🚀 About

Built by [Luke](https://github.com/lukefr09) - a 16-year-old developer and investor who needed a better way to rebalance his portfolio every month.

This tool went from idea to production in under 2 hours. Now used by investors worldwide for precise portfolio management!

### Star History
[![Star History Chart](https://api.star-history.com/svg?repos=lukefr09/allogator&type=Date)](https://star-history.com/#lukefr09/allogator&Date)

---

**Built with ❤️ for smart investors**
