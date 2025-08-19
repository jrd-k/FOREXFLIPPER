# JRd-Trades - Advanced Forex Trading System

A sophisticated forex trading system specifically engineered to safely scale small accounts (starting from $10) without blowing them up. The system uses 1-3 minute timeframes with multiple safety layers, combining master trader strategies, economic event awareness, and ultra-conservative risk management to protect small capital while enabling aggressive but controlled growth.

## 🚀 Key Features

### Trading Strategies
- **Multi-Strategy Engine**: Trend-following (EMA crossovers), Mean reversion (RSI), Breakout scalping
- **Master Trader Integration**: Incorporates proven strategies from successful forex traders
- **Economic Event Filtering**: Automatically pauses trading during high-impact news events
- **Trade Layering**: Pyramid scaling on profitable positions with trend confirmation

### Risk Management
- **Dynamic Position Sizing**: Automatically adjusts lot sizes based on account balance and risk
- **Emergency Stop System**: Multiple circuit breakers to prevent account blowouts
- **Daily/Weekly Loss Limits**: Automatic trading halt when limits are reached
- **Volatile Pair Avoidance**: Excludes Gold, Silver, Oil, Crypto, and Synthetic pairs

### Account Protection
- **Small Account Focus**: Designed specifically for accounts starting from $10-$100
- **Conservative Scaling**: Aggressive growth with ultra-conservative risk management
- **Multi-Broker Support**: Compatible with MT4/MT5, OANDA, cTrader, and more
- **Real-time Monitoring**: Live dashboard with WebSocket connections

## 🛠 Technical Architecture

- **Frontend**: React with TypeScript, Tailwind CSS, and shadcn/ui components
- **Backend**: Express.js with WebSocket support for real-time updates
- **Database**: PostgreSQL with Drizzle ORM for data persistence
- **Charts**: Chart.js for performance visualization and trade analysis
- **Deployment**: Optimized for Replit with easy deployment options

## 📊 Trading Logic

### Strategy 1: Trend-Following (Primary)
- EMA 20 + EMA 50 crossover for trend direction
- ADX > 20 confirms trend strength
- Entry: Buy when EMA20 > EMA50 + RSI > 55
- Risk: 1-2% per trade with trailing stops

### Strategy 2: Mean Reversion (Counter-trend)
- RSI < 30 → Oversold bounce opportunities
- RSI > 70 → Overbought reversal setups  
- Only active when ADX < 20 (ranging markets)
- Quick scalps with 1:1 risk/reward

### Strategy 3: Breakout Scalping
- Detects tight consolidation patterns (low ATR)
- Trades breakouts beyond recent highs/lows
- Fast execution on 1-3 minute timeframes
- Immediate exit if momentum fails

## ⚡ Getting Started

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database
- Forex broker API credentials (MT4/MT5, OANDA, etc.)

### Installation
1. Clone the repository
```bash
git clone https://github.com/yourusername/jrd-trades.git
cd jrd-trades
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
# Add your database URL and broker API keys
```

4. Initialize the database
```bash
npm run db:push
```

5. Start the development server
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## 📈 Dashboard Features

- **Real-time Account Overview**: Balance, equity, P&L, and performance metrics
- **Active Trades Management**: Monitor and manage open positions
- **Risk Analysis**: Current exposure, drawdown, and safety metrics  
- **Economic Calendar**: Upcoming events with impact ratings
- **Master Trader Signals**: Live signals from successful traders
- **Broker Connections**: Multi-broker account management
- **Performance Charts**: Visual analysis of trading results

## 🔧 Configuration

### Risk Settings
- **Base Risk**: 1-2% per trade (adjustable)
- **Max Daily Loss**: 5% of account equity
- **Max Weekly Loss**: 10% of account equity  
- **Position Scaling**: Increases by 0.5% per 10% account growth

### Timeframes
- **Primary**: 1-minute charts for entries
- **Confirmation**: 3-minute for trend validation
- **Filter**: 15-minute for overall market direction

### Supported Brokers
- MetaTrader 4/5 (MT4/MT5)
- OANDA
- cTrader
- Interactive Brokers
- Plus500 (via API)
- And more via universal connector

## 🛡 Safety Features

1. **Account Blowout Prevention**: Multiple circuit breakers and emergency stops
2. **News Event Protection**: Auto-pause during high-impact economic releases  
3. **Drawdown Limits**: Automatic halt when daily/weekly limits are reached
4. **Connection Monitoring**: Failsafe for broker connection issues
5. **Manual Override**: Emergency stop button for immediate halt

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚠️ Disclaimer

Forex trading involves substantial risk and may not be suitable for all investors. Past performance does not guarantee future results. This software is provided for educational and research purposes. Trade responsibly and never risk more than you can afford to lose.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For questions, issues, or feature requests, please open an issue on GitHub or contact the development team.

---

**Built with ❤️ for forex traders who want to scale small accounts safely and aggressively.**