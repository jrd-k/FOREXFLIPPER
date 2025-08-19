import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Moon, Sun, StopCircle, PauseCircle, PlayCircle } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";

interface TopHeaderProps {
  isConnected: boolean;
  selectedAccount: string | null;
}

export default function TopHeader({ isConnected, selectedAccount }: TopHeaderProps) {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [lastUpdate, setLastUpdate] = useState(new Date().toLocaleTimeString());
  const [tradingPaused, setTradingPaused] = useState(false);

  const emergencyStopMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/accounts/${selectedAccount}/emergency-stop`),
    onSuccess: () => {
      toast({
        title: "Emergency Stop Activated",
        description: "All trading has been halted and positions closed.",
        variant: "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to activate emergency stop.",
        variant: "destructive",
      });
    },
  });

  const pauseResumeMutation = useMutation({
    mutationFn: () => {
      const endpoint = tradingPaused ? "resume-trading" : "pause-trading";
      return apiRequest("POST", `/api/accounts/${selectedAccount}/${endpoint}`);
    },
    onSuccess: () => {
      setTradingPaused(!tradingPaused);
      toast({
        title: tradingPaused ? "Trading Resumed" : "Trading Paused",
        description: tradingPaused 
          ? "Automated trading has been resumed."
          : "Automated trading has been paused.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${tradingPaused ? "resume" : "pause"} trading.`,
        variant: "destructive",
      });
    },
  });

  // Update time every second
  useState(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(interval);
  });

  return (
    <header className="bg-trading-panel border-b border-slate-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <h2 className="text-2xl font-semibold text-white" data-testid="page-title">
            Trading Dashboard
          </h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm">
              <span 
                className={`w-2 h-2 rounded-full animate-pulse ${
                  isConnected ? "bg-profit-green" : "bg-loss-red"
                }`}
              />
              <span className="text-slate-300">
                {isConnected ? "Live Trading" : "Disconnected"}
              </span>
            </div>
            <div className="text-sm text-slate-400">
              Last Update: <span data-testid="last-update">{lastUpdate}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Emergency Controls */}
          <Button
            variant="destructive"
            size="sm"
            onClick={() => emergencyStopMutation.mutate()}
            disabled={!selectedAccount || emergencyStopMutation.isPending}
            data-testid="button-emergency-stop"
            className="bg-loss-red hover:bg-red-600"
          >
            <StopCircle size={16} className="mr-2" />
            Emergency Stop
          </Button>
          
          <Button
            variant={tradingPaused ? "default" : "secondary"}
            size="sm"
            onClick={() => pauseResumeMutation.mutate()}
            disabled={!selectedAccount || pauseResumeMutation.isPending}
            data-testid="button-pause-resume"
            className={
              tradingPaused 
                ? "bg-profit-green hover:bg-green-600" 
                : "bg-warning-amber hover:bg-yellow-600"
            }
          >
            {tradingPaused ? (
              <>
                <PlayCircle size={16} className="mr-2" />
                Resume
              </>
            ) : (
              <>
                <PauseCircle size={16} className="mr-2" />
                Pause
              </>
            )}
          </Button>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            data-testid="button-theme-toggle"
            className="p-2 text-slate-400 hover:text-white"
          >
            {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
          </Button>
        </div>
      </div>
    </header>
  );
}
