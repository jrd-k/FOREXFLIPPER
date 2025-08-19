import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Layers, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Trade } from "@shared/schema";

interface ActivePositionsProps {
  trades: Trade[];
  accountId: string | null;
}

export default function ActivePositions({ trades, accountId }: ActivePositionsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const closePositionMutation = useMutation({
    mutationFn: async ({ tradeId, exitPrice, pnl }: { tradeId: string; exitPrice: string; pnl: string }) => {
      return apiRequest("POST", `/api/accounts/${accountId}/trades/${tradeId}/close`, {
        exitPrice,
        pnl,
      });
    },
    onSuccess: () => {
      toast({
        title: "Position Closed",
        description: "The position has been successfully closed.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts", accountId, "trades/open"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to close position.",
        variant: "destructive",
      });
    },
  });

  const handleClosePosition = (trade: Trade) => {
    closePositionMutation.mutate({
      tradeId: trade.id,
      exitPrice: trade.currentPrice || trade.entryPrice,
      pnl: trade.pnl || "0",
    });
  };

  return (
    <Card className="bg-trading-panel border-slate-700">
      <CardHeader className="border-b border-slate-700">
        <CardTitle className="text-lg font-semibold text-white flex items-center">
          <Layers className="mr-2" size={20} />
          Active Positions
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {trades.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-400">No active positions</p>
          </div>
        ) : (
          <div className="space-y-4">
            {trades.map((trade) => (
              <div key={trade.id} className="border border-slate-600 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="font-medium text-white" data-testid={`position-symbol-${trade.symbol}`}>
                      {trade.symbol}
                    </span>
                    <span 
                      className={`text-xs px-2 py-1 rounded-full ${
                        trade.direction === 'long' 
                          ? 'bg-profit-green/10 text-profit-green' 
                          : 'bg-loss-red/10 text-loss-red'
                      }`}
                    >
                      {trade.direction.toUpperCase()}
                    </span>
                  </div>
                  <span 
                    className={`font-semibold ${
                      parseFloat(trade.pnl || "0") >= 0 
                        ? 'text-profit-green' 
                        : 'text-loss-red'
                    }`}
                    data-testid={`position-pnl-${trade.symbol}`}
                  >
                    {parseFloat(trade.pnl || "0") >= 0 ? '+' : ''}${parseFloat(trade.pnl || "0").toFixed(2)}
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                  <div>
                    <p className="text-slate-400 text-xs">Entry</p>
                    <p className="text-white" data-testid={`position-entry-${trade.symbol}`}>
                      {parseFloat(trade.entryPrice).toFixed(trade.symbol.includes('JPY') ? 2 : 5)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">Current</p>
                    <p className="text-white" data-testid={`position-current-${trade.symbol}`}>
                      {parseFloat(trade.currentPrice || trade.entryPrice).toFixed(trade.symbol.includes('JPY') ? 2 : 5)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">Size</p>
                    <p className="text-white" data-testid={`position-size-${trade.symbol}`}>
                      {parseFloat(trade.lotSize).toFixed(2)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-400">
                    SL: <span className="text-loss-red">{parseFloat(trade.stopLoss || "0").toFixed(trade.symbol.includes('JPY') ? 2 : 5)}</span> | 
                    TP: <span className="text-profit-green">{parseFloat(trade.takeProfit || "0").toFixed(trade.symbol.includes('JPY') ? 2 : 5)}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleClosePosition(trade)}
                    disabled={closePositionMutation.isPending}
                    className="text-slate-400 hover:text-white p-1"
                    data-testid={`button-close-position-${trade.symbol}`}
                  >
                    <X size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
