import React, { memo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Settings, 
  Activity,
  Target,
  Shield,
  Clock,
  Percent
} from 'lucide-react';

const Sidebar = memo(({ 
  activeView, 
  onViewChange, 
  signalStats,
  marketData 
}) => {
  const menuItems = [
    {
      id: 'signals',
      label: 'Live Signals',
      icon: TrendingUp,
      badge: signalStats?.active || 0
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: BarChart3
    },
    {
      id: 'performance',
      label: 'Performance',
      icon: Target,
      badge: `${signalStats?.winRate || 0}%`
    },
    {
      id: 'risk',
      label: 'Risk Monitor',
      icon: Shield
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings
    }
  ];

  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
      {/* Market Summary */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Market Summary</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600">NIFTY</span>
            <div className="text-right">
              <div className="text-sm font-medium">
                ₹{marketData?.NIFTY?.price?.toFixed(2) || '--'}
              </div>
              <div className={`text-xs ${
                (marketData?.NIFTY?.changePercent || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {(marketData?.NIFTY?.changePercent || 0) >= 0 ? '+' : ''}
                {marketData?.NIFTY?.changePercent?.toFixed(2) || 0}%
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600">BANKNIFTY</span>
            <div className="text-right">
              <div className="text-sm font-medium">
                ₹{marketData?.BANKNIFTY?.price?.toFixed(2) || '--'}
              </div>
              <div className={`text-xs ${
                (marketData?.BANKNIFTY?.changePercent || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {(marketData?.BANKNIFTY?.changePercent || 0) >= 0 ? '+' : ''}
                {marketData?.BANKNIFTY?.changePercent?.toFixed(2) || 0}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Signal Stats */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Signal Stats</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white p-2 rounded border">
            <div className="text-lg font-bold text-blue-600">
              {signalStats?.active || 0}
            </div>
            <div className="text-xs text-gray-600">Active</div>
          </div>
          <div className="bg-white p-2 rounded border">
            <div className="text-lg font-bold text-green-600">
              {signalStats?.winRate || 0}%
            </div>
            <div className="text-xs text-gray-600">Win Rate</div>
          </div>
          <div className="bg-white p-2 rounded border">
            <div className="text-lg font-bold text-gray-900">
              {signalStats?.total || 0}
            </div>
            <div className="text-xs text-gray-600">Total</div>
          </div>
          <div className="bg-white p-2 rounded border">
            <div className={`text-lg font-bold ${
              (signalStats?.totalPnL || 0) >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              ₹{Math.abs(signalStats?.totalPnL || 0).toFixed(0)}
            </div>
            <div className="text-xs text-gray-600">P&L</div>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => onViewChange(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      isActive
                        ? 'bg-blue-200 text-blue-800'
                        : 'bg-gray-200 text-gray-700'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <Clock className="h-3 w-3" />
          <span>Last Update: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </aside>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;