import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";
import type { MasterTraderSignal } from "@shared/schema";

export default function MasterTraderInsights() {
  const { data: signals, isLoading } = useQuery({
    queryKey: ["/api/master-trader-signals"],
  });

  if (isLoading) {
    return (
      <Card className="bg-trading-panel border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-lg font-semibold text-white flex items-center">
            <Star className="text-yellow-400 mr-2" size={20} />
            Master Trader Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border border-slate-600 rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-slate-700 rounded mb-2"></div>
                <div className="h-3 bg-slate-700 rounded mb-2"></div>
                <div className="h-3 bg-slate-700 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-trading-panel border-slate-700">
      <CardHeader className="border-b border-slate-700">
        <CardTitle className="text-lg font-semibold text-white flex items-center">
          <Star className="text-yellow-400 mr-2" size={20} />
          Master Trader Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {signals?.map((signal: MasterTraderSignal) => (
          <div key={signal.id} className="border border-slate-600 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-white">
                {signal.symbol} {signal.direction.toUpperCase()}
              </span>
              <span 
                className={`text-xs px-2 py-1 rounded-full ${
                  signal.pips > 0 
                    ? 'bg-profit-green/10 text-profit-green' 
                    : signal.pips < 0
                    ? 'bg-loss-red/10 text-loss-red'
                    : 'bg-blue-500/10 text-blue-500'
                }`}
                data-testid={`signal-pips-${signal.symbol}`}
              >
                {signal.pips > 0 ? `+${signal.pips}` : signal.pips} 
                {signal.status === 'watching' ? ' Watching' : ' pips'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-2">{signal.description}</p>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">
                Confidence: 
                <span 
                  className={`ml-1 ${
                    signal.confidence >= 80 
                      ? 'text-profit-green' 
                      : signal.confidence >= 60 
                      ? 'text-warning-amber' 
                      : 'text-blue-500'
                  }`}
                >
                  {signal.confidence}%
                </span>
              </span>
              <span className="text-slate-400">
                Risk: 
                <span 
                  className={`ml-1 ${
                    signal.riskLevel === 'low' 
                      ? 'text-profit-green' 
                      : signal.riskLevel === 'medium' 
                      ? 'text-warning-amber' 
                      : 'text-loss-red'
                  }`}
                >
                  {signal.riskLevel.charAt(0).toUpperCase() + signal.riskLevel.slice(1)}
                </span>
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
