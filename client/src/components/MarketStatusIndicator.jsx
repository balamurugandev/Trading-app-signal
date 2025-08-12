import React, { useState, useEffect } from 'react';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { 
  Clock, 
  TrendingUp, 
  Globe, 
  Calendar,
  Activity,
  Pause
} from 'lucide-react';
import marketStatusService from '../services/marketStatusService';

const MarketStatusIndicator = () => {
  const [marketStatus, setMarketStatus] = useState(marketStatusService.getCurrentStatus());
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Subscribe to market status updates
    const unsubscribe = marketStatusService.subscribe(setMarketStatus);

    // Update current time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(timeInterval);
    };
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour12: true,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getIndianMarketStatusColor = () => {
    if (marketStatus.indian.isOpen) {
      return marketStatus.indian.session === 'MORNING' ? 'bg-green-500' : 'bg-blue-500';
    }
    if (marketStatus.indian.isPreMarket) return 'bg-yellow-500';
    if (marketStatus.indian.isPostMarket) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getIndianMarketStatusText = () => {
    if (marketStatus.indian.isOpen) {
      return `${marketStatus.indian.session} SESSION`;
    }
    if (marketStatus.indian.isPreMarket) return 'PRE-MARKET';
    if (marketStatus.indian.isPostMarket) return 'POST-MARKET';
    if (marketStatus.indian.isWeekend) return 'WEEKEND';
    return 'CLOSED';
  };

  const getTimeUntilOpenText = () => {
    if (!marketStatus.indian.timeUntilOpen || marketStatus.indian.isOpen) return null;
    
    const { hours, minutes } = marketStatus.indian.timeUntilOpen;
    if (hours > 0) {
      return `Opens in ${hours}h ${minutes}m`;
    }
    return `Opens in ${minutes}m`;
  };

  return (
    <Card className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
      <div className="flex items-center justify-between">
        {/* Left Side - Market Status */}
        <div className="flex items-center space-x-6">
          {/* Indian Market Status */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <div className={`w-3 h-3 rounded-full ${getIndianMarketStatusColor()} ${
                marketStatus.indian.isOpen ? 'animate-pulse' : ''
              }`} />
              <TrendingUp className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">
                Indian Markets
              </div>
              <div className="text-xs text-gray-600">
                {getIndianMarketStatusText()}
                {getTimeUntilOpenText() && (
                  <span className="ml-2 text-blue-600">• {getTimeUntilOpenText()}</span>
                )}
              </div>
            </div>
          </div>

          {/* Crypto Market Status */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <Globe className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">
                Crypto Markets
              </div>
              <div className="text-xs text-gray-600">
                24/7 CONTINUOUS
              </div>
            </div>
          </div>

          {/* Live Data Indicator */}
          <div className="flex items-center space-x-2">
            <Activity className="h-4 w-4 text-green-600 animate-pulse" />
            <div>
              <div className="text-sm font-semibold text-green-700">
                Live Updates
              </div>
              <div className="text-xs text-green-600">
                Real-time data active
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Current Time */}
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-mono text-gray-900">
                {formatTime(currentTime)}
              </span>
            </div>
            <div className="text-xs text-gray-500">
              IST (Asia/Kolkata)
            </div>
          </div>

          {/* Market Status Badges */}
          <div className="flex space-x-2">
            <Badge 
              className={`text-xs ${
                marketStatus.indian.isOpen 
                  ? 'bg-green-100 text-green-800 border-green-200' 
                  : 'bg-red-100 text-red-800 border-red-200'
              }`}
            >
              {marketStatus.indian.isOpen ? (
                <>
                  <Activity className="h-3 w-3 mr-1" />
                  NSE LIVE
                </>
              ) : (
                <>
                  <Pause className="h-3 w-3 mr-1" />
                  NSE CLOSED
                </>
              )}
            </Badge>
            
            <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
              <Globe className="h-3 w-3 mr-1" />
              CRYPTO LIVE
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default MarketStatusIndicator;