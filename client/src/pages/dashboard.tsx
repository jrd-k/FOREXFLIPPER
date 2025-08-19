import { useQuery } from "@tanstack/react-query";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useEffect, useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import TopHeader from "@/components/layout/top-header";
import AccountOverview from "@/components/dashboard/account-overview";
import TradingChart from "@/components/dashboard/trading-chart";
import MasterTraderInsights from "@/components/dashboard/master-trader-insights";
import ActivePositions from "@/components/dashboard/active-positions";
import RiskManagement from "@/components/dashboard/risk-management";
import EconomicCalendar from "@/components/dashboard/economic-calendar";
import BrokerConnections from "@/components/dashboard/broker-connections";
import type { TradingAccount, Trade } from "@shared/schema";

export default function Dashboard() {
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const { isConnected, lastMessage } = useWebSocket();

  const { data: accounts, isLoading: accountsLoading } = useQuery({
    queryKey: ["/api/accounts"],
  });

  const { data: openTrades, refetch: refetchTrades } = useQuery({
    queryKey: ["/api/accounts", selectedAccount, "trades/open"],
    enabled: !!selectedAccount,
  });

  const { data: riskAnalysis, refetch: refetchRisk } = useQuery({
    queryKey: ["/api/accounts", selectedAccount, "risk-analysis"],
    enabled: !!selectedAccount,
  });

  const { data: performanceMetrics } = useQuery({
    queryKey: ["/api/accounts", selectedAccount, "performance"],
    enabled: !!selectedAccount,
  });

  // Set first account as selected by default
  useEffect(() => {
    if (accounts && accounts.length > 0 && !selectedAccount) {
      setSelectedAccount(accounts[0].id);
    }
  }, [accounts, selectedAccount]);

  // Refetch data when WebSocket updates are received
  useEffect(() => {
    if (lastMessage) {
      refetchTrades();
      refetchRisk();
    }
  }, [lastMessage, refetchTrades, refetchRisk]);

  if (accountsLoading) {
    return (
      <div className="min-h-screen bg-trading-dark flex items-center justify-center">
        <div className="text-white">Loading JRd-Trades...</div>
      </div>
    );
  }

  const currentAccount = accounts?.find((acc: TradingAccount) => acc.id === selectedAccount);

  return (
    <div className="flex h-screen overflow-hidden bg-trading-dark text-slate-100 font-trading">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopHeader 
          isConnected={isConnected}
          selectedAccount={selectedAccount}
        />
        
        <div className="flex-1 overflow-auto p-6">
          {/* Account Overview Cards */}
          <AccountOverview 
            account={currentAccount}
            openTrades={openTrades as Trade[] || []}
            riskAnalysis={riskAnalysis}
          />

          {/* Main Trading Interface */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <TradingChart 
                accountId={selectedAccount}
                performanceMetrics={performanceMetrics}
              />
            </div>
            <MasterTraderInsights />
          </div>

          {/* Active Positions and Risk Management */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <ActivePositions 
              trades={openTrades as Trade[] || []}
              accountId={selectedAccount}
            />
            <RiskManagement 
              riskAnalysis={riskAnalysis}
              accountId={selectedAccount}
            />
          </div>

          {/* Economic Calendar and Broker Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <EconomicCalendar />
            <BrokerConnections />
          </div>
        </div>
      </div>
    </div>
  );
}
