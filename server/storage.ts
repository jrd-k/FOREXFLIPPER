import {
  users,
  tradingAccounts,
  trades,
  riskSettings,
  economicEvents,
  masterTraderSignals,
  performanceMetrics,
  type User,
  type UpsertUser,
  type TradingAccount,
  type InsertTradingAccount,
  type Trade,
  type InsertTrade,
  type RiskSettings,
  type InsertRiskSettings,
  type EconomicEvent,
  type InsertEconomicEvent,
  type MasterTraderSignal,
  type InsertMasterTraderSignal,
  type PerformanceMetric,
  type InsertPerformanceMetric,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, lte } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Trading account operations
  getTradingAccounts(userId: string): Promise<TradingAccount[]>;
  getTradingAccount(id: string): Promise<TradingAccount | undefined>;
  createTradingAccount(account: InsertTradingAccount): Promise<TradingAccount>;
  updateTradingAccount(id: string, account: Partial<InsertTradingAccount>): Promise<TradingAccount>;
  
  // Trade operations
  getTrades(accountId: string): Promise<Trade[]>;
  getOpenTrades(accountId: string): Promise<Trade[]>;
  createTrade(trade: InsertTrade): Promise<Trade>;
  updateTrade(id: string, trade: Partial<InsertTrade>): Promise<Trade>;
  closeTrade(id: string, exitPrice: string, pnl: string): Promise<Trade>;
  
  // Risk settings operations
  getRiskSettings(accountId: string): Promise<RiskSettings | undefined>;
  updateRiskSettings(accountId: string, settings: Partial<InsertRiskSettings>): Promise<RiskSettings>;
  
  // Economic events operations
  getUpcomingEconomicEvents(): Promise<EconomicEvent[]>;
  createEconomicEvent(event: InsertEconomicEvent): Promise<EconomicEvent>;
  
  // Master trader signals operations
  getActiveMasterTraderSignals(): Promise<MasterTraderSignal[]>;
  createMasterTraderSignal(signal: InsertMasterTraderSignal): Promise<MasterTraderSignal>;
  
  // Performance metrics operations
  getPerformanceMetrics(accountId: string, startDate?: Date, endDate?: Date): Promise<PerformanceMetric[]>;
  createPerformanceMetric(metric: InsertPerformanceMetric): Promise<PerformanceMetric>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Trading account operations
  async getTradingAccounts(userId: string): Promise<TradingAccount[]> {
    return await db
      .select()
      .from(tradingAccounts)
      .where(eq(tradingAccounts.userId, userId))
      .orderBy(desc(tradingAccounts.createdAt));
  }

  async getTradingAccount(id: string): Promise<TradingAccount | undefined> {
    const [account] = await db
      .select()
      .from(tradingAccounts)
      .where(eq(tradingAccounts.id, id));
    return account;
  }

  async createTradingAccount(account: InsertTradingAccount): Promise<TradingAccount> {
    const [newAccount] = await db
      .insert(tradingAccounts)
      .values(account)
      .returning();
    return newAccount;
  }

  async updateTradingAccount(id: string, account: Partial<InsertTradingAccount>): Promise<TradingAccount> {
    const [updatedAccount] = await db
      .update(tradingAccounts)
      .set({ ...account, updatedAt: new Date() })
      .where(eq(tradingAccounts.id, id))
      .returning();
    return updatedAccount;
  }

  // Trade operations
  async getTrades(accountId: string): Promise<Trade[]> {
    return await db
      .select()
      .from(trades)
      .where(eq(trades.accountId, accountId))
      .orderBy(desc(trades.createdAt));
  }

  async getOpenTrades(accountId: string): Promise<Trade[]> {
    return await db
      .select()
      .from(trades)
      .where(and(
        eq(trades.accountId, accountId),
        eq(trades.status, "open")
      ))
      .orderBy(desc(trades.openedAt));
  }

  async createTrade(trade: InsertTrade): Promise<Trade> {
    const [newTrade] = await db
      .insert(trades)
      .values(trade)
      .returning();
    return newTrade;
  }

  async updateTrade(id: string, trade: Partial<InsertTrade>): Promise<Trade> {
    const [updatedTrade] = await db
      .update(trades)
      .set({ ...trade, updatedAt: new Date() })
      .where(eq(trades.id, id))
      .returning();
    return updatedTrade;
  }

  async closeTrade(id: string, exitPrice: string, pnl: string): Promise<Trade> {
    const [closedTrade] = await db
      .update(trades)
      .set({
        exitPrice,
        pnl,
        status: "closed",
        closedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(trades.id, id))
      .returning();
    return closedTrade;
  }

  // Risk settings operations
  async getRiskSettings(accountId: string): Promise<RiskSettings | undefined> {
    const [settings] = await db
      .select()
      .from(riskSettings)
      .where(eq(riskSettings.accountId, accountId));
    return settings;
  }

  async updateRiskSettings(accountId: string, settings: Partial<InsertRiskSettings>): Promise<RiskSettings> {
    const [updatedSettings] = await db
      .update(riskSettings)
      .set({ ...settings, updatedAt: new Date() })
      .where(eq(riskSettings.accountId, accountId))
      .returning();
    return updatedSettings;
  }

  // Economic events operations
  async getUpcomingEconomicEvents(): Promise<EconomicEvent[]> {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return await db
      .select()
      .from(economicEvents)
      .where(and(
        gte(economicEvents.eventTime, today),
        lte(economicEvents.eventTime, nextWeek)
      ))
      .orderBy(economicEvents.eventTime);
  }

  async createEconomicEvent(event: InsertEconomicEvent): Promise<EconomicEvent> {
    const [newEvent] = await db
      .insert(economicEvents)
      .values(event)
      .returning();
    return newEvent;
  }

  // Master trader signals operations
  async getActiveMasterTraderSignals(): Promise<MasterTraderSignal[]> {
    return await db
      .select()
      .from(masterTraderSignals)
      .where(eq(masterTraderSignals.status, "active"))
      .orderBy(desc(masterTraderSignals.confidence));
  }

  async createMasterTraderSignal(signal: InsertMasterTraderSignal): Promise<MasterTraderSignal> {
    const [newSignal] = await db
      .insert(masterTraderSignals)
      .values(signal)
      .returning();
    return newSignal;
  }

  // Performance metrics operations
  async getPerformanceMetrics(accountId: string, startDate?: Date, endDate?: Date): Promise<PerformanceMetric[]> {
    let query = db
      .select()
      .from(performanceMetrics)
      .where(eq(performanceMetrics.accountId, accountId));

    if (startDate && endDate) {
      query = query.where(and(
        eq(performanceMetrics.accountId, accountId),
        gte(performanceMetrics.date, startDate),
        lte(performanceMetrics.date, endDate)
      ));
    }

    return await query.orderBy(performanceMetrics.date);
  }

  async createPerformanceMetric(metric: InsertPerformanceMetric): Promise<PerformanceMetric> {
    const [newMetric] = await db
      .insert(performanceMetrics)
      .values(metric)
      .returning();
    return newMetric;
  }
}

export const storage = new DatabaseStorage();
