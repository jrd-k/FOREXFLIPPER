import { sql, relations } from "drizzle-orm";
import {
  pgTable,
  varchar,
  text,
  timestamp,
  decimal,
  integer,
  boolean,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Trading accounts table
export const tradingAccounts = pgTable("trading_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  brokerName: varchar("broker_name").notNull(),
  accountNumber: varchar("account_number").notNull(),
  accountType: varchar("account_type").notNull(), // demo, live
  balance: decimal("balance", { precision: 15, scale: 2 }).notNull().default("0"),
  equity: decimal("equity", { precision: 15, scale: 2 }).notNull().default("0"),
  currency: varchar("currency").notNull().default("USD"),
  leverage: integer("leverage").notNull().default(100),
  isActive: boolean("is_active").notNull().default(true),
  connectionStatus: varchar("connection_status").notNull().default("disconnected"), // connected, disconnected, error
  apiKey: text("api_key"),
  apiSecret: text("api_secret"),
  serverEndpoint: text("server_endpoint"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Trading strategies table
export const tradingStrategies = pgTable("trading_strategies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  type: varchar("type").notNull(), // trend_following, mean_reversion, breakout_scalping
  parameters: jsonb("parameters").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Trades table
export const trades = pgTable("trades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: varchar("account_id").notNull().references(() => tradingAccounts.id),
  strategyId: varchar("strategy_id").references(() => tradingStrategies.id),
  symbol: varchar("symbol").notNull(), // EURUSD, GBPUSD, etc.
  direction: varchar("direction").notNull(), // long, short
  entryPrice: decimal("entry_price", { precision: 15, scale: 5 }).notNull(),
  currentPrice: decimal("current_price", { precision: 15, scale: 5 }),
  exitPrice: decimal("exit_price", { precision: 15, scale: 5 }),
  lotSize: decimal("lot_size", { precision: 10, scale: 2 }).notNull(),
  stopLoss: decimal("stop_loss", { precision: 15, scale: 5 }),
  takeProfit: decimal("take_profit", { precision: 15, scale: 5 }),
  pnl: decimal("pnl", { precision: 15, scale: 2 }).default("0"),
  status: varchar("status").notNull().default("open"), // open, closed, pending
  openedAt: timestamp("opened_at").defaultNow(),
  closedAt: timestamp("closed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Risk management settings table
export const riskSettings = pgTable("risk_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: varchar("account_id").notNull().references(() => tradingAccounts.id),
  maxDailyLoss: decimal("max_daily_loss", { precision: 5, scale: 2 }).notNull().default("10"), // percentage
  maxWeeklyLoss: decimal("max_weekly_loss", { precision: 5, scale: 2 }).notNull().default("15"), // percentage
  maxMonthlyLoss: decimal("max_monthly_loss", { precision: 5, scale: 2 }).notNull().default("20"), // percentage
  riskPerTrade: decimal("risk_per_trade", { precision: 5, scale: 2 }).notNull().default("1.0"), // percentage
  maxPositionsOpen: integer("max_positions_open").notNull().default(3),
  conservativeMode: boolean("conservative_mode").notNull().default(true),
  emergencyStopActive: boolean("emergency_stop_active").notNull().default(false),
  tradingPaused: boolean("trading_paused").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Economic events table
export const economicEvents = pgTable("economic_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  country: varchar("country").notNull(),
  currency: varchar("currency").notNull(),
  impact: varchar("impact").notNull(), // low, medium, high
  eventTime: timestamp("event_time").notNull(),
  forecast: varchar("forecast"),
  previous: varchar("previous"),
  actual: varchar("actual"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Master trader signals table
export const masterTraderSignals = pgTable("master_trader_signals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  traderId: varchar("trader_id").notNull(),
  traderName: varchar("trader_name").notNull(),
  symbol: varchar("symbol").notNull(),
  direction: varchar("direction").notNull(), // long, short, watch
  entryPrice: decimal("entry_price", { precision: 15, scale: 5 }),
  stopLoss: decimal("stop_loss", { precision: 15, scale: 5 }),
  takeProfit: decimal("take_profit", { precision: 15, scale: 5 }),
  confidence: integer("confidence").notNull(), // 1-100
  riskLevel: varchar("risk_level").notNull(), // low, medium, high
  description: text("description"),
  pips: integer("pips").default(0),
  status: varchar("status").notNull().default("active"), // active, closed, watching
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Performance metrics table
export const performanceMetrics = pgTable("performance_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: varchar("account_id").notNull().references(() => tradingAccounts.id),
  date: timestamp("date").notNull(),
  startingBalance: decimal("starting_balance", { precision: 15, scale: 2 }).notNull(),
  endingBalance: decimal("ending_balance", { precision: 15, scale: 2 }).notNull(),
  dailyPnL: decimal("daily_pnl", { precision: 15, scale: 2 }).notNull().default("0"),
  totalTrades: integer("total_trades").notNull().default(0),
  winningTrades: integer("winning_trades").notNull().default(0),
  losingTrades: integer("losing_trades").notNull().default(0),
  winRate: decimal("win_rate", { precision: 5, scale: 2 }).notNull().default("0"),
  riskUsed: decimal("risk_used", { precision: 5, scale: 2 }).notNull().default("0"), // percentage
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  tradingAccounts: many(tradingAccounts),
}));

export const tradingAccountsRelations = relations(tradingAccounts, ({ one, many }) => ({
  user: one(users, {
    fields: [tradingAccounts.userId],
    references: [users.id],
  }),
  trades: many(trades),
  riskSettings: many(riskSettings),
  performanceMetrics: many(performanceMetrics),
}));

export const tradesRelations = relations(trades, ({ one }) => ({
  account: one(tradingAccounts, {
    fields: [trades.accountId],
    references: [tradingAccounts.id],
  }),
  strategy: one(tradingStrategies, {
    fields: [trades.strategyId],
    references: [tradingStrategies.id],
  }),
}));

export const riskSettingsRelations = relations(riskSettings, ({ one }) => ({
  account: one(tradingAccounts, {
    fields: [riskSettings.accountId],
    references: [tradingAccounts.id],
  }),
}));

export const performanceMetricsRelations = relations(performanceMetrics, ({ one }) => ({
  account: one(tradingAccounts, {
    fields: [performanceMetrics.accountId],
    references: [tradingAccounts.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
});

export const insertTradingAccountSchema = createInsertSchema(tradingAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTradeSchema = createInsertSchema(trades).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRiskSettingsSchema = createInsertSchema(riskSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEconomicEventSchema = createInsertSchema(economicEvents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMasterTraderSignalSchema = createInsertSchema(masterTraderSignals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPerformanceMetricSchema = createInsertSchema(performanceMetrics).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type TradingAccount = typeof tradingAccounts.$inferSelect;
export type InsertTradingAccount = z.infer<typeof insertTradingAccountSchema>;
export type Trade = typeof trades.$inferSelect;
export type InsertTrade = z.infer<typeof insertTradeSchema>;
export type RiskSettings = typeof riskSettings.$inferSelect;
export type InsertRiskSettings = z.infer<typeof insertRiskSettingsSchema>;
export type EconomicEvent = typeof economicEvents.$inferSelect;
export type InsertEconomicEvent = z.infer<typeof insertEconomicEventSchema>;
export type MasterTraderSignal = typeof masterTraderSignals.$inferSelect;
export type InsertMasterTraderSignal = z.infer<typeof insertMasterTraderSignalSchema>;
export type PerformanceMetric = typeof performanceMetrics.$inferSelect;
export type InsertPerformanceMetric = z.infer<typeof insertPerformanceMetricSchema>;
