import React from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useMarketData } from '../contexts/MarketDataContext';
import { useSignals } from '../contexts/SignalContext';
import { useHighFrequencyData } from '../hooks/useHighFrequencyData';
import demoDataGenerator from '../services/demoDataGenerator';
import dataUpdateService from '../services/dataUpdateService';
import Header from './layout/Header';
import OptimizedSidebar from './layout/OptimizedSidebar';
import SignalGrid from './signals/SignalGrid';
import PerformanceMonitor from './PerformanceMonitor';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Activity, TrendingUp, AlertTriangle, Clock } from 'lucide-react';

// Functional component with hooks for better performance
const OptimizedTradingDashboard = ({ connectionStatus }) => {
  const { socket, isConnected } = useSocket();
  const { symbols: marketData } = useMarketData();
  const { signals, updateSignalStatus, getSignalStats } = useSignals();

  // High-frequency data hooks for real-time updates
  const { 
    data: realtimeSignals, 
    pushData: pushSignalData, 
    updateCount: signalUpdateCount 
  } = useHighFrequencyData('signals', signals, { 
    throttleMs: 16, // 60 FPS
    priority: 1,
    enableBatching: true 
  });

  const { 
    data: realtimeStats, 
    pushData: pushStatsData 
  } = useHighFrequencyData('stats', {
    totalSignals: 0,
    activeSignals: 0,
    successRate: 0,
    totalPnL: 0
  }, { throttleMs: 100 }); // Update stats less frequently

  const [loading, setLoading] = React.useState(true);
  const [lastUpdate, setLastUpdate] = React.useState(null);
  const [selectedSymbol, setSelectedSymbol] = React.useState('ALL');
  const [timeframe, setTimeframe] = React.useState('1m');

  React.useEffect(() => {
    if (socket && isConnected) {
      // Listen for signal updates
      const handleSignalUpdate = (updatedSignal) => {
        if (updatedSignal.status && updatedSignal.id) {
          updateSignalStatus(updatedSignal.id, updatedSignal.status, updatedSignal.exitPrice, updatedSignal.pnl);
        }
        setLastUpdate(new Date());
      };

      socket.on('signalUpdate', handleSignalUpdate);
      
      // Request initial data
      socket.emit('requestSignals');
      socket.emit('requestMarketData');
      
      console.log('✅ Optimized Dashboard connected to WebSocket');

      return () => {
        socket.off('signalUpdate', handleSignalUpdate);
      };
    }
  }, [socket, isConnected, updateSignalStatus]);

  React.useEffect(() => {
    // Set loading to false after initial load
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    // Subscribe to demo data updates
    const unsubscribeNewSignal = dataUpdateService.subscribe('newSignal', (signal) => {
      console.log('📨 Received new signal:', signal);
      // In a real app, this would be handled by the SignalContext
    });

    const unsubscribeMarketData = dataUpdateService.subscribe('marketData', (data) => {
      // Handle market data updates
      console.log('📈 Market data update received');
    });

    return () => {
      clearTimeout(timer);
      unsubscribeNewSignal();
      unsubscribeMarketData();
    };
  }, []);

  // Calculate stats whenever signals change and push to high-frequency service
  React.useEffect(() => {
    const signalStats = getSignalStats();
    const newStats = {
      totalSignals: signalStats.total,
      activeSignals: signalStats.active,
      successRate: parseFloat(signalStats.winRate),
      totalPnL: signalStats.totalPnL
    };
    
    // Push stats to high-frequency service
    pushStatsData(newStats);
  }, [signals, getSignalStats, pushStatsData]);

  // Push signals to high-frequency service whenever they change
  React.useEffect(() => {
    pushSignalData(signals);
  }, [signals, pushSignalData]);

  const handleSymbolFilter = React.useCallback((symbol) => {
    setSelectedSymbol(symbol);
  }, []);

  const handleTimeframeChange = React.useCallback((tf) => {
    setTimeframe(tf);
  }, []);

  const handleSignalUpdate = React.useCallback((signal) => {
    if (signal.status && signal.id) {
      updateSignalStatus(signal.id, signal.status, signal.exitPrice, signal.pnl);
    }
    setLastUpdate(new Date());
  }, [updateSignalStatus]);

  const filteredSignals = React.useMemo(() => {
    const signalsToFilter = realtimeSignals || signals;
    return signalsToFilter.filter(signal => {
      const symbolMatch = selectedSymbol === 'ALL' || signal.symbol === selectedSymbol;
      const timeframeMatch = signal.timeframe === timeframe;
      return symbolMatch && timeframeMatch;
    });
  }, [realtimeSignals, signals, selectedSymbol, timeframe]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        connectionStatus={connectionStatus}
        stats={realtimeStats}
        lastUpdate={lastUpdate}
      />
      
      <div className="flex">
        <OptimizedSidebar 
          selectedSymbol={selectedSymbol}
          timeframe={timeframe}
          onSymbolChange={handleSymbolFilter}
          onTimeframeChange={handleTimeframeChange}
          marketData={marketData}
        />
        
        <main className="flex-1 p-6 ml-64">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Signals</p>
                  <p className="text-2xl font-bold text-gray-900">{realtimeStats.totalSignals}</p>
                  <p className="text-xs text-gray-500">{signalUpdateCount}/s updates</p>
                </div>
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Signals</p>
                  <p className="text-2xl font-bold text-orange-600">{realtimeStats.activeSignals}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold text-green-600">{realtimeStats.successRate}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total P&L</p>
                  <p className={`text-2xl font-bold ${realtimeStats.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {realtimeStats.totalPnL >= 0 ? '+' : ''}{realtimeStats.totalPnL}%
                  </p>
                </div>
                <AlertTriangle className={`h-8 w-8 ${realtimeStats.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </Card>
          </div>

          {/* Filter Info */}
          <div className="flex items-center space-x-4 mb-4">
            <Badge variant="outline" className="text-sm">
              Symbol: {selectedSymbol}
            </Badge>
            <Badge variant="outline" className="text-sm">
              Timeframe: {timeframe}
            </Badge>
            <Badge variant="outline" className="text-sm">
              Showing: {filteredSignals.length} signals
            </Badge>
          </div>

          {/* Main Signal Grid */}
          <Card className="p-0 h-[calc(100vh-400px)]">
            <SignalGrid
              signals={filteredSignals}
              onSignalUpdate={handleSignalUpdate}
              loading={loading}
              autoSizeColumns={true}
            />
          </Card>
        </main>
      </div>
      
      {/* Performance Monitor */}
      <PerformanceMonitor enabled={process.env.NODE_ENV === 'development'} />
    </div>
  );
};

export default OptimizedTradingDashboard;