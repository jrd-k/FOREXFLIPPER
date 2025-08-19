import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Expand } from "lucide-react";

interface TradingChartProps {
  accountId: string | null;
  performanceMetrics?: any;
}

export default function TradingChart({ accountId, performanceMetrics }: TradingChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const loadChart = async () => {
      // Dynamically import Chart.js to avoid SSR issues
      const { Chart, LineElement, CategoryScale, LinearScale, PointElement, LineController, Tooltip, Legend } = await import('chart.js');
      
      Chart.register(LineElement, CategoryScale, LinearScale, PointElement, LineController, Tooltip, Legend);

      const ctx = canvasRef.current!.getContext('2d');
      
      if (chartRef.current) {
        chartRef.current.destroy();
      }

      chartRef.current = new Chart(ctx!, {
        type: 'line',
        data: {
          labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
          datasets: [{
            label: 'Account Growth',
            data: [1000, 1025, 1048, 1089, 1156, 1247],
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              mode: 'index',
              intersect: false,
              backgroundColor: 'rgba(15, 23, 42, 0.9)',
              titleColor: '#f8fafc',
              bodyColor: '#cbd5e1',
              borderColor: '#334155',
              borderWidth: 1,
              callbacks: {
                label: function(context) {
                  return `Balance: $${context.parsed.y.toLocaleString()}`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: false,
              grid: {
                color: '#334155'
              },
              ticks: {
                color: '#94a3b8',
                callback: function(value) {
                  return '$' + value;
                }
              }
            },
            x: {
              grid: {
                color: '#334155'
              },
              ticks: {
                color: '#94a3b8'
              }
            }
          },
          interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
          }
        }
      });
    };

    loadChart();

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [performanceMetrics]);

  return (
    <Card className="bg-trading-panel border-slate-700">
      <CardHeader className="border-b border-slate-700">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-white">
            Performance Analytics
          </CardTitle>
          <div className="flex items-center space-x-3">
            <Select defaultValue="1D">
              <SelectTrigger className="bg-slate-800 border-slate-600 text-white w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1D">1D</SelectItem>
                <SelectItem value="1W">1W</SelectItem>
                <SelectItem value="1M">1M</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-slate-400 hover:text-white p-1"
              data-testid="button-expand-chart"
            >
              <Expand size={16} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="h-64 bg-slate-800 rounded-lg">
          <canvas 
            ref={canvasRef}
            className="max-w-full max-h-full"
            data-testid="performance-chart"
          />
        </div>
      </CardContent>
    </Card>
  );
}
