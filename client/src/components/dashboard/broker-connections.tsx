import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Server, Plus, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useEffect, useRef } from "react";

export default function BrokerConnections() {
  const { data: connections, isLoading } = useQuery({
    queryKey: ["/api/broker-connections"],
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mutation for testing broker connections
  const testConnectionMutation = useMutation({
    mutationFn: (connectionId: string) =>
      apiRequest("POST", `/api/broker-connections/test/${connectionId}`),
    onSuccess: () => {
      toast({
        title: "Connection Test",
        description: "All connections tested successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/broker-connections"] });
    },
    onError: () => {
      toast({
        title: "Connection Test Failed",
        description: "Some connections could not be tested.",
        variant: "destructive",
      });
    },
  });

  // --- NEW: Track closed PnL ---
  const lastBalances = useRef<{ [key: string]: number }>({});

  useEffect(() => {
    if (connections) {
      connections.forEach((conn: any) => {
        const prevBalance = lastBalances.current[conn.id];
        if (prevBalance !== undefined && prevBalance !== conn.balance) {
          const pnl = conn.balance - prevBalance;
          toast({
            title: "Position Closed",
            description: `PnL on ${conn.name}: ${pnl >= 0 ? "+" : ""}${pnl.toFixed(
              2
            )} USD`,
            variant: pnl >= 0 ? "default" : "destructive",
          });
        }
        lastBalances.current[conn.id] = conn.balance;
      });
    }
  }, [connections, toast]);

  // Status helper
  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return {
          dot: "bg-profit-green animate-pulse",
          text: "text-profit-green",
          label: "Connected",
        };
      case "standby":
        return {
          dot: "bg-warning-amber",
          text: "text-warning-amber",
          label: "Standby",
        };
      case "disconnected":
      case "offline":
        return {
          dot: "bg-slate-500",
          text: "text-slate-500",
          label: "Offline",
        };
      default:
        return {
          dot: "bg-loss-red",
          text: "text-loss-red",
          label: "Error",
        };
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-trading-panel border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-lg font-semibold text-white flex items-center">
            <Server className="mr-2" size={20} />
            Broker Connections
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="p-4 bg-slate-800 rounded-lg animate-pulse"
              >
                <div className="h-4 bg-slate-700 rounded mb-2"></div>
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
          <Server className="mr-2" size={20} />
          Broker Connections
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {connections?.map((connection: any) => {
            const statusStyle = getStatusColor(connection.status);
            return (
              <div
                key={connection.id}
                className="flex items-center justify-between p-4 bg-slate-800 rounded-lg border border-slate-600"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-3 h-3 ${statusStyle.dot} rounded-full`}
                  ></div>
                  <div>
                    <p
                      className="text-sm font-medium text-white"
                      data-testid={`broker-name-${connection.id}`}
                    >
                      {connection.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {connection.accountNumber} • $
                      {connection.balance.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`text-xs ${statusStyle.text}`}
                    data-testid={`broker-status-${connection.id}`}
                  >
                    {statusStyle.label}
                  </p>
                  <p className="text-xs text-slate-400">
                    {connection.ping
                      ? `Ping: ${connection.ping}ms`
                      : connection.status === "connected"
                      ? "Ready"
                      : "Testing"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex space-x-2">
          <Button
            className="flex-1 bg-trading-accent hover:bg-blue-600"
            size="sm"
            data-testid="button-add-broker"
          >
            <Plus className="mr-2" size={16} />
            Add Broker
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => testConnectionMutation.mutate("all")}
            disabled={testConnectionMutation.isPending}
            className="px-4 bg-slate-700 hover:bg-slate-600"
            data-testid="button-test-connections"
          >
            <RefreshCw
              size={16}
              className={testConnectionMutation.isPending ? "animate-spin" : ""}
            />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
