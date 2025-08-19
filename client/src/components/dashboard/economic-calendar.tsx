import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Info } from "lucide-react";
import type { EconomicEvent } from "@shared/schema";

export default function EconomicCalendar() {
  const { data: events, isLoading } = useQuery<EconomicEvent[]>({
    queryKey: ["/api/economic-events"],
    queryFn: async () => {
      const res = await fetch("/api/economic-events");
      if (!res.ok) throw new Error("Failed to fetch economic events");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <Card className="bg-trading-panel border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-white flex items-center">
              <Calendar className="mr-2" size={20} />
              Economic Calendar
            </CardTitle>
            <span className="text-xs bg-warning-amber/10 text-warning-amber px-2 py-1 rounded-full">
              Loading...
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-3 bg-slate-800 rounded-lg animate-pulse">
                <div className="h-4 bg-slate-700 rounded mb-2"></div>
                <div className="h-3 bg-slate-700 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getImpactColor = (impact: string) => {
    switch (impact.toLowerCase()) {
      case "high":
        return {
          bg: "bg-loss-red/10 border-loss-red/20",
          dot: "bg-loss-red",
          badge: "bg-loss-red text-white",
          text: "HIGH",
        };
      case "medium":
        return {
          bg: "bg-warning-amber/10 border-warning-amber/20",
          dot: "bg-warning-amber",
          badge: "bg-warning-amber text-white",
          text: "MED",
        };
      case "low":
        return {
          bg: "bg-blue-500/10 border-blue-500/20",
          dot: "bg-blue-500",
          badge: "bg-blue-500 text-white",
          text: "LOW",
        };
      default:
        return {
          bg: "bg-slate-800",
          dot: "bg-slate-500",
          badge: "bg-slate-500 text-white",
          text: "UNK",
        };
    }
  };

  // Auto-pause logic: check if any HIGH impact event is within +/- 60min
  const isAutoPauseActive = events?.some((event) => {
    if (event.impact.toLowerCase() !== "high") return false;

    const eventTime = new Date(event.eventTime).getTime();
    const now = Date.now();

    return Math.abs(now - eventTime) <= 60 * 60 * 1000;
  });

  return (
    <Card className="bg-trading-panel border-slate-700">
      <CardHeader className="border-b border-slate-700">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-white flex items-center">
            <Calendar className="mr-2" size={20} />
            Economic Calendar
          </CardTitle>
          {isAutoPauseActive && (
            <span
              data-testid="auto-pause-indicator"
              className="text-xs bg-warning-amber/10 text-warning-amber px-2 py-1 rounded-full"
            >
              Auto-Pause Active
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {events?.map((event: EconomicEvent) => {
            const impactStyle = getImpactColor(event.impact);
            return (
              <div
                key={event.id}
                className={`flex items-center justify-between p-3 ${impactStyle.bg} border rounded-lg`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 ${impactStyle.dot} rounded-full`}></div>
                  <div>
                    <p
                      className="text-sm font-medium text-white"
                      data-testid={`event-title-${event.id}`}
                    >
                      {event.title}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(event.eventTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      Local •{" "}
                      {new Date(event.eventTime).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "America/New_York",
                      })}{" "}
                      EST
                    </p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${impactStyle.badge}`}>
                  {impactStyle.text}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-4 p-3 bg-slate-800 rounded-lg">
          <p className="text-xs text-slate-400 flex items-center">
            <Info className="mr-2" size={12} />
            Trading will pause 60min before/after HIGH impact events
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
