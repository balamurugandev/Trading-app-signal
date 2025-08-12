import React, { memo, useState, useMemo, useCallback } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  Activity, 
  Clock,
  Filter,
  Settings,
  BarChart3,
  Target,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const OptimizedSidebar = memo(({ 
  selectedSymbol, 
  timeframe, 
  onSymbolChange, 
  onTimeframeChange,
  marketData = {},
  liveMarketData = {}
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const symbols = useMemo(() => ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'SENSEX', 'BITCOIN', 'SOLANA'], []);
  const timeframes = useMemo(() => ['1m', '3m', '5m', '15m', '1h'], []);

  const getMarketStatus = useCallback((symbol) => {
    // Check if it's a crypto symbol with live data
    if ((symbol === 'BITCOIN' || symbol === 'SOLANA') && liveMarketData[symbol]) {
      const liveData = liveMarketData[symbol];
      return {
        price: liveData.price || '--',
        change: liveData.change || 0,
        changePercent: liveData.changePercent || 0,
        isLive: true,
        lastUpdate: liveData.lastUpdate
      };
    }

    // Use context data for other symbols
    const data = marketData[symbol];
    if (!data || !data['1m'] || !data['1m'].data) {
      return { price: '--', change: 0, changePercent: 0, isLive: false };
    }
    
    const symbolData = data['1m'].data;
    return {
      price: symbolData.close || '--',
      change: symbolData.change || 0,
      changePercent: symbolData.changePercent || 0,
      isLive: false
    };
  }, [marketData, liveMarketData]);

  const handleCollapse = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  const marketOverviewData = useMemo(() => {
    return symbols.map(symbol => ({
      symbol,
      status: getMarketStatus(symbol)
    }));
  }, [symbols, getMarketStatus]);

  if (isCollapsed) {
    return (
      <aside className="w-16 bg-white border-r border-gray-200 p-4 flex flex-col items-center space-y-4 fixed h-full z-30">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCollapse}
          className="w-8 h-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        
        <div className="flex flex-col space-y-2">
          {symbols.map((symbol) => (
            <Button
              key={symbol}
              variant={selectedSymbol === symbol ? "default" : "ghost"}
              size="sm"
              onClick={() => onSymbolChange(symbol)}
              className="w-8 h-8 p-0 text-xs"
              title={symbol}
            >
              {symbol.charAt(0)}
            </Button>
          ))}
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-200 p-4 space-y-6 overflow-y-auto fixed h-full z-30">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Controls</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCollapse}
          className="w-8 h-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Symbol Selection */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700 flex items-center">
          <Target className="h-4 w-4 mr-2" />
          Symbols
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {symbols.map((symbol) => {
            const status = getMarketStatus(symbol);
            return (
              <Card 
                key={symbol}
                className={`p-3 cursor-pointer transition-all hover:shadow-md ${
                  selectedSymbol === symbol 
                    ? 'ring-2 ring-blue-500 bg-blue-50' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => onSymbolChange(symbol)}
              >
                <div className="text-center">
                  <div className="text-sm font-semibold text-gray-900">
                    {symbol}
                  </div>
                  <div className="text-xs font-mono text-gray-600">
                    ₹{typeof status.price === 'number' ? status.price.toFixed(2) : status.price}
                  </div>
                  <div className={`text-xs font-medium ${
                    status.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {status.changePercent >= 0 ? '+' : ''}{status.changePercent.toFixed(2)}%
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
        
        <Button
          variant={selectedSymbol === 'ALL' ? "default" : "outline"}
          size="sm"
          onClick={() => onSymbolChange('ALL')}
          className="w-full"
        >
          All Symbols
        </Button>
      </div>

      {/* Timeframe Selection */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700 flex items-center">
          <Clock className="h-4 w-4 mr-2" />
          Timeframe
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {timeframes.map((tf) => (
            <Button
              key={tf}
              variant={timeframe === tf ? "default" : "outline"}
              size="sm"
              onClick={() => onTimeframeChange(tf)}
              className="text-xs"
            >
              {tf}
            </Button>
          ))}
        </div>
      </div>

      {/* Market Overview */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700 flex items-center">
          <Activity className="h-4 w-4 mr-2" />
          Market Overview
        </h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {symbols.map((symbol) => {
            const status = getMarketStatus(symbol);
            const isCrypto = symbol === 'BITCOIN' || symbol === 'SOLANA';
            const currencySymbol = isCrypto ? '$' : '₹';
            
            return (
              <div key={symbol} className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    status.changePercent >= 0 ? 'bg-green-500' : 'bg-red-500'
                  } ${status.isLive ? 'animate-pulse' : ''}`} />
                  <span className="text-sm font-medium">{symbol}</span>
                  {status.isLive && (
                    <span className="text-xs bg-green-100 text-green-700 px-1 rounded">LIVE</span>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono">
                    {currencySymbol}{typeof status.price === 'number' ? status.price.toFixed(2) : status.price}
                  </div>
                  <div className={`text-xs ${
                    status.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {status.changePercent >= 0 ? '+' : ''}{status.changePercent.toFixed(2)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700 flex items-center">
          <BarChart3 className="h-4 w-4 mr-2" />
          Quick Stats
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
            <span className="text-sm text-blue-700">Active Signals</span>
            <Badge className="bg-blue-100 text-blue-800">--</Badge>
          </div>
          <div className="flex items-center justify-between p-2 bg-yellow-50 rounded">
            <span className="text-sm text-yellow-700">Avg. Hold Time</span>
            <Badge className="bg-yellow-100 text-yellow-800">--m</Badge>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="pt-4 border-t border-gray-200">
        <Button variant="ghost" size="sm" className="w-full justify-start">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>
    </aside>
  );
});

OptimizedSidebar.displayName = 'OptimizedSidebar';

export default OptimizedSidebar;