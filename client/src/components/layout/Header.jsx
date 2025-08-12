import React, { memo, useState, useEffect, useMemo } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  Activity, 
  Wifi, 
  WifiOff, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  Settings,
  Bell,
  User
} from 'lucide-react';

const Header = memo(({ connectionStatus, stats = {}, lastUpdate }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const connectionBadge = useMemo(() => {
    switch (connectionStatus) {
      case 'connected':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <Wifi className="h-3 w-3 mr-1" />
            Connected
          </Badge>
        );
      case 'connecting':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Activity className="h-3 w-3 mr-1 animate-spin" />
            Connecting
          </Badge>
        );
      case 'error':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <WifiOff className="h-3 w-3 mr-1" />
            Disconnected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            <WifiOff className="h-3 w-3 mr-1" />
            Unknown
          </Badge>
        );
    }
  }, [connectionStatus]);

  const formattedTime = useMemo(() => {
    return currentTime.toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour12: true,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }, [currentTime]);

  const formattedLastUpdate = useMemo(() => {
    if (!lastUpdate) return 'Never';
    const now = new Date();
    const diff = Math.floor((now - lastUpdate) / 1000);
    
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return lastUpdate.toLocaleTimeString('en-IN', { hour12: true });
  }, [lastUpdate]);

  const pnlColor = useMemo(() => {
    return (stats.totalPnL || 0) >= 0 ? 'text-green-600' : 'text-red-600';
  }, [stats.totalPnL]);

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-40 backdrop-blur-sm bg-white/95">
      <div className="flex items-center justify-between">
        {/* Left Section - Logo and Title */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">NSE Scalping Signals</h1>
              <p className="text-xs text-gray-500">Real-time Trading Dashboard</p>
            </div>
          </div>
        </div>

        {/* Center Section - Stats */}
        <div className="hidden md:flex items-center space-x-6">
          <div className="flex items-center space-x-1 text-sm">
            <Activity className="h-4 w-4 text-blue-600" />
            <span className="text-gray-600">Signals:</span>
            <span className="font-semibold text-gray-900">{stats.totalSignals || 0}</span>
          </div>
          
          <div className="flex items-center space-x-1 text-sm">
            <Clock className="h-4 w-4 text-orange-600" />
            <span className="text-gray-600">Active:</span>
            <span className="font-semibold text-orange-600">{stats.activeSignals || 0}</span>
          </div>
          
          <div className="flex items-center space-x-1 text-sm">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-gray-600">Success:</span>
            <span className="font-semibold text-green-600">{stats.successRate || 0}%</span>
          </div>
          
          <div className="flex items-center space-x-1 text-sm">
            <AlertTriangle className={`h-4 w-4 ${pnlColor}`} />
            <span className="text-gray-600">P&L:</span>
            <span className={`font-semibold ${pnlColor}`}>
              {(stats.totalPnL || 0) >= 0 ? '+' : ''}{stats.totalPnL || 0}%
            </span>
          </div>
        </div>

        {/* Right Section - Status and Controls */}
        <div className="flex items-center space-x-4">
          <div className="text-right text-sm">
            <div className="font-mono text-gray-900">{formattedTime}</div>
            <div className="text-xs text-gray-500">
              Updated: {formattedLastUpdate}
            </div>
          </div>
          
          {connectionBadge}
          
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Bell className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <User className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
});

Header.displayName = 'Header';

export default Header;