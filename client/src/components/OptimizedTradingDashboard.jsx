import React from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useMarketData } from '../contexts/MarketDataContext';
import { useSignals } from '../contexts/SignalContext';
import demoDataGenerator from '../services/demoDataGenerator';
import cryptoDataService from '../services/cryptoDataService';
import marketStatusService from '../services/marketStatusService';
import Header from './layout/Header';
import OptimizedSidebar from './layout/OptimizedSidebar';
import SignalGrid from './signals/SignalGrid';
import PerformanceMonitor from './PerformanceMonitor';
import MarketStatusIndicator from './MarketStatusIndicator';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Activity, AlertTriangle, Clock, Database, Globe, TrendingUp, Zap } from 'lucide-react';

// Functional component with hooks for better performance
const OptimizedTradingDashboard = ({ connectionStatus }) => {
    const { socket, isConnected } = useSocket();
    const { symbols: marketData, marketStatus: marketStatusData } = useMarketData();
    const { signals, updateSignalStatus, getSignalStats } = useSignals();

    const [loading, setLoading] = React.useState(true);
    const [lastUpdate, setLastUpdate] = React.useState(null);
    const [selectedSymbol, setSelectedSymbol] = React.useState('ALL');
    const [timeframe, setTimeframe] = React.useState('1m');
    const [isDemoMode, setIsDemoMode] = React.useState(false);
    const [liveMarketData, setLiveMarketData] = React.useState({});
    const [cryptoPrices, setCryptoPrices] = React.useState({
        BITCOIN: { price: 0, change: 0, changePercent: 0 },
        SOLANA: { price: 0, change: 0, changePercent: 0 }
    });
    const [updateCounter, setUpdateCounter] = React.useState(0);
    const [isUpdating, setIsUpdating] = React.useState(false);
    const [marketStatus, setMarketStatus] = React.useState({
        indian: { isOpen: false, session: '', isPreMarket: false, isPostMarket: false },
        crypto: { isOpen: true, lastUpdated: null }
    });
    const [stats, setStats] = React.useState({
        totalSignals: 0,
        activeSignals: 0,
        successRate: 0,
        totalPnL: 0
    });

    React.useEffect(() => {
        if (socket && isConnected) {
            // Listen for new signals
            const handleNewSignal = (signalData) => {
                console.log('📨 Received new signal:', signalData);
                setLastUpdate(new Date());
            };

            // Listen for signal updates
            const handleSignalUpdate = (updatedSignal) => {
                if (updatedSignal.status && updatedSignal.id) {
                    updateSignalStatus(updatedSignal.id, updatedSignal.status, updatedSignal.exitPrice, updatedSignal.pnl);
                }
                setLastUpdate(new Date());
            };

            // Listen for market data updates
            const handleMarketData = (data) => {
                console.log('📈 Market data update received');
                setLastUpdate(new Date());
            };

            socket.on('newSignal', handleNewSignal);
            socket.on('signalUpdate', handleSignalUpdate);
            socket.on('marketData', handleMarketData);

            // Request initial data
            socket.emit('requestSignals');
            socket.emit('requestMarketData');

            console.log('✅ Optimized Dashboard connected to WebSocket');

            return () => {
                socket.off('newSignal', handleNewSignal);
                socket.off('signalUpdate', handleSignalUpdate);
                socket.off('marketData', handleMarketData);
            };
        }
    }, [socket, isConnected, updateSignalStatus]);

    React.useEffect(() => {
        // Set loading to false after initial load
        const timer = setTimeout(() => {
            setLoading(false);
        }, 2000);

        return () => {
            clearTimeout(timer);
        };
    }, []);

    // Calculate stats whenever signals change
    React.useEffect(() => {
        const signalStats = getSignalStats();
        setStats({
            totalSignals: signalStats.total,
            activeSignals: signalStats.active,
            successRate: parseFloat(signalStats.winRate),
            totalPnL: signalStats.totalPnL
        });
    }, [signals, getSignalStats]);

    const handleSymbolFilter = React.useCallback((symbol) => {
        setSelectedSymbol(symbol);
    }, []);

    const handleTimeframeChange = React.useCallback((tf) => {
        setTimeframe(tf);
    }, []);

    const toggleDemoMode = React.useCallback(() => {
        setIsDemoMode(prev => {
            const newDemoMode = !prev;
            if (newDemoMode) {
                console.log('🎮 Starting demo mode in optimized dashboard');
                demoDataGenerator.start();
            } else {
                console.log('📡 Stopping demo mode in optimized dashboard');
                demoDataGenerator.stop();
            }
            return newDemoMode;
        });
    }, []);

    // Fetch live market data from server API
    React.useEffect(() => {
        console.log('🚀 Starting live market data fetching from server');

        const fetchAllMarketData = async () => {
            try {
                setIsUpdating(true);
                const response = await fetch(`/api/data/current?t=${Date.now()}`);
                if (response.ok) {
                    const result = await response.json();
                    console.log('📊 Received all market data:', result);

                    if (result.data) {
                        // Force a completely new object to trigger React re-render
                        setLiveMarketData(prevData => {
                            const updatedData = {};
                            Object.entries(result.data).forEach(([symbol, data]) => {
                                const isCrypto = symbol === 'BITCOIN' || symbol === 'SOLANA';
                                updatedData[symbol] = {
                                    price: parseFloat(data.ltp) || 0,
                                    change: parseFloat(data.change) || 0,
                                    changePercent: parseFloat(data.changePercent) || 0,
                                    volume: parseInt(data.volume) || 0,
                                    lastUpdate: new Date().toISOString(),
                                    isLive: isCrypto ? true : result.isLive,
                                    dataSource: isCrypto ? 'live' : (data.dataSource || 'unknown'),
                                    symbol: symbol,
                                    isCrypto: isCrypto,
                                    timestamp: Date.now() // Add timestamp to force updates
                                };
                            });

                            // Update crypto prices separately to force re-render
                            if (updatedData.BITCOIN) {
                                setCryptoPrices(prev => ({
                                    ...prev,
                                    BITCOIN: {
                                        price: updatedData.BITCOIN.price,
                                        change: updatedData.BITCOIN.change,
                                        changePercent: updatedData.BITCOIN.changePercent,
                                        timestamp: Date.now()
                                    }
                                }));
                                console.log(`🔄 BITCOIN updated: ₹${updatedData.BITCOIN.price}`);
                            }
                            if (updatedData.SOLANA) {
                                setCryptoPrices(prev => ({
                                    ...prev,
                                    SOLANA: {
                                        price: updatedData.SOLANA.price,
                                        change: updatedData.SOLANA.change,
                                        changePercent: updatedData.SOLANA.changePercent,
                                        timestamp: Date.now()
                                    }
                                }));
                                console.log(`🔄 SOLANA updated: ₹${updatedData.SOLANA.price}`);
                            }

                            return updatedData;
                        });

                        setLastUpdate(new Date());
                        setUpdateCounter(prev => prev + 1);
                        console.log('✅ Updated live market data for all symbols');
                    }
                } else {
                    console.error('❌ Failed to fetch market data:', response.status);
                }
            } catch (error) {
                console.error('❌ Error fetching market data:', error);
            } finally {
                setIsUpdating(false);
            }
        };

        // Initial fetch
        fetchAllMarketData();

        // Set up periodic updates every 2 seconds for faster crypto updates
        const dataInterval = setInterval(fetchAllMarketData, 2000);

        // Subscribe to market status updates
        const updateMarketStatus = () => {
            setMarketStatus({
                indian: marketStatusService.getIndianMarketStatus(),
                crypto: marketStatusService.getCryptoMarketStatus()
            });
        };

        // Initial status update
        updateMarketStatus();

        // Subscribe to status changes
        const unsubscribeMarketStatus = marketStatusService.subscribe(updateMarketStatus);

        // Update status every minute
        const statusInterval = setInterval(updateMarketStatus, 60000);

        return () => {
            console.log('🛑 Cleaning up live market data fetching');
            clearInterval(dataInterval);
            if (unsubscribeMarketStatus) unsubscribeMarketStatus();
            clearInterval(statusInterval);
        };
    }, []);

    // Debug: Monitor liveMarketData changes
    React.useEffect(() => {
        console.log('🔄 liveMarketData state updated:', liveMarketData);
    }, [liveMarketData]);

    const handleSignalUpdate = React.useCallback((signal) => {
        if (signal.status && signal.id) {
            updateSignalStatus(signal.id, signal.status, signal.exitPrice, signal.pnl);
        }
        setLastUpdate(new Date());
    }, [updateSignalStatus]);

    const filteredSignals = React.useMemo(() => {
        return signals.filter(signal => {
            const symbolMatch = selectedSymbol === 'ALL' || signal.symbol === selectedSymbol;
            const timeframeMatch = signal.timeframe === timeframe;
            return symbolMatch && timeframeMatch;
        });
    }, [signals, selectedSymbol, timeframe]);

    return (
        <div className="min-h-screen bg-gray-50">
            <Header
                connectionStatus={connectionStatus}
                stats={stats}
                lastUpdate={lastUpdate}
            />

            <div className="flex">
                <OptimizedSidebar
                    selectedSymbol={selectedSymbol}
                    timeframe={timeframe}
                    onSymbolChange={handleSymbolFilter}
                    onTimeframeChange={handleTimeframeChange}
                    marketData={marketData}
                    liveMarketData={liveMarketData}
                    cryptoPrices={cryptoPrices}
                    updateCounter={updateCounter}
                />

                <main className="flex-1 p-6 ml-64">
                    {/* Market Status Indicator */}
                    <MarketStatusIndicator marketStatus={marketStatus} />

                    {/* Live Data Status */}
                    <div className="mb-4">
                        <Card className="p-3 border-l-4 border-green-500">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="flex items-center space-x-2">
                                        <div className={`w-2 h-2 rounded-full ${isUpdating ? 'bg-blue-500 animate-spin' : 'bg-green-500 animate-pulse'}`}></div>
                                        <span className="text-sm font-medium text-gray-700">
                                            {isUpdating ? 'Updating...' : 'Live Data Status'}
                                        </span>
                                    </div>
                                    <Badge className="bg-green-100 text-green-800 text-xs">
                                        {Object.keys(liveMarketData).filter(symbol => liveMarketData[symbol] && liveMarketData[symbol].price > 0).length} symbols active
                                    </Badge>
                                </div>
                                <div className="text-xs text-gray-500">
                                    Last update: {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Never'}
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Market Status Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <Card className="p-4 border-l-4 border-blue-500">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-700">Indian Market</h3>
                                    <div className="flex items-center mt-1">
                                        <div className={`w-2 h-2 rounded-full mr-2 ${marketStatus.indian.isOpen ? 'bg-green-500' : 'bg-red-500'
                                            }`}></div>
                                        <span className="text-sm">
                                            {marketStatus.indian.isOpen
                                                ? `Open (${marketStatus.indian.session})`
                                                : marketStatus.indian.isPreMarket
                                                    ? 'Pre-Market'
                                                    : marketStatus.indian.isPostMarket
                                                        ? 'Post-Market'
                                                        : 'Closed'}
                                        </span>
                                    </div>
                                </div>
                                <Globe className="h-6 w-6 text-blue-500" />
                            </div>
                        </Card>

                        <Card className="p-4 border-l-4 border-purple-500">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-700">Crypto Market</h3>
                                    <div className="flex items-center mt-1">
                                        <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                                        <span className="text-sm font-medium text-green-700">Always Open - LIVE</span>
                                    </div>
                                    <div className="text-xs text-gray-600 mt-2" key={`crypto-prices-${updateCounter}`}>
                                        BTC: <span className="font-mono">
                                            {(cryptoPrices.BITCOIN && cryptoPrices.BITCOIN.price > 0) ?
                                                `₹${cryptoPrices.BITCOIN.price.toFixed(2)}` :
                                                (liveMarketData.BITCOIN && liveMarketData.BITCOIN.price > 0) ?
                                                    `₹${liveMarketData.BITCOIN.price.toFixed(2)}` : '--'}
                                        </span> |
                                        SOL: <span className="font-mono">
                                            {(cryptoPrices.SOLANA && cryptoPrices.SOLANA.price > 0) ?
                                                `₹${cryptoPrices.SOLANA.price.toFixed(2)}` :
                                                (liveMarketData.SOLANA && liveMarketData.SOLANA.price > 0) ?
                                                    `₹${liveMarketData.SOLANA.price.toFixed(2)}` : '--'}
                                        </span>
                                    </div>
                                </div>
                                <Zap className="h-6 w-6 text-purple-500" />
                            </div>
                        </Card>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <Card className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Signals</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.totalSignals}</p>
                                    <p className="text-xs text-gray-500">
                                        {connectionStatus === 'connected' ? 'Live Data' : 'Last Close'}
                                    </p>
                                </div>
                                <Activity className="h-8 w-8 text-blue-600" />
                            </div>
                        </Card>

                        <Card className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Active Signals</p>
                                    <p className="text-2xl font-bold text-orange-600">{stats.activeSignals}</p>
                                </div>
                                <Clock className="h-8 w-8 text-orange-600" />
                            </div>
                        </Card>
                    </div>

                    {/* Filter Info and Demo Mode Toggle */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                            <Badge variant="outline" className="text-sm">
                                Symbol: {selectedSymbol}
                            </Badge>
                            <Badge variant="outline" className="text-sm">
                                Timeframe: {timeframe}
                            </Badge>
                            <Badge variant="outline" className="text-sm">
                                Showing: {filteredSignals.length} signals
                            </Badge>
                            {isDemoMode && (
                                <Badge className="bg-blue-100 text-blue-800 text-sm">
                                    <Database className="h-3 w-3 mr-1" />
                                    Demo Mode
                                </Badge>
                            )}
                        </div>

                        <div className="flex items-center space-x-2">
                            <Button
                                variant={isDemoMode ? "default" : "outline"}
                                size="sm"
                                onClick={toggleDemoMode}
                                className="flex items-center space-x-1"
                            >
                                {isDemoMode ? (
                                    <>
                                        <Database className="h-4 w-4" />
                                        <span>Demo Mode</span>
                                    </>
                                ) : (
                                    <>
                                        <Zap className="h-4 w-4" />
                                        <span>Live Mode</span>
                                    </>
                                )}
                            </Button>
                        </div>
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