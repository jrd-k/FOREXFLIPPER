# Changelog

All notable changes to JRd-Trades will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-19

### Added
- **Core Trading Engine**: Multi-strategy trading system with trend-following, mean reversion, and breakout scalping
- **Advanced Risk Management**: Dynamic position sizing, emergency stops, daily/weekly loss limits
- **Multi-Broker Support**: Universal connector supporting MT4/MT5, OANDA, cTrader, and more
- **Real-time Dashboard**: Professional trading interface with live updates via WebSocket
- **Master Trader Integration**: Signals from successful forex traders
- **Economic Calendar**: Auto-pause during high-impact news events
- **Trade Layering**: Pyramid scaling on profitable positions
- **Account Protection**: Multiple safety layers to prevent small account blowouts
- **Overnight Trading**: Conditional overnight position holding based on trend strength
- **Resume/Pause Controls**: Full system control with state persistence

### Trading Strategies
- **Trend-Following**: EMA 20/50 crossover with ADX confirmation
- **Mean Reversion**: RSI-based counter-trend trading in ranging markets  
- **Breakout Scalping**: Tight consolidation breakout detection and execution

### Risk Management Features
- Dynamic lot sizing based on account balance and risk percentage
- Aggressive scaling: Risk increases by 0.5% per 10% account growth
- Max daily loss: 5% equity drawdown stops trading
- Kill switch: 3 consecutive losses = 1-hour pause
- Volatile pair avoidance (Gold, Silver, Oil, Crypto, Synthetics)

### Technical Features
- React frontend with TypeScript and Tailwind CSS
- Express.js backend with WebSocket support
- PostgreSQL database with Drizzle ORM
- Chart.js integration for performance visualization
- Real-time data streaming and updates
- Responsive design for all screen sizes

### Security & Safety
- Comprehensive input validation
- Secure API key management
- Multiple circuit breakers for risk protection
- Connection monitoring and failsafe mechanisms
- Manual emergency stop functionality

### Documentation
- Comprehensive README with setup instructions
- Contributing guidelines for developers
- Environment variable configuration examples
- Trading strategy documentation
- Risk management explanations

## [Unreleased]

### Planned Features
- Backtesting engine with historical data
- Advanced charting with technical indicators
- Copy trading functionality
- Mobile app companion
- Advanced portfolio management
- Machine learning trade optimization
- Social trading features
- Advanced reporting and analytics

---

### Legend
- `Added` for new features
- `Changed` for changes in existing functionality
- `Deprecated` for soon-to-be removed features
- `Removed` for now removed features
- `Fixed` for any bug fixes
- `Security` for vulnerability fixes