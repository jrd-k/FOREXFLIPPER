import { Home, TrendingUp, Users, Shield, Calendar, Settings } from "lucide-react";

const navigationItems = [
  { icon: Home, label: "Dashboard", href: "#", active: true },
  { icon: TrendingUp, label: "Trading", href: "#", active: false },
  { icon: Users, label: "Master Traders", href: "#", active: false },
  { icon: Shield, label: "Risk Management", href: "#", active: false },
  { icon: Calendar, label: "Economic Calendar", href: "#", active: false },
  { icon: Settings, label: "Settings", href: "#", active: false },
];

export default function Sidebar() {
  return (
    <div className="w-64 bg-trading-panel border-r border-slate-700 flex flex-col">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-trading-accent to-blue-600 rounded-lg flex items-center justify-center">
            <TrendingUp className="text-white text-lg" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white" data-testid="brand-title">JRd-Trades</h1>
            <p className="text-xs text-slate-400">Professional Trading</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigationItems.map((item, index) => (
            <li key={index}>
              <a
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  item.active
                    ? "bg-trading-accent/10 text-trading-accent"
                    : "text-slate-300 hover:bg-slate-700"
                }`}
                data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Account Status */}
      <div className="p-4 border-t border-slate-700">
        <div className="bg-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Account Protection</span>
            <span className="flex items-center text-profit-green text-xs">
              <Shield size={12} className="mr-1" />
              ACTIVE
            </span>
          </div>
          <div className="text-xs text-slate-400">
            Daily Limit: <span className="text-slate-200">8.5%</span> used
          </div>
        </div>
      </div>
    </div>
  );
}
