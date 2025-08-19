import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPrice(price: number, symbol: string): string {
  const decimals = symbol.includes("JPY") ? 2 : 5;
  return price.toFixed(decimals);
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function calculatePips(entryPrice: number, currentPrice: number, symbol: string): number {
  const pipFactor = symbol.includes("JPY") ? 100 : 10000;
  return Math.round((currentPrice - entryPrice) * pipFactor);
}

export function getRiskColor(riskLevel: string): string {
  switch (riskLevel.toLowerCase()) {
    case "low":
      return "text-profit-green";
    case "medium":
      return "text-warning-amber";
    case "high":
      return "text-loss-red";
    default:
      return "text-slate-400";
  }
}

export function getDirectionColor(direction: string): string {
  return direction.toLowerCase() === "long" ? "text-profit-green" : "text-loss-red";
}

export function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return "just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
}

export function isMarketOpen(): boolean {
  const now = new Date();
  const day = now.getUTCDay(); // 0 = Sunday, 1 = Monday, etc.
  const hour = now.getUTCHours();
  
  // Forex market is closed from Friday 22:00 UTC to Sunday 22:00 UTC
  if (day === 0 && hour < 22) return false; // Sunday before 22:00
  if (day === 6 && hour >= 22) return false; // Saturday after 22:00
  if (day === 6) return false; // All day Saturday
  
  return true;
}

export function getMarketSession(): string {
  const now = new Date();
  const hour = now.getUTCHours();
  
  if (hour >= 0 && hour < 8) return "Sydney";
  if (hour >= 0 && hour < 9) return "Tokyo";
  if (hour >= 8 && hour < 16) return "London";
  if (hour >= 13 && hour < 22) return "New York";
  
  return "Closed";
}
