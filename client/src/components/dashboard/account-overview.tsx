import { Wallet, TrendingUp, Shield, ArrowLeftRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { TradingAccount, Trade } from "@shared/schema";

interface AccountOverviewProps {
  account?: TradingAccount;
  openTrades: Trade[];
  riskAnalysis?: any;
}

export default function AccountOverview({ account, openTrades, riskAnalysis }: AccountOverviewProps) {
  if (!account) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-trading-panel border-slate-700">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-8 bg-slate-700 rounded mb-2"></div>
                <div className="h-4 bg-slate-700 rounded mb-1"></div>
                <div className="h-3 bg-slate-700 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const totalPnL = openTrades.reduce((sum, trade) => sum + parseFloat(trade.pnl || "0"), 0);
  const winningTrades = openTrades.filter(trade => parseFloat(trade.pnl || "0") > 0).length;
  const winRate = openTrades.length > 0 ? (winningTrades / openTrades.length) * 100 : 0;

  const cards = [
    {
      icon: Wallet,
      iconBg: "bg-trading-accent/10",
      iconColor: "text-trading-accent",
      title: "Total Equity",
      value: `$${parseFloat(account.equity).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: `Started: $${parseFloat(account.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      badge: "+12.5%",
      badgeColor: "bg-profit-green/10 text-profit-green",
    },
    {
      icon: TrendingUp,
      iconBg: "bg-profit-green/10",
      iconColor: "text-profit-green",
      title: "Daily P&L",
      value: `${totalPnL >= 0 ? '+' : ''}$${totalPnL.toFixed(2)}`,
      valueColor: totalPnL >= 0 ? "text-profit-green" : "text-loss-red",
      subtitle: `Win Rate: ${winRate.toFixed(0)}%`,
      subtitleColor: "text-profit-green",
      badge: "Today",
      badgeColor: "bg-profit-green/10 text-profit-green",
    },
    {
      icon: Shield,
      iconBg: "bg-warning-amber/10",
      iconColor: "text-warning-amber",
      title: "Current Risk/Trade",
      value: `${riskAnalysis?.recommendedPositionSize || 1.2}%`,
      subtitle: "Max: 2.0%",
      subtitleColor: "text-warning-amber",
      badge: "Conservative",
      badgeColor: "bg-warning-amber/10 text-warning-amber",
    },
    {
      icon: ArrowLeftRight,
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-500",
      title: "Open Positions",
      value: openTrades.length.toString(),
      subtitle: `Max: ${openTrades.length}/3`,
      subtitleColor: "text-blue-500",
      badge: "Active",
      badgeColor: "bg-blue-500/10 text-blue-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => (
        <Card key={index} className="bg-trading-panel border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 ${card.iconBg} rounded-lg`}>
                <card.icon className={`${card.iconColor} text-xl`} size={24} />
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${card.badgeColor}`}>
                {card.badge}
              </span>
            </div>
            <h3 
              className={`text-2xl font-bold mb-1 ${card.valueColor || 'text-white'}`}
              data-testid={`metric-${card.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
            >
              {card.value}
            </h3>
            <p className="text-sm text-slate-400 mb-2">{card.title}</p>
            <div className="text-xs text-slate-400">
              {card.subtitle && (
                <span className={card.subtitleColor}>
                  {card.subtitle}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
