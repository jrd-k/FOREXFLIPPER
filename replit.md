# JRd-Trades - Advanced Forex Trading System

## Project Overview
JRd-Trades is a sophisticated forex trading system specifically engineered to safely scale small accounts (starting from $10) without blowing them up. The system uses 1-3 minute timeframes with multiple safety layers, combining master trader strategies, economic event awareness, and ultra-conservative risk management to protect small capital while enabling aggressive but controlled growth.

## Core Features
- **Multi-Strategy Trading**: Trend-following (EMA crossovers), Mean reversion (RSI), Breakout scalping
- **Aggressive Scaling**: Dynamic risk management that increases position sizes as account grows
- **Capital Protection**: Daily loss limits, equity guards, emergency stops
- **Trade Layering**: Add to profitable positions when trend is established
- **Overnight Trading**: Continue trading overnight if strong trend is detected
- **Resume/Pause Controls**: Full system control with state persistence
- **Real-time Dashboard**: Live monitoring, charts, and trade management

## Trading Strategy
### 1. Trend-Following (Core)
- EMA 20 + EMA 50 crossover for direction
- ADX > 20 confirms trend strength
- Entry: Buy when EMA20 > EMA50 + RSI > 55

### 2. Mean Reversion (Safety Net)
- RSI < 30 → oversold bounce (buy)
- RSI > 70 → overbought drop (sell)
- Only when ADX < 20 (ranging markets)

### 3. Breakout Scalping
- Tight consolidation detection (low ATR)
- Trade breakouts beyond recent highs/lows
- Quick 1:1 risk:reward scalps

### 4. Risk Management
- Dynamic lot sizing: (Balance × Risk%) ÷ (SL pips × Pip Value)
- Aggressive scaling: Risk increases by 0.5% per 10% account growth
- Max daily loss: 5% equity drawdown stops trading
- Kill switch: 3 consecutive losses = 1-hour pause

### 5. Trade Layering
- Add to profitable positions when trend continues
- Maximum 3 layers per trade
- Each layer uses reduced position size
- Trailing stops protect layered profits

### 6. Overnight Trading
- Continue trading if ADX > 30 and clear trend
- Reduce position sizes by 50% for overnight holds
- Wake-up checks at major session opens

## Technical Architecture
- **Frontend**: React with real-time charts and controls
- **Backend**: Express.js with WebSocket connections
- **Storage**: In-memory with persistent state
- **Charts**: Chart.js for performance visualization
- **Real-time**: WebSocket for live updates

## User Preferences
- Aggressive scaling approach for small accounts
- Focus on capital protection while maximizing growth
- Real-time monitoring and control capabilities
- Resume/pause functionality for system control

## Recent Changes
- Initial project setup with hybrid trading strategy
- Implemented multi-timeframe analysis (1-3 minutes)
- Added trade layering and overnight trading capabilities
- Created comprehensive risk management system

## Development Guidelines
Following fullstack_js blueprint with modern React/Express architecture.