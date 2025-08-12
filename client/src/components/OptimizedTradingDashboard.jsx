import React from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useMarketData } from '../contexts/MarketDataContext';
import { useSignals } from '../contexts/SignalContext';
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
    const { symbols: marketData, marketStatus } = useMarketData();
    const { signals, updateSignalStatus, getSignalStats } = useSignals();

    const [loading, setLoading] = React.useState(true);
    const [lastUpdate, setLastUpdate] = React.useState(null);
    const [selectedSymbol, setSelectedSymbol] = React.useState('ALL');
    const [timeframe, setTimeframe] = React.useState('1m');
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
                />

                <main className="flex-1 p-6 ml-64">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
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

                        <Card className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Success Rate</p>
                                    <p className="text-2xl font-bold text-green-600">{stats.successRate}%</p>
                                </div>
                                <TrendingUp className="h-8 w-8 text-green-600" />
                            </div>
                        </Card>

                        <Card className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total P&L</p>
                                    <p className={`text-2xl font-bold ${stats.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {stats.totalPnL >= 0 ? '+' : ''}{stats.totalPnL}%
                                    </p>
                                </div>
                                <AlertTriangle className={`h-8 w-8 ${stats.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`} />
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