import React, { useState, useMemo, useCallback, useEffect } from 'react';
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
  ChevronRight,
  Zap,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { format } from 'date-fns';
import CollapsedSidebar from './CollapsedSidebar';

const OptimizedSidebar = ({ 
  selectedSymbol, 
  timeframe, 
  onSymbolChange, 
  onTimeframeChange,
  marketData = {},
  liveMarketData = {},
  cryptoPrices = {},
  updateCounter = 0
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);

  // Force component to re-render every second
  useEffect(() => {
    const interval = setInterval(() => {
      setForceUpdate(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const symbols = useMemo(() => ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'SENSEX', 'BITCOIN', 'SOLANA'], []);
  const timeframes = useMemo(() => ['1m', '3m', '5m', '15m', '1h'], []);

  const getMarketStatus = (symbol) => {
    // Force crypto symbols to always show live status
    const isCrypto = symbol === 'BITCOIN' || symbol === 'SOLANA';
    
    // For crypto, use the dedicated cryptoPrices state OR fallback to liveMarketData
    if (isCrypto) {
      let cryptoData = null;
      
      // Try cryptoPrices first, then liveMarketData
      if (cryptoPrices[symbol] && cryptoPrices[symbol].price > 0) {
        cryptoData = cryptoPrices[symbol];
      } else if (liveMarketData[symbol] && liveMarketData[symbol].price > 0) {
        cryptoData = liveMarketData[symbol];
      }
      
      if (cryptoData) {
        const changePercent = cryptoData.changePercent || 0;
        const isPositive = changePercent >= 0;
        const price = cryptoData.price || 0;
        const change = cryptoData.change || 0;
        
        // Format price - all prices from server are in INR
        const formatPrice = (value) => {
          return `₹${value.toFixed(2)}`;
        };
        
        return {
          symbol,
          price: price ? formatPrice(price) : '--',
          rawPrice: price,
          change: change,
          changePercent,
          isLive: true,
          isCrypto: true,
          isPositive,
          lastUpdate: new Date(),
          dataSource: 'live',
          icon: <Zap className="h-3 w-3 text-green-500 animate-pulse" />
        };
      }
    }
    
    // For non-crypto, check if we have live data for this symbol
    if (liveMarketData[symbol]) {
      const liveData = liveMarketData[symbol];
      const changePercent = liveData.changePercent || 0;
      const isPositive = changePercent >= 0;
      const price = liveData.price || 0;
      const change = liveData.change || 0;
      
      // Format price based on asset type
      const formatPrice = (value) => {
        // All prices from server are in INR, including crypto
        return new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(value);
      };
      
      return {
        symbol,
        price: price ? formatPrice(price) : '--',
        rawPrice: price,
        change: change,
        changePercent,
        isLive: isCrypto ? true : (liveData.isLive || false),
        isCrypto: isCrypto,
        isPositive,
        lastUpdate: liveData.lastUpdate ? new Date(liveData.lastUpdate) : null,
        dataSource: isCrypto ? 'live' : (liveData.dataSource || 'unknown'),
        icon: isCrypto ? <Zap className="h-3 w-3 text-green-500 animate-pulse" /> : 
              (liveData.dataSource === 'live') ? <Zap className="h-3 w-3 text-green-500" /> : 
              <Clock className="h-3 w-3 text-yellow-500" />
      };
    }

    // Fallback to context data for symbols without live data
    const data = marketData[symbol];
    if (!data || !data['1m'] || !data['1m'].data) {
      return { 
        symbol,
        price: '--',
        rawPrice: 0,
        change: 0, 
        changePercent: 0, 
        isLive: false,
        isCrypto: false,
        isPositive: false,
        lastUpdate: null,
        dataSource: 'unavailable'
      };
    }
    
    const symbolData = data['1m'].data;
    const price = symbolData.close || 0;
    const change = symbolData.change || 0;
    const changePercent = symbolData.changePercent || 0;
    const isPositive = change >= 0;
    
    return {
      symbol,
      price: price ? new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(price) : '--',
      rawPrice: price,
      change,
      changePercent,
      isLive: false,
      isCrypto: false,
      isPositive,
      lastUpdate: new Date(),
      dataSource: 'context'
    };
  };

  const handleCollapse = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  const marketOverviewData = symbols.map(symbol => ({
    symbol,
    status: getMarketStatus(symbol)
  }));

  if (isCollapsed) {
    return (
      <CollapsedSidebar
        symbols={symbols}
        selectedSymbol={selectedSymbol}
        onSymbolChange={onSymbolChange}
        handleCollapse={handleCollapse}
        getMarketStatus={getMarketStatus}
      />
    );
  }

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto fixed h-full z-30 flex flex-col space-y-3">
      {/* Header */}
      <div className="flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Controls</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Symbol Selection */}
      <div className="flex-shrink-0">
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center mb-2">
          <Target className="h-3 w-3 mr-1.5 flex-shrink-0" />
          <span>Symbols</span>
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {symbols.map((symbol) => {
            const isCrypto = symbol === 'BITCOIN' || symbol === 'SOLANA';
            
            // For crypto, use direct values to force updates
            let price = '--';
            let change = 0;
            let changePercent = 0;
            let dataSource = 'unknown';
            
            if (isCrypto && cryptoPrices[symbol]) {
              price = `₹${cryptoPrices[symbol].price.toFixed(2)}`;
              change = cryptoPrices[symbol].change;
              changePercent = cryptoPrices[symbol].changePercent;
              dataSource = 'live';
            } else if (isCrypto && liveMarketData[symbol]) {
              price = `₹${liveMarketData[symbol].price.toFixed(2)}`;
              change = liveMarketData[symbol].change;
              changePercent = liveMarketData[symbol].changePercent;
              dataSource = 'live';
            } else if (!isCrypto && liveMarketData[symbol]) {
              price = `₹${liveMarketData[symbol].price.toFixed(2)}`;
              change = liveMarketData[symbol].change;
              changePercent = liveMarketData[symbol].changePercent;
              dataSource = liveMarketData[symbol].dataSource || 'unknown';
            }
            
            return (
              <Card 
                key={`${symbol}-${Date.now()}-${Math.random()}`}
                className={`p-2 cursor-pointer transition-all border ${
                  selectedSymbol === symbol 
                    ? 'ring-1 ring-blue-500 bg-blue-50 border-blue-200' 
                    : 'hover:bg-gray-100 border-gray-200'
                }`}
                onClick={() => onSymbolChange(symbol)}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-gray-900">
                      {symbol}
                    </div>
                    <div className="flex items-center">
                      {isCrypto ? (
                        <Zap className="h-3 w-3 text-green-500 animate-pulse" />
                      ) : (
                        dataSource === 'live' ? (
                          <Zap className="h-3 w-3 text-green-500" />
                        ) : (
                          <Clock className="h-3 w-3 text-yellow-500" />
                        )
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs font-medium" key={`price-${symbol}-${updateCounter}`}>
                      {price}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className={`text-xs font-medium ${
                      changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                    }`} key={`change-${symbol}-${updateCounter}`}>
                      {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`text-xs px-1 py-0 h-4 ${
                        (isCrypto || dataSource === 'live') ? 'text-green-600 border-green-300' : 
                        dataSource === 'last_close' ? 'text-yellow-600 border-yellow-300' :
                        'text-gray-500 border-gray-300'
                      }`}
                      key={`badge-${symbol}-${updateCounter}`}
                    >
                      {(isCrypto || dataSource === 'live') ? 'LIVE' : 
                       dataSource === 'last_close' ? 'CLOSE' : 'DATA'}
                    </Badge>
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
          className="w-full mt-2 text-xs"
        >
          All Symbols
        </Button>
      </div>

      {/* Timeframe Selection */}
      <div className="flex-shrink-0">
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center mb-2">
          <Clock className="h-3 w-3 mr-1.5 flex-shrink-0" />
          <span>Timeframe</span>
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
      <div className="flex-1 flex flex-col min-h-0">
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center mb-2">
          <Activity className="h-3 w-3 mr-1.5 flex-shrink-0" />
          <span>Market Overview</span>
        </h3>
        <div className="flex-1 overflow-y-auto pr-1 -mr-1">
          <div className="space-y-1">
            {symbols.map((symbol) => {
              const status = getMarketStatus(symbol);
              const isPositive = status.changePercent >= 0;
              const isCrypto = status.isCrypto;
              
              // Format price with proper currency symbol and decimal places
              const formatPrice = (price) => {
                if (price === '--') return '--';
                
                const options = {
                  style: 'currency',
                  currency: isCrypto ? 'USD' : 'INR',
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                };
                
                try {
                  return new Intl.NumberFormat(isCrypto ? 'en-US' : 'en-IN', options)
                    .format(price)
                    .replace(/^\D+/, isCrypto ? '$' : '₹');
                } catch (e) {
                  return '--';
                }
              };
              
              return (
                <div 
                  key={symbol} 
                  className={`flex items-center justify-between p-1.5 rounded hover:bg-gray-100 transition-colors ${
                    selectedSymbol === symbol ? 'bg-blue-50' : 'bg-white'
                  } w-full cursor-pointer border border-transparent hover:border-gray-200`}
                  onClick={() => onSymbolChange(symbol)}
                >
                  <div className="flex items-center min-w-0 flex-1">
                    <div 
                      className={`flex-shrink-0 w-2 h-2 rounded-full mr-1.5 ${
                        isPositive ? 'bg-green-500' : 'bg-red-500'
                      } ${status.isLive ? 'animate-pulse' : ''}`} 
                    />
                    <span className="text-xs font-medium truncate mr-1.5">{symbol}</span>
                    {status.isLive && (
                      <Badge variant="outline" className="h-3.5 px-1 text-[9px] border-green-200 text-green-700 bg-green-50 flex-shrink-0">
                        LIVE
                      </Badge>
                    )}
                  </div>
                  <div className="flex-shrink-0 ml-2">
  <div className="flex items-baseline">
    <span className="text-[10px] font-medium text-right whitespace-nowrap">
      {formatPrice(status.rawPrice || 0)}
    </span>
  </div>
  <div className={`text-[9px] font-medium text-right ${
    isPositive ? 'text-green-600' : 'text-red-600'
  }`}>
    {isPositive ? '+' : ''}{status.changePercent.toFixed(2)}%
  </div>
</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="flex-shrink-0">
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center mb-2">
          <BarChart3 className="h-3 w-3 mr-1.5 flex-shrink-0" />
          <span>Quick Stats</span>
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-100">
            <span className="text-xs text-blue-700">Active Signals</span>
            <Badge className="bg-blue-100 text-blue-800">--</Badge>
          </div>
          <div className="flex items-center justify-between p-2 bg-yellow-50 rounded border border-yellow-100">
            <span className="text-xs text-yellow-700">Avg. Hold Time</span>
            <Badge className="bg-yellow-100 text-yellow-800">--m</Badge>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="pt-2 border-t border-gray-200">
        <Button variant="ghost" size="sm" className="w-full justify-start text-xs">
          <Settings className="h-3 w-3 mr-2" />
          Settings
        </Button>
      </div>
    </div>
  );
};

export default OptimizedSidebar;
