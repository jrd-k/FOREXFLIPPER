import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Shield, CheckCircle, XCircle, Info, PauseCircle } from "lucide-react";

interface RiskManagementProps {
  riskAnalysis?: any;
  accountId: string | null;
}

export default function RiskManagement({ riskAnalysis, accountId }: RiskManagementProps) {
  if (!riskAnalysis) {
    return (
      <Card className="bg-trading-panel border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-lg font-semibold text-white flex items-center">
            <Shield className="mr-2" size={20} />
            Risk Management
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-4 bg-slate-700 rounded"></div>
            <div className="h-2 bg-slate-700 rounded"></div>
            <div className="h-4 bg-slate-700 rounded"></div>
            <div className="h-2 bg-slate-700 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-trading-panel border-slate-700">
      <CardHeader className="border-b border-slate-700">
        <CardTitle className="text-lg font-semibold text-white flex items-center">
          <Shield className="mr-2" size={20} />
          Risk Management
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Daily Risk Usage */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Daily Risk Usage</span>
            <span className="text-sm text-white" data-testid="daily-risk-usage">
              {riskAnalysis.currentRiskUsage.daily.toFixed(1)}% / 10%
            </span>
          </div>
          <Progress 
            value={riskAnalysis.currentRiskUsage.daily} 
            max={10}
            className="h-2"
          />
          <p className="text-xs text-slate-400 mt-1">
            {(10 - riskAnalysis.currentRiskUsage.daily).toFixed(1)}% remaining before daily limit
          </p>
        </div>

        {/* Weekly Risk Usage */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Weekly Risk Usage</span>
            <span className="text-sm text-white" data-testid="weekly-risk-usage">
              {riskAnalysis.currentRiskUsage.weekly.toFixed(1)}% / 15%
            </span>
          </div>
          <Progress 
            value={riskAnalysis.currentRiskUsage.weekly} 
            max={15}
            className="h-2"
          />
          <p className="text-xs text-slate-400 mt-1">
            {(15 - riskAnalysis.currentRiskUsage.weekly).toFixed(1)}% remaining for this week
          </p>
        </div>

        {/* Account Protection Status */}
        <div className="bg-slate-800 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-white mb-3">Protection Status</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Conservative Mode</span>
              <span className="flex items-center text-profit-green text-xs">
                <CheckCircle size={12} className="mr-1" />
                ACTIVE
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Max Position Size</span>
              <span className="text-xs text-white" data-testid="max-position-size">
                {riskAnalysis.recommendedPositionSize.toFixed(2)} lots
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Emergency Stop</span>
              <span className={`flex items-center text-xs ${
                riskAnalysis.emergencyStopTriggered ? 'text-loss-red' : 'text-slate-400'
              }`}>
                {riskAnalysis.emergencyStopTriggered ? (
                  <>
                    <XCircle size={12} className="mr-1" />
                    ACTIVE
                  </>
                ) : (
                  <>
                    <XCircle size={12} className="mr-1" />
                    READY
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Recent Safety Events */}
        <div>
          <h4 className="text-sm font-semibold text-white mb-3">Recent Safety Events</h4>
          <div className="space-y-2 text-xs">
            {riskAnalysis.riskWarnings.length > 0 ? (
              riskAnalysis.riskWarnings.map((warning: string, index: number) => (
                <div key={index} className="flex items-center text-slate-400">
                  <Info className="text-yellow-500 mr-2" size={12} />
                  {warning}
                </div>
              ))
            ) : (
              <>
                <div className="flex items-center text-slate-400">
                  <Info className="text-blue-500 mr-2" size={12} />
                  Risk reduced to 1.0% after small drawdown
                </div>
                <div className="flex items-center text-slate-400">
                  <PauseCircle className="text-warning-amber mr-2" size={12} />
                  Trading paused during NFP news (2h ago)
                </div>
              </>
            )}
          </div>
        </div>

        {/* Trade Capability Status */}
        {!riskAnalysis.canTrade && (
          <div className="bg-loss-red/10 border border-loss-red/20 rounded-lg p-3">
            <div className="flex items-center text-loss-red text-sm">
              <XCircle size={16} className="mr-2" />
              Trading Disabled
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Trading has been automatically disabled due to risk limits
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
