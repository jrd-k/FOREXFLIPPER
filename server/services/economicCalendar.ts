import { storage } from "../storage";
import type { EconomicEvent, InsertEconomicEvent } from "@shared/schema";

export interface EconomicEventAPI {
  date: string;
  time: string;
  currency: string;
  event: string;
  importance: string;
  actual?: string;
  forecast?: string;
  previous?: string;
}

export class EconomicCalendarService {
  private highImpactEvents: string[] = [
    "Non-Farm Payrolls",
    "Federal Reserve Interest Rate Decision",
    "CPI",
    "GDP",
    "Employment Change",
    "Unemployment Rate",
    "ECB Interest Rate Decision",
    "BoE Interest Rate Decision",
    "BoJ Interest Rate Decision",
  ];

  async fetchEconomicEvents(): Promise<EconomicEvent[]> {
    try {
      // In production, this would fetch from ForexFactory, DailyFX, or similar API
      const apiKey = process.env.ECONOMIC_CALENDAR_API_KEY || "";
      
      // For demonstration, create some mock events
      const mockEvents = await this.createMockEvents();
      
      // Store events in database
      for (const event of mockEvents) {
        await storage.createEconomicEvent(event);
      }

      return await storage.getUpcomingEconomicEvents();
    } catch (error) {
      console.error("Failed to fetch economic events:", error);
      return [];
    }
  }

  private async createMockEvents(): Promise<InsertEconomicEvent[]> {
    const now = new Date();
    const events: InsertEconomicEvent[] = [
      {
        title: "US Non-Farm Payrolls",
        country: "United States",
        currency: "USD",
        impact: "high",
        eventTime: new Date(now.getTime() + 4 * 60 * 60 * 1000), // 4 hours from now
        forecast: "180K",
        previous: "175K",
      },
      {
        title: "EUR Consumer Price Index",
        country: "Eurozone",
        currency: "EUR",
        impact: "medium",
        eventTime: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2 hours from now
        forecast: "2.4%",
        previous: "2.6%",
      },
      {
        title: "GBP Retail Sales",
        country: "United Kingdom",
        currency: "GBP",
        impact: "low",
        eventTime: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
        forecast: "0.3%",
        previous: "-0.1%",
        actual: "0.5%",
      },
    ];

    return events;
  }

  async shouldPauseTrading(symbol: string): Promise<boolean> {
    const events = await storage.getUpcomingEconomicEvents();
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Check for high impact events affecting the currency pair
    const currencyPair = this.extractCurrencies(symbol);
    
    for (const event of events) {
      if (event.impact === "high" && currencyPair.includes(event.currency)) {
        const eventTime = new Date(event.eventTime);
        
        // Pause trading 60 minutes before and after high impact events
        if (eventTime >= oneHourAgo && eventTime <= oneHourFromNow) {
          return true;
        }
      }
    }

    return false;
  }

  private extractCurrencies(symbol: string): string[] {
    // Extract currencies from symbol (e.g., EURUSD -> [EUR, USD])
    if (symbol.length >= 6) {
      return [symbol.substring(0, 3), symbol.substring(3, 6)];
    }
    return [];
  }

  async getUpcomingHighImpactEvents(): Promise<EconomicEvent[]> {
    const events = await storage.getUpcomingEconomicEvents();
    return events.filter(event => 
      event.impact === "high" && 
      this.highImpactEvents.some(highImpact => 
        event.title.includes(highImpact)
      )
    );
  }

  async markEventComplete(eventId: string, actualValue: string): Promise<void> {
    // In production, this would update the event with actual values
    console.log(`Event ${eventId} completed with actual value: ${actualValue}`);
  }

  getEventRiskLevel(event: EconomicEvent): "low" | "medium" | "high" {
    if (this.highImpactEvents.some(highImpact => event.title.includes(highImpact))) {
      return "high";
    }
    return event.impact as "low" | "medium" | "high";
  }
}

export const economicCalendar = new EconomicCalendarService();
