import { storage } from "../storage";
import type { Trade, TradingAccount, RiskSettings } from "@shared/schema";

export interface RiskAnalysis {
  currentRiskUsage: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  canTrade: boolean;
  riskWarnings: string[];
  recommendedPositionSize: number;
  emergencyStopTriggered: boolean;
}

export class RiskManager {
  async analyzeRisk(accountId: string): Promise<RiskAnalysis> {
    const account = await storage.getTradingAccount(accountId);
    const riskSettings = await storage.getRiskSettings(accountId);
    
    if (!account || !riskSettings) {
      throw new Error("Account or risk settings not found");
    }

    const balance = parseFloat(account.balance);
    const analysis: RiskAnalysis = {
      currentRiskUsage: {
        daily: 0,
        weekly: 0,
        monthly: 0,
      },
      canTrade: true,
      riskWarnings: [],
      recommendedPositionSize: 0.01,
      emergencyStopTriggered: riskSettings.emergencyStopActive,
    };

    // Calculate daily risk usage
    const todayPnL = await this.calculateDailyPnL(accountId);
    const dailyRiskUsage = (Math.abs(todayPnL) / balance) * 100;
    analysis.currentRiskUsage.daily = dailyRiskUsage;

    // Calculate weekly risk usage
    const weeklyPnL = await this.calculateWeeklyPnL(accountId);
    const weeklyRiskUsage = (Math.abs(weeklyPnL) / balance) * 100;
    analysis.currentRiskUsage.weekly = weeklyRiskUsage;

    // Calculate monthly risk usage
    const monthlyPnL = await this.calculateMonthlyPnL(accountId);
    const monthlyRiskUsage = (Math.abs(monthlyPnL) / balance) * 100;
    analysis.currentRiskUsage.monthly = monthlyRiskUsage;

    // Check risk limits and generate warnings
    this.checkRiskLimits(analysis, riskSettings);
    
    // Calculate recommended position size based on current risk usage
    analysis.recommendedPositionSize = this.calculateRecommendedPositionSize(balance, analysis, riskSettings);

    return analysis;
  }

  private async calculateDailyPnL(accountId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayTrades = await storage.getTrades(accountId);
    return todayTrades
      .filter(trade => {
        const tradeDate = new Date(trade.createdAt);
        return tradeDate >= today && tradeDate < tomorrow;
      })
      .reduce((sum, trade) => sum + parseFloat(trade.pnl || "0"), 0);
  }

  private async calculateWeeklyPnL(accountId: string): Promise<number> {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weekTrades = await storage.getTrades(accountId);
    return weekTrades
      .filter(trade => {
        const tradeDate = new Date(trade.createdAt);
        return tradeDate >= weekStart;
      })
      .reduce((sum, trade) => sum + parseFloat(trade.pnl || "0"), 0);
  }

  private async calculateMonthlyPnL(accountId: string): Promise<number> {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const monthTrades = await storage.getTrades(accountId);
    return monthTrades
      .filter(trade => {
        const tradeDate = new Date(trade.createdAt);
        return tradeDate >= monthStart;
      })
      .reduce((sum, trade) => sum + parseFloat(trade.pnl || "0"), 0);
  }

  private checkRiskLimits(analysis: RiskAnalysis, riskSettings: RiskSettings): void {
    const { daily, weekly, monthly } = analysis.currentRiskUsage;
    const maxDaily = parseFloat(riskSettings.maxDailyLoss);
    const maxWeekly = parseFloat(riskSettings.maxWeeklyLoss);
    const maxMonthly = parseFloat(riskSettings.maxMonthlyLoss);

    // Check daily limit
    if (daily >= maxDaily * 0.8) {
      analysis.riskWarnings.push(`Daily risk usage at ${daily.toFixed(1)}% (limit: ${maxDaily}%)`);
      if (daily >= maxDaily) {
        analysis.canTrade = false;
        analysis.riskWarnings.push("DAILY RISK LIMIT EXCEEDED - Trading halted");
      }
    }

    // Check weekly limit
    if (weekly >= maxWeekly * 0.8) {
      analysis.riskWarnings.push(`Weekly risk usage at ${weekly.toFixed(1)}% (limit: ${maxWeekly}%)`);
      if (weekly >= maxWeekly) {
        analysis.canTrade = false;
        analysis.riskWarnings.push("WEEKLY RISK LIMIT EXCEEDED - Trading halted");
      }
    }

    // Check monthly limit
    if (monthly >= maxMonthly * 0.8) {
      analysis.riskWarnings.push(`Monthly risk usage at ${monthly.toFixed(1)}% (limit: ${maxMonthly}%)`);
      if (monthly >= maxMonthly) {
        analysis.canTrade = false;
        analysis.riskWarnings.push("MONTHLY RISK LIMIT EXCEEDED - Trading halted");
      }
    }

    // Emergency stop check
    if (riskSettings.emergencyStopActive) {
      analysis.canTrade = false;
      analysis.riskWarnings.push("EMERGENCY STOP ACTIVE - All trading halted");
    }

    // Trading paused check
    if (riskSettings.tradingPaused) {
      analysis.canTrade = false;
      analysis.riskWarnings.push("Trading manually paused");
    }
  }

  private calculateRecommendedPositionSize(balance: number, analysis: RiskAnalysis, riskSettings: RiskSettings): number {
    let baseRisk = parseFloat(riskSettings.riskPerTrade);
    
    // Ultra-conservative sizing for small accounts
    if (balance < 100) {
      baseRisk = Math.min(baseRisk, 0.5); // Max 0.5% for micro accounts
    } else if (balance < 1000) {
      baseRisk = Math.min(baseRisk, 1.0); // Max 1% for small accounts
    } else if (balance < 5000) {
      baseRisk = Math.min(baseRisk, 1.5); // Max 1.5% for medium accounts
    }

    // Reduce risk based on current usage
    const riskReduction = Math.max(
      analysis.currentRiskUsage.daily / 10,
      analysis.currentRiskUsage.weekly / 15,
      analysis.currentRiskUsage.monthly / 20
    );

    const adjustedRisk = baseRisk * (1 - riskReduction);
    
    // Calculate lot size (assuming $10 per pip for major pairs)
    const riskAmount = balance * (adjustedRisk / 100);
    const pipValue = 10;
    const averageStopLoss = 20; // 20 pips average
    
    const lotSize = riskAmount / (averageStopLoss * pipValue);
    return Math.max(0.01, Math.min(lotSize, 0.15)); // Min 0.01, Max 0.15
  }

  async activateEmergencyStop(accountId: string): Promise<void> {
    await storage.updateRiskSettings(accountId, {
      emergencyStopActive: true,
      tradingPaused: true,
    });

    // Close all open positions
    const openTrades = await storage.getOpenTrades(accountId);
    for (const trade of openTrades) {
      // In production, this would close actual positions via broker APIs
      await storage.updateTrade(trade.id, {
        status: "closed",
        closedAt: new Date(),
      });
    }

    console.log(`Emergency stop activated for account ${accountId}`);
  }

  async pauseTrading(accountId: string): Promise<void> {
    await storage.updateRiskSettings(accountId, {
      tradingPaused: true,
    });
    console.log(`Trading paused for account ${accountId}`);
  }

  async resumeTrading(accountId: string): Promise<void> {
    const riskSettings = await storage.getRiskSettings(accountId);
    if (riskSettings?.emergencyStopActive) {
      throw new Error("Cannot resume trading while emergency stop is active");
    }

    await storage.updateRiskSettings(accountId, {
      tradingPaused: false,
    });
    console.log(`Trading resumed for account ${accountId}`);
  }

  async resetEmergencyStop(accountId: string): Promise<void> {
    await storage.updateRiskSettings(accountId, {
      emergencyStopActive: false,
      tradingPaused: false,
    });
    console.log(`Emergency stop reset for account ${accountId}`);
  }
}

export const riskManager = new RiskManager();
