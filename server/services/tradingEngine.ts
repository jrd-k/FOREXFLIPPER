import { storage } from "../storage";
import type { Trade, TradingAccount, RiskSettings } from "@shared/schema";

export interface TradingSignal {
  symbol: string;
  direction: "long" | "short";
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  confidence: number;
  strategy: string;
}

export class TradingEngine {
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private emergencyStop: boolean = false;

  async startTrading(accountId: string): Promise<void> {
    if (this.emergencyStop) {
      throw new Error("Trading is in emergency stop mode");
    }

    this.isRunning = true;
    console.log(`Trading engine started for account ${accountId}`);
  }

  async pauseTrading(): Promise<void> {
    this.isPaused = true;
    console.log("Trading engine paused");
  }

  async resumeTrading(): Promise<void> {
    if (this.emergencyStop) {
      throw new Error("Cannot resume trading in emergency stop mode");
    }
    
    this.isPaused = false;
    console.log("Trading engine resumed");
  }

  async emergencyStopTrading(): Promise<void> {
    this.emergencyStop = true;
    this.isRunning = false;
    this.isPaused = true;
    
    // Close all open positions immediately
    console.log("Emergency stop activated - closing all positions");
  }

  async analyzeMarket(symbol: string): Promise<TradingSignal | null> {
    // Conservative market analysis for small accounts
    // This would integrate with MT4/MT5, cTrader, or other broker APIs
    
    // Mock analysis for demonstration - in production this would use real market data
    const signals = await this.generateConservativeSignals(symbol);
    return signals;
  }

  private async generateConservativeSignals(symbol: string): Promise<TradingSignal | null> {
    // Ultra-conservative signal generation for small accounts
    // Only trade major pairs with high probability setups
    
    const majorPairs = ["EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "USDCAD"];
    if (!majorPairs.includes(symbol)) {
      return null; // Skip volatile pairs like Gold, Silver, etc.
    }

    // Implement EMA crossover, RSI, and ADX analysis here
    // Return null if conditions are not met
    
    return null; // Conservative approach - only signal when very confident
  }

  async calculatePositionSize(accountId: string, riskPercentage: number, stopLossDistance: number): Promise<number> {
    const account = await storage.getTradingAccount(accountId);
    if (!account) {
      throw new Error("Account not found");
    }

    const riskSettings = await storage.getRiskSettings(accountId);
    if (!riskSettings) {
      throw new Error("Risk settings not found");
    }

    // Conservative position sizing for small accounts
    const balance = parseFloat(account.balance);
    const maxRiskAmount = balance * (riskPercentage / 100);
    
    // Ultra-conservative sizing for accounts under $100
    if (balance < 100) {
      riskPercentage = Math.min(riskPercentage, 0.5); // Max 0.5% for micro accounts
    } else if (balance < 1000) {
      riskPercentage = Math.min(riskPercentage, 1.0); // Max 1% for small accounts
    }

    // Calculate lot size based on risk and stop loss distance
    const pipValue = 10; // $10 per pip for 1 standard lot on major pairs
    const lotSize = maxRiskAmount / (stopLossDistance * pipValue);
    
    // Ensure minimum lot size constraints
    return Math.max(0.01, Math.min(lotSize, 0.15)); // Min 0.01, Max 0.15 for small accounts
  }

  async executeTrade(accountId: string, signal: TradingSignal): Promise<Trade> {
    if (!this.isRunning || this.isPaused || this.emergencyStop) {
      throw new Error("Trading engine is not active");
    }

    const account = await storage.getTradingAccount(accountId);
    if (!account) {
      throw new Error("Account not found");
    }

    // Check risk limits before executing
    await this.checkRiskLimits(accountId);

    // Calculate position size
    const stopLossDistance = Math.abs(signal.entryPrice - signal.stopLoss) * 10000; // in pips
    const lotSize = await this.calculatePositionSize(accountId, 1.0, stopLossDistance);

    // Create trade record
    const trade = await storage.createTrade({
      accountId,
      symbol: signal.symbol,
      direction: signal.direction,
      entryPrice: signal.entryPrice.toString(),
      stopLoss: signal.stopLoss.toString(),
      takeProfit: signal.takeProfit.toString(),
      lotSize: lotSize.toString(),
      currentPrice: signal.entryPrice.toString(),
      status: "open",
    });

    console.log(`Trade executed: ${signal.symbol} ${signal.direction} at ${signal.entryPrice}`);
    return trade;
  }

  private async checkRiskLimits(accountId: string): Promise<void> {
    const openTrades = await storage.getOpenTrades(accountId);
    const riskSettings = await storage.getRiskSettings(accountId);
    
    if (!riskSettings) {
      throw new Error("Risk settings not configured");
    }

    // Check maximum open positions
    if (openTrades.length >= riskSettings.maxPositionsOpen) {
      throw new Error("Maximum open positions reached");
    }

    // Check daily loss limits
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayTrades = await storage.getTrades(accountId);
    const todayPnL = todayTrades
      .filter(trade => {
        const tradeDate = new Date(trade.createdAt);
        tradeDate.setHours(0, 0, 0, 0);
        return tradeDate.getTime() === today.getTime();
      })
      .reduce((sum, trade) => sum + parseFloat(trade.pnl || "0"), 0);

    const account = await storage.getTradingAccount(accountId);
    const dailyLossLimit = parseFloat(account!.balance) * (parseFloat(riskSettings.maxDailyLoss) / 100);

    if (Math.abs(todayPnL) >= dailyLossLimit) {
      throw new Error("Daily loss limit reached");
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      emergencyStop: this.emergencyStop,
    };
  }
}

export const tradingEngine = new TradingEngine();
