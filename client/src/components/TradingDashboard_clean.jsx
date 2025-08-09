import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Activity,
    TrendingUp,
    TrendingDown,
    Clock,
    Settings,
    Play,
    Pause,
    Wifi,
    WifiOff,
    Database,
    Zap,
    BarChart3,
    Target,
    Shield,
    AlertCircle,
    CheckCircle,
    XCircle
} from 'lucide-react';

// Enhanced Market Status Component
const MarketStatus = ({ status, isDemoMode }) => {
  const now = new Date();
  const istTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
  const hour = istTime.getHours();
  const day = istTime.getDay(); // 0 = Sunday, 6 = Saturday
  
  // Check if market is actually open (9:15 AM - 3:30 PM, Mon-Fri)
  const isWeekend = day === 0 || day === 6;
  const isMarketHours = hour >= 9 && hour < 15.5;
  const isActuallyOpen = !isWeekend && isMarketHours && !isDemoMode;
  
  // Check if in liquid window (9:25-11:00, 13:45-15:05)
  const isLiquidWindow = (hour >= 9.4 && hour < 11) || (hour >= 13.75 && hour < 15.08);
  
  const getStatusColor = () => {
    if (isDemoMode) return 'bg-blue-500';
    if (isActuallyOpen && isLiquidWindow) return 'bg-green-500';
    if (isActuallyOpen) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  const getStatusText = () => {
    if (isDemoMode) return 'Demo Mode';
    if (isWeekend) return 'Weekend - Market Closed';
    if (!isMarketHours) return 'Market Closed';
    if (isLiquidWindow) return 'Liquid Window';
    return 'Market Open';
  };

  return (
    <div className="flex items-center space-x-2">
      <div className={`w-2 h-2 ${getStatusColor()} rounded-full animate-pulse`}></div>
      <span className="text-sm font-medium">{getStatusText()}</span>
    </div>
  );
};

const SignalFeed = ({ isDemoMode, selectedSymbol, currentMarketData, onActiveSignalsChange, onSignalStatsChange }) => {
  // Initialize with some demo signals if in demo mode
  const [demoSignals, setDemoSignals] = useState(() => {
    if (isDemoMode) {
      const now = Date.now();
      return [
        {
          id: 'initial_demo_1',
          symbol: 'NIFTY',
          timeframe: '5m',
          type: 'BUY',
          entryPrice: 21520,
          spotPrice: 21520,
          optionStrike: 21500,
          optionType: 'CALL',
          premium: 85.50,
          stopLoss: 21305,
          target1: 21843,
          target2: 22058,
          strength: 85,
          timestamp: new Date(now - 120000).toISOString(), // 2 minutes ago
          status: 'active',
          age: 'new',
          conditions: {
            trendFilter: true,
            momentumTrigger: 'RSI',
            volatilityStructure: true,
            signalValidation: true
          }
        },
        {
          id: 'initial_demo_2',
          symbol: 'BANKNIFTY',
          timeframe: '1m',
          type: 'BUY',
          entryPrice: 46150,
          spotPrice: 46150,
          optionStrike: 46100,
          optionType: 'CALL',
          premium: 125.75,
          stopLoss: 45689,
          target1: 46842,
          target2: 47304,
          strength: 72,
          timestamp: new Date(now - 300000).toISOString(), // 5 minutes ago
          status: 'active',
          age: 'medium',
          conditions: {
            trendFilter: true,
            momentumTrigger: 'MACD',
            volatilityStructure: true,
            signalValidation: true
          }
        }
      ];
    }
    return [];
  });
  const [totalSignalsGenerated, setTotalSignalsGenerated] = useState(() => isDemoMode ? 2 : 0);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Real-time update effect
  useEffect(() => {
    const updateInterval = setInterval(() => {
      setLastUpdate(new Date());
      
      // Update signal ages
      setDemoSignals(prev => {
        const updatedSignals = prev.map(signal => {
          const ageInMinutes = (Date.now() - new Date(signal.timestamp).getTime()) / (1000 * 60);
          let age = 'new';
          if (ageInMinutes > 10) age = 'old';
          else if (ageInMinutes > 5) age = 'medium';
          
          return { ...signal, age };
        });
        
        // Update signal statistics
        const activeCount = updatedSignals.filter(signal => signal.status === 'active').length;
        const completedSignals = updatedSignals.filter(signal => signal.status !== 'active');
        const successfulSignals = completedSignals.filter(signal => signal.status === 'hit_target');
        const winRate = completedSignals.length > 0 ? (successfulSignals.length / completedSignals.length) * 100 : 0;
        
        if (onActiveSignalsChange) {
          onActiveSignalsChange(activeCount);
        }
        
        if (onSignalStatsChange) {
          onSignalStatsChange({
            total: totalSignalsGenerated,
            winRate: winRate,
            completed: completedSignals.length,
            successful: successfulSignals.length
          });
        }
        
        return updatedSignals;
      });
    }, 1000); // Update every second

    return () => clearInterval(updateInterval);
  }, [onActiveSignalsChange, totalSignalsGenerated]);

  useEffect(() => {
    console.log('SignalFeed useEffect triggered, isDemoMode:', isDemoMode);
    
    if (isDemoMode) {
      // Generate demo signals
      const generateDemoSignal = () => {
        const symbols = ['NIFTY', 'BANKNIFTY'];
        const timeframes = ['1m', '5m', '15m'];
        const symbol = symbols[Math.floor(Math.random() * symbols.length)];
        const timeframe = timeframes[Math.floor(Math.random() * timeframes.length)];
        const spotPrice = symbol === 'NIFTY' ? 21500 + (Math.random() - 0.5) * 200 : 46000 + (Math.random() - 0.5) * 500;
        const strike = Math.round(spotPrice / 50) * 50;
        const premium = symbol === 'NIFTY' ? 50 + Math.random() * 100 : 80 + Math.random() * 150;
        
        const signal = {
          id: `demo_${Date.now()}_${Math.random()}`,
          symbol,
          timeframe,
          type: 'BUY',
          entryPrice: spotPrice,
          spotPrice: spotPrice,
          optionStrike: strike,
          optionType: 'CALL',
          premium: premium,
          stopLoss: spotPrice - (spotPrice * 0.01),
          target1: spotPrice + (spotPrice * 0.015),
          target2: spotPrice + (spotPrice * 0.025),
          strength: 60 + Math.floor(Math.random() * 40),
          timestamp: new Date().toISOString(),
          status: 'active',
          age: 'new',
          conditions: {
            trendFilter: true,
            momentumTrigger: Math.random() > 0.5 ? 'RSI' : 'MACD',
            volatilityStructure: true,
            signalValidation: true
          }
        };
        
        console.log('Generated demo signal:', signal);
        setTotalSignalsGenerated(prev => prev + 1);
        setDemoSignals(prev => {
          const newSignals = [signal, ...prev];
          
          // Update signal statistics
          const activeCount = newSignals.filter(s => s.status === 'active').length;
          const completedSignals = newSignals.filter(signal => signal.status !== 'active');
          const successfulSignals = completedSignals.filter(signal => signal.status === 'hit_target');
          const winRate = completedSignals.length > 0 ? (successfulSignals.length / completedSignals.length) * 100 : 0;
          
          if (onActiveSignalsChange) {
            onActiveSignalsChange(activeCount);
          }
          
          if (onSignalStatsChange) {
            onSignalStatsChange({
              total: totalSignalsGenerated + 1,
              winRate: winRate,
              completed: completedSignals.length,
              successful: successfulSignals.length
            });
          }
          
          return newSignals;
        });
      };

      // Generate first signal immediately
      console.log('Generating first demo signal...');
      generateDemoSignal();
      
      // Generate signals every 20 seconds for demo
      const interval = setInterval(() => {
        console.log('Generating periodic demo signal...');
        generateDemoSignal();
      }, 20000);
      
      return () => {
        console.log('Cleaning up demo signal interval');
        clearInterval(interval);
      };
    } else {
      // Clear signals when not in demo mode
      setDemoSignals([]);
      setTotalSignalsGenerated(0);
      if (onActiveSignalsChange) {
        onActiveSignalsChange(0);
      }
      if (onSignalStatsChange) {
        onSignalStatsChange({
          total: 0,
          winRate: 0,
          completed: 0,
          successful: 0
        });
      }
    }
  }, [isDemoMode]);

  // Initialize signal statistics
  useEffect(() => {
    if (isDemoMode) {
      const activeCount = demoSignals.filter(signal => signal.status === 'active').length;
      const completedSignals = demoSignals.filter(signal => signal.status !== 'active');
      const successfulSignals = completedSignals.filter(signal => signal.status === 'hit_target');
      const winRate = completedSignals.length > 0 ? (successfulSignals.length / completedSignals.length) * 100 : 0;
      
      if (onActiveSignalsChange) {
        onActiveSignalsChange(activeCount);
      }
      
      if (onSignalStatsChange) {
        onSignalStatsChange({
          total: totalSignalsGenerated,
          winRate: winRate,
          completed: completedSignals.length,
          successful: successfulSignals.length
        });
      }
    }
  }, [isDemoMode, demoSignals, onActiveSignalsChange, onSignalStatsChange, totalSignalsGenerated]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center space-x-2">
          <Activity className="h-5 w-5" />
          <span>Signal Feed</span>
          {isDemoMode && (
            <Badge className="bg-blue-100 text-blue-800 ml-2">
              <Database className="h-3 w-3 mr-1" />
              DEMO ({totalSignalsGenerated})
            </Badge>
          )}
        </h3>
        {isDemoMode && (
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => {
              console.log('Manual signal generation triggered');
              const symbols = ['NIFTY', 'BANKNIFTY'];
              const timeframes = ['1m', '5m', '15m'];
              const symbol = symbols[Math.floor(Math.random() * symbols.length)];
              const timeframe = timeframes[Math.floor(Math.random() * timeframes.length)];
              const entryPrice = symbol === 'NIFTY' ? 21500 + (Math.random() - 0.5) * 200 : 46000 + (Math.random() - 0.5) * 500;
              const strike = Math.round(entryPrice / 50) * 50;
              
              const signal = {
                id: `manual_${Date.now()}_${Math.random()}`,
                symbol,
                timeframe,
                type: 'BUY',
                entryPrice: entryPrice,
                optionStrike: strike,
                optionType: 'CALL',
                stopLoss: entryPrice - (entryPrice * 0.01),
                target1: entryPrice + (entryPrice * 0.015),
                target2: entryPrice + (entryPrice * 0.025),
                strength: 60 + Math.floor(Math.random() * 40),
                timestamp: new Date().toISOString(),
                status: 'active',
                conditions: {
                  trendFilter: true,
                  momentumTrigger: Math.random() > 0.5 ? 'RSI' : 'MACD',
                  volatilityStructure: true,
                  signalValidation: true
                }
              };
              
              setTotalSignalsGenerated(prev => prev + 1);
              setDemoSignals(prev => [signal, ...prev]);
            }}
            className="text-xs"
          >
            Generate Signal
          </Button>
        )}
      </div>
      
      {isDemoMode && (
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mb-4">
          <div className="flex items-center space-x-2">
            <Database className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Demo Mode - Simulated Signals</span>
          </div>
        </div>
      )}

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {demoSignals.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">
              {isDemoMode ? 'Loading demo signals...' : 'No signals yet'}
            </p>
            <p className="text-sm">
              {isDemoMode ? 'Demo signals will appear here shortly...' : 'Waiting for market conditions...'}
            </p>
            {isDemoMode && (
              <div className="mt-4">
                <div className="animate-pulse flex space-x-1 justify-center">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Sort signals: active first, then completed (newest first within each group)
          [...demoSignals]
            .sort((a, b) => {
              // First sort by status (active signals first)
              if (a.status === 'active' && b.status !== 'active') return -1;
              if (a.status !== 'active' && b.status === 'active') return 1;
              
              // Within same status group, sort by timestamp (newest first)
              return new Date(b.timestamp) - new Date(a.timestamp);
            })
            .map((signal, index, sortedArray) => {
              // Check if we need to show a separator
              const showSeparator = index > 0 && 
                sortedArray[index - 1].status === 'active' && 
                signal.status !== 'active';
              
              // Color coding based on signal age and status
              const getSignalColors = () => {
                if (signal.status !== 'active') {
                  return signal.status === 'hit_target'
                    ? 'from-green-100 to-green-200 border-green-300'
                    : 'from-red-100 to-red-200 border-red-300';
                }

                switch (signal.age) {
                  case 'new':
                    return 'from-emerald-50 to-emerald-100 border-emerald-300 shadow-lg';
                  case 'medium':
                    return 'from-blue-50 to-blue-100 border-blue-200';
                  case 'old':
                    return 'from-gray-50 to-gray-100 border-gray-200';
                  default:
                    return 'from-green-50 to-green-100 border-green-200';
                }
              };

              const getIndexColors = () => {
                if (signal.status !== 'active') {
                  return signal.status === 'hit_target' ? 'bg-green-600' : 'bg-red-600';
                }

                switch (signal.age) {
                  case 'new':
                    return 'bg-emerald-600 animate-pulse';
                  case 'medium':
                    return 'bg-blue-600';
                  case 'old':
                    return 'bg-gray-600';
                  default:
                    return 'bg-green-600';
                }
              };

              const handleStatusChange = (newStatus) => {
                setDemoSignals(prev => {
                  const updatedSignals = prev.map(s => 
                    s.id === signal.id ? { ...s, status: newStatus } : s
                  );
                  
                  // Update signal statistics
                  const activeCount = updatedSignals.filter(signal => signal.status === 'active').length;
                  const completedSignals = updatedSignals.filter(signal => signal.status !== 'active');
                  const successfulSignals = completedSignals.filter(signal => signal.status === 'hit_target');
                  const winRate = completedSignals.length > 0 ? (successfulSignals.length / completedSignals.length) * 100 : 0;
                  
                  if (onActiveSignalsChange) {
                    onActiveSignalsChange(activeCount);
                  }
                  
                  if (onSignalStatsChange) {
                    onSignalStatsChange({
                      total: totalSignalsGenerated,
                      winRate: winRate,
                      completed: completedSignals.length,
                      successful: successfulSignals.length
                    });
                  }
                  
                  return updatedSignals;
                });
              };

              return (
                <div key={`fragment-${signal.id}`}>
                  {showSeparator && (
                    <div className="flex items-center my-4">
                      <div className="flex-1 border-t border-gray-300"></div>
                      <div className="px-4 text-xs text-gray-500 font-medium bg-gray-100 rounded-full py-1">
                        COMPLETED SIGNALS
                      </div>
                      <div className="flex-1 border-t border-gray-300"></div>
                    </div>
                  )}
                  <div className={`bg-gradient-to-r ${getSignalColors()} p-4 rounded-lg border transition-all duration-300`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className={`w-6 h-6 ${getIndexColors()} text-white rounded-full flex items-center justify-center text-xs font-bold`}>
                          #{totalSignalsGenerated - demoSignals.findIndex(s => s.id === signal.id)}
                        </div>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="font-bold">{signal.symbol}</span>
                        <Badge variant="outline" className="text-xs">{signal.timeframe}</Badge>
                        {signal.status === 'active' && (
                          <Badge className={`text-xs ${
                            signal.age === 'new' ? 'bg-emerald-500 animate-pulse' :
                            signal.age === 'medium' ? 'bg-blue-500' : 'bg-orange-500'
                          } text-white`}>
                            {signal.age === 'new' ? '🔴 LIVE' : signal.age === 'medium' ? '🟡 ACTIVE' : '🟠 AGING'}
                          </Badge>
                        )}
                        {signal.status !== 'active' && (
                          <Badge className={`text-xs ${
                            signal.status === 'hit_target' ? 'bg-green-600' : 'bg-red-600'
                          } text-white`}>
                            {signal.status === 'hit_target' ? '✅ COMPLETED' : '❌ STOPPED'}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={`text-xs ${signal.strength >= 80 ? 'bg-green-500' : 'bg-blue-500'} text-white`}>
                          {signal.strength}%
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-600 font-medium">Spot Price</p>
                        <p className="font-bold text-gray-800">{formatSpotPrice(signal.spotPrice)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 font-medium">Strike & Premium</p>
                        <p className="font-bold text-green-800">{formatPrice(signal.premium)} ({signal.optionStrike} {signal.optionType})</p>
                      </div>
                      <div>
                        <p className="text-gray-600 font-medium">Stop Loss</p>
                        <p className="font-bold text-red-600">{formatSpotPrice(signal.stopLoss)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 font-medium">Target 1</p>
                        <p className="font-bold text-green-600">{formatSpotPrice(signal.target1)}</p>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-xs bg-green-100 text-green-800">
                        ✓ Trend
                      </Badge>
                      <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800">
                        ✓ {signal.conditions.momentumTrigger}
                      </Badge>
                      <Badge variant="outline" className="text-xs bg-purple-100 text-purple-800">
                        ✓ Structure
                      </Badge>
                    </div>
                    
                    <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                      <span>{formatTime(signal.timestamp)}</span>
                      <span className="font-medium">
                        Age: {Math.floor((Date.now() - new Date(signal.timestamp).getTime()) / (1000 * 60))}m
                      </span>
                    </div>
                    
                    {signal.status === 'active' ? (
                      <div className="mt-3 flex space-x-2">
                        <Button 
                          size="sm" 
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs"
                          onClick={() => handleStatusChange('hit_target')}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Hit Target
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1 border-red-300 text-red-600 hover:bg-red-50 text-xs"
                          onClick={() => handleStatusChange('hit_stop')}
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Hit Stop
                        </Button>
                      </div>
                    ) : (
                      <div className={`mt-3 p-2 rounded text-center text-xs font-medium ${
                        signal.status === 'hit_target' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {signal.status === 'hit_target' ? '✓ Target Achieved' : '✗ Stop Loss Hit'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
        )}
      </div>
    </div>
  );
};

// Enhanced utility functions
const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour12: true,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

const formatPrice = (price) => `₹${price?.toFixed(2) || '0.00'}`;
const formatSpotPrice = (price) => `${price?.toFixed(2) || '0.00'}`; // No rupee symbol for spot prices

export default SignalFeed;