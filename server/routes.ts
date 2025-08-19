import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { tradingEngine } from "./services/tradingEngine";
import { brokerConnector } from "./services/brokerConnector";
import { riskManager } from "./services/riskManager";
import { economicCalendar } from "./services/economicCalendar";

export async function registerRoutes(app: Express): Promise<Server> {
  // Trading account routes
  app.get("/api/accounts", async (req, res) => {
    try {
      // Mock user ID for demonstration - in production this would come from auth
      const userId = "demo-user-123";
      const accounts = await storage.getTradingAccounts(userId);
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      res.status(500).json({ message: "Failed to fetch accounts" });
    }
  });

  app.get("/api/accounts/:id", async (req, res) => {
    try {
      const account = await storage.getTradingAccount(req.params.id);
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }
      res.json(account);
    } catch (error) {
      console.error("Error fetching account:", error);
      res.status(500).json({ message: "Failed to fetch account" });
    }
  });

  // Trading routes
  app.get("/api/accounts/:id/trades", async (req, res) => {
    try {
      const trades = await storage.getTrades(req.params.id);
      res.json(trades);
    } catch (error) {
      console.error("Error fetching trades:", error);
      res.status(500).json({ message: "Failed to fetch trades" });
    }
  });

  app.get("/api/accounts/:id/trades/open", async (req, res) => {
    try {
      const openTrades = await storage.getOpenTrades(req.params.id);
      res.json(openTrades);
    } catch (error) {
      console.error("Error fetching open trades:", error);
      res.status(500).json({ message: "Failed to fetch open trades" });
    }
  });

  app.post("/api/accounts/:id/trades/:tradeId/close", async (req, res) => {
    try {
      const { exitPrice, pnl } = req.body;
      const closedTrade = await storage.closeTrade(req.params.tradeId, exitPrice, pnl);
      res.json(closedTrade);
    } catch (error) {
      console.error("Error closing trade:", error);
      res.status(500).json({ message: "Failed to close trade" });
    }
  });

  // Risk management routes
  app.get("/api/accounts/:id/risk-analysis", async (req, res) => {
    try {
      const riskAnalysis = await riskManager.analyzeRisk(req.params.id);
      res.json(riskAnalysis);
    } catch (error) {
      console.error("Error analyzing risk:", error);
      res.status(500).json({ message: "Failed to analyze risk" });
    }
  });

  app.get("/api/accounts/:id/risk-settings", async (req, res) => {
    try {
      const riskSettings = await storage.getRiskSettings(req.params.id);
      res.json(riskSettings);
    } catch (error) {
      console.error("Error fetching risk settings:", error);
      res.status(500).json({ message: "Failed to fetch risk settings" });
    }
  });

  app.post("/api/accounts/:id/emergency-stop", async (req, res) => {
    try {
      await riskManager.activateEmergencyStop(req.params.id);
      res.json({ message: "Emergency stop activated" });
    } catch (error) {
      console.error("Error activating emergency stop:", error);
      res.status(500).json({ message: "Failed to activate emergency stop" });
    }
  });

  app.post("/api/accounts/:id/pause-trading", async (req, res) => {
    try {
      await riskManager.pauseTrading(req.params.id);
      res.json({ message: "Trading paused" });
    } catch (error) {
      console.error("Error pausing trading:", error);
      res.status(500).json({ message: "Failed to pause trading" });
    }
  });

  app.post("/api/accounts/:id/resume-trading", async (req, res) => {
    try {
      await riskManager.resumeTrading(req.params.id);
      res.json({ message: "Trading resumed" });
    } catch (error) {
      console.error("Error resuming trading:", error);
      res.status(500).json({ message: "Failed to resume trading" });
    }
  });

  // Broker connection routes
  app.get("/api/broker-connections", async (req, res) => {
    try {
      const connections = brokerConnector.getAllConnections();
      res.json(connections);
    } catch (error) {
      console.error("Error fetching broker connections:", error);
      res.status(500).json({ message: "Failed to fetch broker connections" });
    }
  });

  app.post("/api/broker-connections/test/:id", async (req, res) => {
    try {
      const isConnected = await brokerConnector.testConnection(req.params.id);
      res.json({ connected: isConnected });
    } catch (error) {
      console.error("Error testing connection:", error);
      res.status(500).json({ message: "Failed to test connection" });
    }
  });

  // Master trader signals routes
  app.get("/api/master-trader-signals", async (req, res) => {
    try {
      const signals = await storage.getActiveMasterTraderSignals();
      res.json(signals);
    } catch (error) {
      console.error("Error fetching master trader signals:", error);
      res.status(500).json({ message: "Failed to fetch master trader signals" });
    }
  });

  // Economic calendar routes
  app.get("/api/economic-events", async (req, res) => {
    try {
      const events = await storage.getUpcomingEconomicEvents();
      res.json(events);
    } catch (error) {
      console.error("Error fetching economic events:", error);
      res.status(500).json({ message: "Failed to fetch economic events" });
    }
  });

  // Performance metrics routes
  app.get("/api/accounts/:id/performance", async (req, res) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const metrics = await storage.getPerformanceMetrics(req.params.id, startDate, endDate);
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching performance metrics:", error);
      res.status(500).json({ message: "Failed to fetch performance metrics" });
    }
  });

  // Trading engine control routes
  app.get("/api/trading-engine/status", async (req, res) => {
    try {
      const status = tradingEngine.getStatus();
      res.json(status);
    } catch (error) {
      console.error("Error fetching trading engine status:", error);
      res.status(500).json({ message: "Failed to fetch trading engine status" });
    }
  });

  // Market data routes
  app.get("/api/market-data/:symbol", async (req, res) => {
    try {
      const marketData = await brokerConnector.getMarketData(req.params.symbol);
      res.json(marketData);
    } catch (error) {
      console.error("Error fetching market data:", error);
      res.status(500).json({ message: "Failed to fetch market data" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket client connected');

    // Send initial data
    ws.send(JSON.stringify({
      type: 'connection',
      message: 'Connected to JRd-Trades WebSocket'
    }));

    // Send periodic updates
    const updateInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        // Send real-time updates
        ws.send(JSON.stringify({
          type: 'market_update',
          data: {
            timestamp: new Date().toISOString(),
            prices: {
              EURUSD: (1.0850 + (Math.random() - 0.5) * 0.001).toFixed(5),
              GBPUSD: (1.2650 + (Math.random() - 0.5) * 0.001).toFixed(5),
              USDJPY: (149.80 + (Math.random() - 0.5) * 0.1).toFixed(2),
            }
          }
        }));
      }
    }, 5000);

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      clearInterval(updateInterval);
    });

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received WebSocket message:', data);
        
        // Handle different message types
        switch (data.type) {
          case 'subscribe_account':
            // Subscribe to account updates
            break;
          case 'subscribe_market_data':
            // Subscribe to market data updates
            break;
          default:
            console.log('Unknown message type:', data.type);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });
  });

  // Initialize mock data on startup
  setTimeout(async () => {
    try {
      // Create demo trading account
      const demoAccount = await storage.createTradingAccount({
        userId: "demo-user-123",
        brokerName: "IC Markets MT5",
        accountNumber: "12345678",
        accountType: "live",
        balance: "1247.83",
        equity: "1275.48",
        currency: "USD",
        leverage: 500,
        connectionStatus: "connected",
      });

      // Create risk settings
      await storage.updateRiskSettings(demoAccount.id, {
        accountId: demoAccount.id,
        maxDailyLoss: "10",
        maxWeeklyLoss: "15",
        maxMonthlyLoss: "20",
        riskPerTrade: "1.2",
        maxPositionsOpen: 3,
        conservativeMode: true,
      });

      // Create demo trades
      await storage.createTrade({
        accountId: demoAccount.id,
        symbol: "EURUSD",
        direction: "long",
        entryPrice: "1.0845",
        currentPrice: "1.0869",
        lotSize: "0.12",
        stopLoss: "1.0825",
        takeProfit: "1.0890",
        pnl: "24.30",
        status: "open",
      });

      await storage.createTrade({
        accountId: demoAccount.id,
        symbol: "GBPUSD", 
        direction: "short",
        entryPrice: "1.2645",
        currentPrice: "1.2653",
        lotSize: "0.10",
        stopLoss: "1.2670",
        takeProfit: "1.2600",
        pnl: "-8.50",
        status: "open",
      });

      await storage.createTrade({
        accountId: demoAccount.id,
        symbol: "USDJPY",
        direction: "long",
        entryPrice: "149.82",
        currentPrice: "149.95",
        lotSize: "0.08",
        stopLoss: "149.60",
        takeProfit: "150.20",
        pnl: "12.15",
        status: "open",
      });

      // Create master trader signals
      await storage.createMasterTraderSignal({
        traderId: "master_trader_1",
        traderName: "ProTrader Elite",
        symbol: "EURUSD",
        direction: "long",
        entryPrice: "1.0845",
        stopLoss: "1.0825",
        takeProfit: "1.0890",
        confidence: 92,
        riskLevel: "medium",
        description: "Strong uptrend confirmed on 4H timeframe",
        pips: 85,
        status: "active",
      });

      await storage.createMasterTraderSignal({
        traderId: "master_trader_2", 
        traderName: "FX Wizard Pro",
        symbol: "GBPUSD",
        direction: "short",
        entryPrice: "1.2645",
        stopLoss: "1.2670",
        takeProfit: "1.2600",
        confidence: 78,
        riskLevel: "low",
        description: "Resistance at 1.2650 level holding strong",
        pips: -23,
        status: "active",
      });

      await storage.createMasterTraderSignal({
        traderId: "master_trader_3",
        traderName: "Tokyo Session Pro",
        symbol: "USDJPY",
        direction: "watch",
        confidence: 65,
        riskLevel: "medium",
        description: "Consolidating between 149.50-150.20",
        pips: 0,
        status: "watching",
      });

      // Initialize broker connections
      await brokerConnector.connectMT5("demo-account-1", "ICMarketsDemo", "12345678", "password");
      await brokerConnector.connectMT4("demo-account-2", "ExnessDemo", "87654321", "password");
      await brokerConnector.connectOANDA("demo-account-3", "demo-api-key", "practice");

      // Fetch economic events
      await economicCalendar.fetchEconomicEvents();

      console.log("Demo data initialized successfully");
    } catch (error) {
      console.error("Error initializing demo data:", error);
    }
  }, 2000);

  return httpServer;
}
