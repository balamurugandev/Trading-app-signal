import React, { useState, useEffect, useMemo } from 'react';
import SignalsGrid from './grid/SignalsGrid';
import MarketDataGrid from './grid/MarketDataGrid';

const GridDashboard = () => {
  const [isDark, setIsDark] = useState(true);
  const [activeTab, setActiveTab] = useState('market-data');
  const [marketData, setMarketData] = useState([]);
  const [signals, setSignals] = useState([]);
  const [selectedSignal, setSelectedSignal] = useState(null);
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Fetch market data
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/market-data');
        if (response.ok) {
          const data = await response.json();
          const formattedData = Object.values(data).map(item => ({
            ...item,
            id: item.symbol
          }));
          setMarketData(formattedData);
          setIsConnected(true);
        }
      } catch (error) {
        console.error('Error fetching market data:', error);
        setIsConnected(false);
        // Use demo data if API fails
        setMarketData([
          {
            id: 'NIFTY',
            symbol: 'NIFTY',
            ltp: 24631.30,
            change: 11.95,
            changePercent: 0.05,
            volume: 125000,
            dataSource: 'last_close',
            timestamp: new Date().toISOString()
          },
          {
            id: 'BANKNIFTY',
            symbol: 'BANKNIFTY',
            ltp: 55341.85,
            change: 160.40,
            changePercent: 0.29,
            volume: 89000,
            dataSource: 'last_close',
            timestamp: new Date().toISOString()
          },
          {
            id: 'BITCOIN',
            symbol: 'BITCOIN',
            ltp: 117222.46,
            change: -1160.15,
            changePercent: -0.98,
            volume: 2500000,
            dataSource: 'live',
            timestamp: new Date().toISOString()
          }
        ]);
      }
    };

    fetchMarketData();
    const interval = setInterval(fetchMarketData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Generate demo signals
  useEffect(() => {
    const generateDemoSignals = () => {
      const demoSignals = [
        {
          id: 'signal_1',
          signalTime: '10:15:30',
          symbol: 'NIFTY',
          signal: 'BUY_CALL',
          entryPrice: 24635.50,
          stopLoss: 24620.00,
          target1: 24650.00,
          target2: 24665.00,
          strength: 85.2,
          status: 'active',
          timeframe: '5m',
          timestamp: new Date().toISOString()
        },
        {
          id: 'signal_2',
          signalTime: '10:12:15',
          symbol: 'BANKNIFTY',
          signal: 'SELL_PUT',
          entryPrice: 55340.00,
          stopLoss: 55355.00,
          target1: 55325.00,
          target2: 55310.00,
          strength: 72.8,
          status: 'active',
          timeframe: '1m',
          timestamp: new Date(Date.now() - 180000).toISOString()
        },
        {
          id: 'signal_3',
          signalTime: '10:08:45',
          symbol: 'BITCOIN',
          signal: 'BUY_CALL',
          entryPrice: 117250.00,
          stopLoss: 117100.00,
          target1: 117400.00,
          target2: 117550.00,
          strength: 91.5,
          status: 'completed',
          timeframe: '15m',
          timestamp: new Date(Date.now() - 420000).toISOString()
        },
        {
          id: 'signal_4',
          signalTime: '10:05:20',
          symbol: 'NIFTY',
          signal: 'SELL_PUT',
          entryPrice: 24625.00,
          stopLoss: 24640.00,
          target1: 24610.00,
          target2: 24595.00,
          strength: 68.3,
          status: 'stopped',
          timeframe: '5m',
          timestamp: new Date(Date.now() - 600000).toISOString()
        }
      ];
      setSignals(demoSignals);
    };

    generateDemoSignals();
  }, []);

  // Statistics
  const stats = useMemo(() => {
    const activeSignals = signals.filter(s => s.status === 'active').length;
    const totalSignals = signals.length;
    const avgStrength = signals.length > 0 
      ? signals.reduce((sum, s) => sum + s.strength, 0) / signals.length 
      : 0;
    const connectedSymbols = marketData.filter(d => d.dataSource === 'live').length;

    return {
      activeSignals,
      totalSignals,
      avgStrength,
      connectedSymbols,
      totalSymbols: marketData.length
    };
  }, [signals, marketData]);

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-200`}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Trading Grid Dashboard
            </h1>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
              Real-time market data and signals with AG Grid integration
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              isConnected 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}>
              {isConnected ? '● Connected' : '● Disconnected'}
            </span>
            
            <div className="flex items-center space-x-2">
              <label htmlFor="theme-toggle" className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Dark Mode
              </label>
              <button
                id="theme-toggle"
                onClick={() => setIsDark(!isDark)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isDark ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isDark ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className={`p-6 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                Active Signals
              </h3>
            </div>
            <div className={`text-2xl font-bold mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {stats.activeSignals}
            </div>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              of {stats.totalSignals} total
            </p>
          </div>

          <div className={`p-6 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                Avg Strength
              </h3>
            </div>
            <div className={`text-2xl font-bold mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {stats.avgStrength.toFixed(1)}%
            </div>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              signal quality
            </p>
          </div>

          <div className={`p-6 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                Live Data
              </h3>
            </div>
            <div className={`text-2xl font-bold mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {stats.connectedSymbols}
            </div>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              of {stats.totalSymbols} symbols
            </p>
          </div>

          <div className={`p-6 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                Grid Theme
              </h3>
            </div>
            <div className={`text-2xl font-bold mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {isDark ? 'Dark' : 'Light'}
            </div>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              AG Grid theme
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="space-y-4">
          <div className={`flex rounded-lg p-1 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <button
              onClick={() => setActiveTab('market-data')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'market-data'
                  ? (isDark ? 'bg-gray-700 text-white' : 'bg-white text-gray-900 shadow')
                  : (isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900')
              }`}
            >
              Market Data
            </button>
            <button
              onClick={() => setActiveTab('signals')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'signals'
                  ? (isDark ? 'bg-gray-700 text-white' : 'bg-white text-gray-900 shadow')
                  : (isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900')
              }`}
            >
              Trading Signals
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'market-data' && (
            <div className={`rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} h-[600px]`}>
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Live Market Data
                </h2>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Real-time prices from Yahoo Finance API
                </p>
              </div>
              <div className="p-6 h-[500px]">
                <MarketDataGrid
                  marketData={marketData}
                  isDark={isDark}
                  onSymbolSelect={setSelectedSymbol}
                />
              </div>
            </div>
          )}

          {activeTab === 'signals' && (
            <div className={`rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} h-[600px]`}>
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Trading Signals
                </h2>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Generated signals with entry, stop-loss, and target levels
                </p>
              </div>
              <div className="p-6 h-[500px]">
                <SignalsGrid
                  signals={signals}
                  isDark={isDark}
                  onSignalSelect={setSelectedSignal}
                />
              </div>
            </div>
          )}
        </div>

        {/* Selection Details */}
        {(selectedSignal || selectedSymbol) && (
          <div className={`rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Selection Details
              </h2>
            </div>
            <div className="p-6">
              <pre className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'} ${isDark ? 'bg-gray-900' : 'bg-gray-100'} p-4 rounded-lg overflow-auto`}>
                {JSON.stringify(selectedSignal || selectedSymbol, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GridDashboard;