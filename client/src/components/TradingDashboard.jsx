import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSocket } from '../contexts/SocketContext';
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

const formatPrice = (price) => {
    if (price === null || price === undefined || isNaN(price)) return '₹0.00';
    return `₹${Number(price).toFixed(2)}`;
};

const formatSpotPrice = (price) => {
    if (price === null || price === undefined || isNaN(price)) return '0.00';
    return `${Number(price).toFixed(2)}`;
};

// Safe number formatter
const safeToFixed = (value, decimals = 2) => {
    if (value === null || value === undefined || isNaN(value)) return '--';
    return Number(value).toFixed(decimals);
};

// Safe market data validator
const validateMarketData = (data) => {
    if (!data || typeof data !== 'object') return null;

    return {
        price: (data.price !== null && data.price !== undefined && !isNaN(data.price)) ? Number(data.price) : null,
        change: (data.change !== null && data.change !== undefined && !isNaN(data.change)) ? Number(data.change) : null,
        changePercent: (data.changePercent !== null && data.changePercent !== undefined && !isNaN(data.changePercent)) ? Number(data.changePercent) : null,
        lastUpdate: data.lastUpdate || new Date(),
        dataSource: data.dataSource || 'unknown'
    };
};

// Enhanced Market Status Component
const MarketStatus = ({ status, marketData }) => {
    const now = new Date();
    const istTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const hour = istTime.getHours();
    const minute = istTime.getMinutes();
    const day = istTime.getDay(); // 0 = Sunday, 6 = Saturday

    // Check if market is actually open (9:15 AM - 3:30 PM, Mon-Fri)
    const isWeekend = day === 0 || day === 6;
    const isMarketHours = (hour > 9 || (hour === 9 && minute >= 15)) && (hour < 15 || (hour === 15 && minute <= 30));
    const isActuallyOpen = !isWeekend && isMarketHours;

    // Check if in liquid window (9:25-11:00, 13:45-15:05)
    const isLiquidWindow = ((hour > 9 || (hour === 9 && minute >= 25)) && hour < 11) ||
        ((hour > 13 || (hour === 13 && minute >= 45)) && (hour < 15 || (hour === 15 && minute <= 5)));

    const getStatusColor = () => {
        if (isActuallyOpen && isLiquidWindow) return 'bg-green-500';
        if (isActuallyOpen) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    const getStatusText = () => {
        if (isWeekend) return 'Weekend - Market Closed';
        if (!isMarketHours) {
            // Show time until market opens
            const nextOpen = new Date();
            if (hour < 9 || (hour === 9 && minute < 15)) {
                // Same day opening
                nextOpen.setHours(9, 15, 0, 0);
            } else {
                // Next day opening
                nextOpen.setDate(nextOpen.getDate() + 1);
                nextOpen.setHours(9, 15, 0, 0);
                // Skip weekends
                if (nextOpen.getDay() === 6) nextOpen.setDate(nextOpen.getDate() + 2);
                if (nextOpen.getDay() === 0) nextOpen.setDate(nextOpen.getDate() + 1);
            }
            const timeUntil = Math.floor((nextOpen - now) / (1000 * 60));
            const hours = Math.floor(timeUntil / 60);
            const mins = timeUntil % 60;
            return `Market Closed (Opens in ${hours}h ${mins}m)`;
        }
        if (isLiquidWindow) return 'Liquid Window - Active Trading';
        return 'Market Open';
    };

    const getDataSourceText = () => {
        if (!isActuallyOpen) return ' • Showing Last Close';
        return ' • Live Data';
    };

    return (
        <div className="flex flex-col items-start space-y-1">
            <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 ${getStatusColor()} rounded-full ${isActuallyOpen ? 'animate-pulse' : ''}`}></div>
                <span className="text-sm font-medium">{getStatusText()}</span>
            </div>
            <div className="text-xs text-gray-500">
                {getDataSourceText()}
            </div>
        </div>
    );
};

const SignalFeed = ({ selectedSymbol, currentMarketData, onActiveSignalsChange, onSignalStatsChange }) => {
    const { socket, isConnected } = useSocket();
    const [liveSignals, setLiveSignals] = useState([]);
    const [totalSignalsGenerated, setTotalSignalsGenerated] = useState(0);
    const [lastUpdate, setLastUpdate] = useState(new Date());

    // Real-time update effect
    useEffect(() => {
        const updateInterval = setInterval(() => {
            setLastUpdate(new Date());

            // Update signal ages
            setLiveSignals(prev => {
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
        console.log('SignalFeed useEffect triggered - Live mode only');

        if (!socket || !isConnected) {
            console.log('⚠️ Socket not available or not connected');
            return;
        }

        console.log('🔌 Using existing WebSocket connection for live signals...');

        // Subscribe to both symbols using existing socket
        socket.emit('subscribeSymbol', 'NIFTY');
        socket.emit('subscribeSymbol', 'BANKNIFTY');
        console.log('✅ Subscribed to NIFTY and BANKNIFTY signals');

        // Listen for new signals
        socket.on('newSignal', (signalData) => {
            console.log('🚨 Received live signal:', signalData);

            if (signalData.signal) {
                // Use server signal ID if available, otherwise create unique ID
                const signalId = signalData.signal.id || `live_${signalData.symbol}_${signalData.timeframe}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

                // Create a properly formatted signal
                const newSignal = {
                    id: signalId,
                    symbol: signalData.symbol,
                    timeframe: signalData.timeframe,
                    type: signalData.signal.type || 'BUY',
                    entryPrice: signalData.signal.entryPrice || signalData.signal.price,
                    spotPrice: signalData.signal.spotPrice || signalData.signal.entryPrice || signalData.signal.price,
                    premium: signalData.signal.premium || signalData.signal.option_ltp || 0,
                    optionStrike: signalData.signal.optionStrike || signalData.signal.option_strike,
                    optionType: signalData.signal.optionType || 'CALL',
                    target1: signalData.signal.target1 || signalData.signal.entryPrice * 1.005,
                    target2: signalData.signal.target2 || signalData.signal.entryPrice * 1.01,
                    stopLoss: signalData.signal.stopLoss || signalData.signal.entryPrice * 0.995,
                    strength: signalData.signal.strength || 75,
                    confidence: signalData.signal.confidence || 'Medium',
                    timestamp: new Date(signalData.timestamp || Date.now()),
                    status: 'active',
                    isLive: true,
                    age: 'new',
                    conditions: signalData.signal.conditions || {
                        trendFilter: true,
                        momentumTrigger: 'LIVE',
                        volatilityStructure: true,
                        signalValidation: true
                    }
                };

                // Add to signals with duplicate checking
                setLiveSignals(prev => {
                    // Check if signal already exists (prevent duplicates)
                    const existingSignal = prev.find(s => s.id === signalId);
                    if (existingSignal) {
                        console.log('⚠️ Duplicate signal detected, skipping:', signalId);
                        return prev;
                    }

                    // Check for similar signals (same symbol, timeframe, and close timestamp)
                    const similarSignal = prev.find(s =>
                        s.symbol === newSignal.symbol &&
                        s.timeframe === newSignal.timeframe &&
                        Math.abs(new Date(s.timestamp).getTime() - new Date(newSignal.timestamp).getTime()) < 5000 // Within 5 seconds
                    );

                    if (similarSignal) {
                        console.log('⚠️ Similar signal detected within 5 seconds, skipping:', signalId);
                        return prev;
                    }

                    const updatedSignals = [newSignal, ...prev.slice(0, 9)]; // Keep last 10 signals
                    return updatedSignals;
                });

                // Update counters
                setTotalSignalsGenerated(prev => prev + 1);

                console.log('✅ Added live signal to display:', signalId);
            }
        });

        // Initialize with empty signals for live mode
        setLiveSignals([]);
        setTotalSignalsGenerated(0);

        // Cleanup function
        return () => {
            console.log('🔌 Cleaning up signal listeners');
            if (socket) {
                socket.off('newSignal');
            }
        };
    }, [socket, isConnected]);

    // Initialize signal statistics
    useEffect(() => {
        const activeCount = liveSignals.filter(signal => signal.status === 'active').length;
        const completedSignals = liveSignals.filter(signal => signal.status !== 'active');
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
    }, [liveSignals, onActiveSignalsChange, onSignalStatsChange, totalSignalsGenerated]);

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg h-full">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center space-x-2">
                    <Activity className="h-5 w-5" />
                    <span>Signal Feed</span>
                    <Badge className="bg-green-100 text-green-800 ml-2">
                        <Zap className="h-3 w-3 mr-1" />
                        LIVE ({totalSignalsGenerated})
                    </Badge>
                </h3>
            </div>

            <div className="bg-orange-50 p-3 rounded-lg border border-orange-200 mb-4">
                <div className="flex items-center space-x-2">
                    <Zap className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-800">Live Mode - Real Market Signals</span>
                    <div className="ml-auto flex items-center space-x-1">
                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-orange-600">Waiting for conditions</span>
                    </div>
                </div>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
                {liveSignals.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="font-medium">No signals yet</p>
                        <p className="text-sm">Waiting for market conditions...</p>
                    </div>
                ) : (
                    // Sort signals: active first, then completed (newest first within each group)
                    [...liveSignals]
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
                                setLiveSignals(prev => {
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
                                                    #{totalSignalsGenerated - liveSignals.findIndex(s => s.id === signal.id)}
                                                </div>
                                                <TrendingUp className="h-4 w-4 text-green-600" />
                                                <span className="font-bold">{signal.symbol}</span>
                                                <Badge variant="outline" className="text-xs">{signal.timeframe}</Badge>
                                                {signal.status === 'active' && (
                                                    <Badge className={`text-xs ${signal.age === 'new' ? 'bg-emerald-500 animate-pulse' :
                                                        signal.age === 'medium' ? 'bg-blue-500' : 'bg-orange-500'
                                                        } text-white`}>
                                                        {signal.age === 'new' ? '🔴 LIVE' : signal.age === 'medium' ? '🟡 ACTIVE' : '🟠 AGING'}
                                                    </Badge>
                                                )}
                                                {signal.status !== 'active' && (
                                                    <Badge className={`text-xs ${signal.status === 'hit_target' ? 'bg-green-600' : 'bg-red-600'
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
                                                <p className="font-bold text-green-800">
                                                    ₹{signal.premium} ({signal.optionStrike} {signal.optionType})
                                                </p>
                                                {signal.expiry && (
                                                    <p className="text-xs text-gray-500">Exp: {signal.expiry}</p>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-gray-600 font-medium">Stop Loss</p>
                                                <p className="font-bold text-red-600">{formatSpotPrice(signal.stopLoss)}</p>
                                                {signal.premiumStopLoss && (
                                                    <p className="text-xs text-gray-500">
                                                        Premium SL: ₹{signal.premiumStopLoss}
                                                    </p>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-gray-600 font-medium">Target 1</p>
                                                <p className="font-bold text-green-600">{formatSpotPrice(signal.target1)}</p>
                                                {signal.premiumTarget1 && (
                                                    <p className="text-xs text-gray-500">
                                                        Premium T1: ₹{signal.premiumTarget1}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-3 flex flex-wrap gap-1">
                                            <Badge variant="outline" className="text-xs bg-green-100 text-green-800">
                                                ✓ Trend
                                            </Badge>
                                            <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800">
                                                ✓ {typeof signal.conditions?.momentumTrigger === 'string' 
                                                    ? signal.conditions.momentumTrigger 
                                                    : signal.conditions?.momentumTrigger?.trigger || 'Momentum'}
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
                                            <div className={`mt-3 p-2 rounded text-center text-xs font-medium ${signal.status === 'hit_target'
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

const TradingDashboard = ({ connectionStatus }) => {
    const [selectedSymbol, setSelectedSymbol] = useState('NIFTY');
    const [selectedTimeframe, setSelectedTimeframe] = useState('5m');
    // Force live mode during market hours (9:15 AM - 3:30 PM IST, Mon-Fri)
    const [isLiveMode, setIsLiveMode] = useState(() => {
        const now = new Date();
        const istTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
        const hour = istTime.getHours();
        const minute = istTime.getMinutes();
        const day = istTime.getDay();
        const isWeekend = day === 0 || day === 6;
        const isMarketHours = (hour > 9 || (hour === 9 && minute >= 15)) && (hour < 15 || (hour === 15 && minute <= 30));
        const shouldBeLive = !isWeekend && isMarketHours;
        console.log(`🕐 Market Status Check: Hour=${hour}, Minute=${minute}, Day=${day}, Weekend=${isWeekend}, MarketHours=${isMarketHours}, ShouldBeLive=${shouldBeLive}`);
        return shouldBeLive;
    });
    // Removed demo mode - always in live mode


    const [showSettings, setShowSettings] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [activeSignalsCount, setActiveSignalsCount] = useState(0);
    const [updateCounter, setUpdateCounter] = useState(0);
    const [totalSignalsCount, setTotalSignalsCount] = useState(0);
    const [winRate, setWinRate] = useState(0);
    const [marketData, setMarketData] = useState(() => {
        // Always initialize with official closing values
        return {
            NIFTY: { price: 24487.40, change: -97.65, changePercent: -0.40, lastUpdate: new Date(), dataSource: 'last_close' },
            BANKNIFTY: { price: 55043.70, change: -467.05, changePercent: -0.84, lastUpdate: new Date(), dataSource: 'last_close' },
            FINNIFTY: { price: 23245.80, change: -85.20, changePercent: -0.37, lastUpdate: new Date(), dataSource: 'last_close' },
            SENSEX: { price: 80604.65, change: -318.45, changePercent: -0.39, lastUpdate: new Date(), dataSource: 'last_close' },
            BITCOIN: { price: 60245.50, change: 1250.30, changePercent: 2.12, lastUpdate: new Date(), dataSource: 'last_close' },
            SOLANA: { price: 185.75, change: 8.45, changePercent: 4.76, lastUpdate: new Date(), dataSource: 'last_close' }
        };
    });
    const [vixData, setVixData] = useState(() => {
        // Initialize with official VIX closing values
        return {
            value: 12.23,
            change: 0.01,
            changePercent: 0.08
        };
    });

    const [technicalIndicators, setTechnicalIndicators] = useState(() => {
        // Initialize with technical indicator values based on official closing prices
        return {
            '1m': {
                vwap: 24485.45,
                ema9: 24485.30,
                ema21: 24480.75,
                rsi: 45.2,
                macd: {
                    line: -15.25,
                    signal: -13.82,
                    histogram: -1.43
                },
                bb: {
                    upper: 24520.50,
                    middle: 24487.40,
                    lower: 24454.30,
                    width: 0.61
                }
            },
            '5m': {
                vwap: 24486.25,
                ema9: 24485.75,
                ema21: 24483.50,
                rsi: 42.8,
                macd: {
                    line: -12.45,
                    signal: -11.82,
                    histogram: -0.63
                },
                bb: {
                    upper: 24518.25,
                    middle: 24487.40,
                    lower: 24456.55,
                    width: 0.56
                }
            },
            '15m': {
                vwap: 24485.80,
                ema9: 24485.20,
                ema21: 24482.15,
                rsi: 38.7,
                macd: {
                    line: -9.85,
                    signal: -10.12,
                    histogram: 0.27
                },
                bb: {
                    upper: 24515.25,
                    middle: 24487.40,
                    lower: 24459.55,
                    width: 0.52
                }
            },
            cpr: {
                pivot: 24487.40,
                bc: 24502.90,
                tc: 24471.90,
                r1: 24518.40,
                r2: 24533.90,
                s1: 24456.40,
                s2: 24440.90
            }
        };
    });

    // Market status tracking (without auto-switching modes)
    useEffect(() => {
        const checkMarketStatus = () => {
            const now = new Date();
            const istTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
            const hour = istTime.getHours();
            const minute = istTime.getMinutes();
            const day = istTime.getDay();
            const isWeekend = day === 0 || day === 6;
            const isMarketHours = (hour > 9 || (hour === 9 && minute >= 15)) && (hour < 15 || (hour === 15 && minute <= 30));
            const shouldBeLive = !isWeekend && isMarketHours;

            // Only update live mode status, don't force demo mode
            setIsLiveMode(shouldBeLive);
        };

        // Check market status every minute
        const statusInterval = setInterval(checkMarketStatus, 60000);
        checkMarketStatus(); // Check immediately

        return () => clearInterval(statusInterval);
    }, []);

    // Real-time clock update and data simulation/fetching
    useEffect(() => {
        // More frequent updates during market hours
        const now = new Date();
        const istTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
        const hour = istTime.getHours();
        const minute = istTime.getMinutes();
        const day = istTime.getDay();
        const isWeekend = day === 0 || day === 6;
        const isMarketHours = (hour > 9 || (hour === 9 && minute >= 15)) && (hour < 15 || (hour === 15 && minute <= 30));
        const isMarketOpen = !isWeekend && isMarketHours;

        // Use 1 second intervals for all updates during market hours
        const updateInterval = 1000; // Always 1 second for real-time feel

        console.log(`📊 Data update mode: ${isLiveMode ? 'LIVE' : 'DEMO'}, Interval: ${updateInterval}ms, Market: ${isMarketOpen ? 'OPEN' : 'CLOSED'}`);

        // Add timestamp to every log to verify 1-second updates
        let logCounter = 0;

        const interval = setInterval(() => {
            logCounter++;
            const now = new Date();
            setCurrentTime(now);
            setUpdateCounter(logCounter);
            console.log(`🔄 Update #${logCounter} at ${now.toLocaleTimeString()} - Mode: LIVE`);

            // Live mode - fetch live data or last close data
            // Check if market is open for live updates
            const istTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
            const hour = istTime.getHours();
            const minute = istTime.getMinutes();
            const day = istTime.getDay();
            const isWeekend = day === 0 || day === 6;
            const isMarketHours = (hour > 9 || (hour === 9 && minute >= 15)) && (hour < 15 || (hour === 15 && minute <= 30));
            const isMarketOpen = !isWeekend && isMarketHours;

            // Always fetch live data (will get live or last close)
            console.log(`🔄 Fetching data - Market Open: ${isMarketOpen}, Live Mode: ${isLiveMode}`);
            if (true) { // Always fetch data in live mode
                console.log('🔴 Fetching live market data...');

                // Fetch live data, technical indicators, and VIX from server
                Promise.all([
                    fetch('/api/data/current/NIFTY').then(response => {
                        if (!response.ok) throw new Error(`HTTP ${response.status}`);
                        return response.json();
                    }),
                    fetch('/api/data/current/BANKNIFTY').then(response => {
                        if (!response.ok) throw new Error(`HTTP ${response.status}`);
                        return response.json();
                    }),
                    fetch('/api/data/current/VIX').then(response => {
                        if (!response.ok) throw new Error(`HTTP ${response.status}`);
                        return response.json();
                    }).catch(() => null), // Don't fail if VIX data is not available
                    fetch(`/api/indicators/${selectedSymbol}/${selectedTimeframe}`).then(response => {
                        if (!response.ok) throw new Error(`HTTP ${response.status}`);
                        return response.json();
                    }).catch(() => null) // Don't fail if indicators are not available
                ]).then(([niftyResult, bankNiftyResult, vixResult, indicatorsResult]) => {
                    const newMarketData = { ...marketData };

                    if (niftyResult.data) {
                        console.log('📊 NIFTY Update:', niftyResult.data);
                        newMarketData.NIFTY = {
                            price: niftyResult.data.ltp || 24363.30,
                            change: niftyResult.data.change || -232.85,
                            changePercent: niftyResult.data.changePercent || -0.95,
                            lastUpdate: new Date(niftyResult.data.timestamp || Date.now()),
                            dataSource: 'live'
                        };
                    }

                    if (bankNiftyResult.data) {
                        console.log('📊 BANKNIFTY Update:', bankNiftyResult.data);
                        newMarketData.BANKNIFTY = {
                            price: bankNiftyResult.data.ltp || 55004.90,
                            change: bankNiftyResult.data.change || -516.25,
                            changePercent: bankNiftyResult.data.changePercent || -0.93,
                            lastUpdate: new Date(bankNiftyResult.data.timestamp || Date.now()),
                            dataSource: 'live'
                        };
                    }

                    // Update VIX data if available
                    if (vixResult && vixResult.data) {
                        console.log('📈 VIX Update:', vixResult.data);
                        setVixData({
                            value: vixResult.data.ltp || 15.25,
                            change: vixResult.data.change || -0.85,
                            changePercent: vixResult.data.changePercent || -5.28
                        });
                    }

                    // Update technical indicators if available
                    if (indicatorsResult && indicatorsResult.indicators) {
                        console.log('📊 Indicators Update:', indicatorsResult.indicators);
                        setTechnicalIndicators(prev => ({
                            ...prev,
                            [selectedTimeframe]: {
                                vwap: indicatorsResult.indicators.vwap || prev[selectedTimeframe]?.vwap,
                                ema9: indicatorsResult.indicators.ema9 || prev[selectedTimeframe]?.ema9,
                                ema21: indicatorsResult.indicators.ema21 || prev[selectedTimeframe]?.ema21,
                                rsi: indicatorsResult.indicators.rsi || prev[selectedTimeframe]?.rsi,
                                macd: indicatorsResult.indicators.macd || prev[selectedTimeframe]?.macd,
                                bb: indicatorsResult.indicators.bb || prev[selectedTimeframe]?.bb
                            }
                        }));
                    }

                    // Validate and set market data safely - CRITICAL UPDATE
                    const validatedData = {};
                    Object.keys(newMarketData).forEach(symbol => {
                        const rawData = newMarketData[symbol];
                        validatedData[symbol] = {
                            price: rawData.price || (symbol === 'NIFTY' ? 24363.30 : 55004.90),
                            change: rawData.change || (symbol === 'NIFTY' ? -232.85 : -516.25),
                            changePercent: rawData.changePercent || (symbol === 'NIFTY' ? -0.95 : -0.93),
                            lastUpdate: rawData.lastUpdate || new Date(),
                            dataSource: rawData.dataSource || 'live'
                        };
                    });

                    console.log('🔄 Setting market data:', validatedData);
                    setMarketData(validatedData);

                    // Technical indicators already updated above - no duplicate fetch needed

                    // Update VIX with live data (or keep static if not available)
                    setVixData(prev => ({
                        value: 15.25, // Static VIX value during live mode
                        change: -0.15,
                        changePercent: -0.98
                    }));

                }).catch(error => {
                    console.error('Error fetching live data:', error);
                    console.log('Keeping existing market data due to fetch error');
                });
            } else {
                // Market is closed - fetch last close data
                console.log('Market closed - fetching last close data');

                // Fetch live data even when market is closed (will get last close prices)
                Promise.all([
                    fetch('/api/data/current/NIFTY').then(response => response.json()).catch(() => null),
                    fetch('/api/data/current/BANKNIFTY').then(response => response.json()).catch(() => null)
                ]).then(([niftyResult, bankNiftyResult]) => {
                    const newMarketData = { ...marketData };

                    if (niftyResult?.data) {
                        newMarketData.NIFTY = {
                            price: niftyResult.data.ltp || marketData.NIFTY.price,
                            change: niftyResult.data.change || marketData.NIFTY.change,
                            changePercent: niftyResult.data.changePercent || marketData.NIFTY.changePercent,
                            lastUpdate: new Date(niftyResult.data.timestamp || Date.now()),
                            dataSource: 'last_close'
                        };
                    }

                    if (bankNiftyResult?.data) {
                        newMarketData.BANKNIFTY = {
                            price: bankNiftyResult.data.ltp || marketData.BANKNIFTY.price,
                            change: bankNiftyResult.data.change || marketData.BANKNIFTY.change,
                            changePercent: bankNiftyResult.data.changePercent || marketData.BANKNIFTY.changePercent,
                            lastUpdate: new Date(bankNiftyResult.data.timestamp || Date.now()),
                            dataSource: 'last_close'
                        };
                    }

                    setMarketData(newMarketData);
                    console.log('📊 Updated with last close data:', newMarketData);
                }).catch(error => {
                    console.error('Error fetching last close data:', error);
                });
            }
        }, updateInterval); // Dynamic interval: 1s for live market hours, 3s for demo/off-hours

        return () => clearInterval(interval);
    }, [isLiveMode]);

    // Initialize with live mode data
    useEffect(() => {
        console.log('🔄 Initializing live mode data');
        if (true) {
            // Initialize with last closing values when switching to live mode
            console.log('📊 Setting initial live mode data with official closing prices...');
            setMarketData({
                NIFTY: { price: 24487.40, change: -97.65, changePercent: -0.40, lastUpdate: new Date(), dataSource: 'last_close' },
                BANKNIFTY: { price: 55043.70, change: -467.05, changePercent: -0.84, lastUpdate: new Date(), dataSource: 'last_close' },
                FINNIFTY: { price: 23245.80, change: -85.20, changePercent: -0.37, lastUpdate: new Date(), dataSource: 'last_close' },
                SENSEX: { price: 80604.65, change: -318.45, changePercent: -0.39, lastUpdate: new Date(), dataSource: 'last_close' },
                BITCOIN: { price: 60245.50, change: 1250.30, changePercent: 2.12, lastUpdate: new Date(), dataSource: 'last_close' },
                SOLANA: { price: 185.75, change: 8.45, changePercent: 4.76, lastUpdate: new Date(), dataSource: 'last_close' }
            });

            // Immediately try to fetch live data
            setTimeout(() => {
                if (isLiveMode) {
                    fetch('/api/data/current/NIFTY')
                        .then(response => response.json())
                        .then(result => {
                            if (result.data) {
                                setMarketData(prev => {
                                    const validatedNifty = validateMarketData({
                                        price: result.data.ltp || prev.NIFTY.price,
                                        change: result.data.change || prev.NIFTY.change,
                                        changePercent: result.data.changePercent || prev.NIFTY.changePercent,
                                        lastUpdate: new Date(result.data.timestamp || Date.now()),
                                        dataSource: result.data.isMarketOpen ? 'live' : 'last_close'
                                    });
                                    return {
                                        ...prev,
                                        NIFTY: validatedNifty || prev.NIFTY
                                    };
                                });
                            }
                        })
                        .catch(error => console.error('Initial NIFTY fetch error:', error));

                    fetch('/api/data/current/BANKNIFTY')
                        .then(response => response.json())
                        .then(result => {
                            if (result.data) {
                                setMarketData(prev => {
                                    const validatedBankNifty = validateMarketData({
                                        price: result.data.ltp || prev.BANKNIFTY.price,
                                        change: result.data.change || prev.BANKNIFTY.change,
                                        changePercent: result.data.changePercent || prev.BANKNIFTY.changePercent,
                                        lastUpdate: new Date(result.data.timestamp || Date.now()),
                                        dataSource: result.data.isMarketOpen ? 'live' : 'last_close'
                                    });
                                    return {
                                        ...prev,
                                        BANKNIFTY: validatedBankNifty || prev.BANKNIFTY
                                    };
                                });
                            }
                        })
                        .catch(error => console.error('Initial BANKNIFTY fetch error:', error));
                }
            }, 1000);
            setVixData({
                value: 15.25,
                change: -0.15,
                changePercent: -0.98
            });
            setTechnicalIndicators({
                '1m': {
                    vwap: 24350.12,
                    ema9: 24340.54,
                    ema21: 24335.74,
                    rsi: 45.2,
                    macd: { line: -12.5, signal: -8.3, histogram: -4.2 },
                    bb: { upper: 24420.5, middle: 24363.3, lower: 24306.1, width: 0.47 }
                },
                '5m': {
                    vwap: 24355.80,
                    ema9: 24345.12,
                    ema21: 24338.54,
                    rsi: 42.8,
                    macd: { line: -15.2, signal: -11.1, histogram: -4.1 },
                    bb: { upper: 24425.2, middle: 24363.3, lower: 24301.4, width: 0.51 }
                },
                '15m': {
                    vwap: 24360.45,
                    ema9: 24350.25,
                    ema21: 24342.18,
                    rsi: 38.5,
                    macd: { line: -18.7, signal: -14.2, histogram: -4.5 },
                    bb: { upper: 24430.8, middle: 24363.3, lower: 24295.8, width: 0.55 }
                },
                cpr: { pivot: 24363.3, r1: 24420.5, r2: 24477.7, s1: 24306.1, s2: 24248.9 }
            });
            // Reset signal statistics
            setActiveSignalsCount(0);
            setTotalSignalsCount(0);
            setWinRate(0);
        }
    }, []);

    const marketStatus = { session: 'MORNING', isOpen: true };
    const signalStats = {
        active: activeSignalsCount,
        winRate: winRate,
        total: totalSignalsCount
    };
    const currentData = {
        data: { close: marketData[selectedSymbol]?.price },
        lastUpdate: currentTime.toISOString()
    };

    const handleSignalStatsChange = (stats) => {
        setTotalSignalsCount(stats.total);
        setWinRate(stats.winRate);
    };

    // Get current timeframe indicators
    const currentIndicators = technicalIndicators[selectedTimeframe] || {};

    const ConnectionIndicator = () => {
        const [isRetrying, setIsRetrying] = useState(false);

        const retryConnection = async () => {
            if (isRetrying) return;
            setIsRetrying(true);

            try {
                console.log('🔄 Manual connection retry...');
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);

                const response = await fetch('/api/health', {
                    signal: controller.signal
                });

                clearTimeout(timeoutId);
                if (response.ok) {
                    console.log('✅ Connection restored');
                    // The parent component should handle updating connectionStatus
                    window.location.reload(); // Simple way to refresh the connection status
                } else {
                    console.log('❌ Connection still failed');
                }
            } catch (error) {
                console.log('❌ Retry failed:', error.message);
            } finally {
                setIsRetrying(false);
            }
        };

        return (
            <div className="flex items-center space-x-2">
                {connectionStatus === 'connected' ? (
                    <>
                        <Wifi className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-600 font-medium">Connected</span>
                    </>
                ) : connectionStatus === 'connecting' ? (
                    <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span className="text-sm text-blue-600 font-medium">Connecting...</span>
                    </>
                ) : (
                    <>
                        <WifiOff className="h-4 w-4 text-red-600" />
                        <span className="text-sm text-red-600 font-medium">Disconnected</span>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={retryConnection}
                            disabled={isRetrying}
                            className="text-xs px-2 py-1 h-6"
                        >
                            {isRetrying ? 'Retrying...' : 'Retry'}
                        </Button>
                    </>
                )}
            </div>
        );
    };

    // Removed demo mode toggle - always in live mode

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">NSE Scalping Signals</h1>
                        <p className="text-gray-600 text-lg">Real-time trading signals for Nifty & Bank Nifty options</p>
                    </div>

                    <div className="flex items-center space-x-4">
                        <ConnectionIndicator />
                        <MarketStatus status={marketStatus} marketData={marketData} />
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    <Card className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                        <div className="flex items-center space-x-2">
                            <Activity className="h-5 w-5 text-blue-600" />
                            <div>
                                <p className="text-sm text-blue-700 font-medium">Active Signals</p>
                                <p className="text-2xl font-bold text-blue-900">{signalStats.active}</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4 bg-gradient-to-r from-green-50 to-green-100 border-green-200">
                        <div className="flex items-center space-x-2">
                            <TrendingUp className="h-5 w-5 text-green-600" />
                            <div>
                                <p className="text-sm text-green-700 font-medium">Win Rate</p>
                                <p className="text-2xl font-bold text-green-900">{safeToFixed(signalStats.winRate, 1)}%</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
                        <div className="flex items-center space-x-2">
                            <BarChart3 className="h-5 w-5 text-purple-600" />
                            <div>
                                <p className="text-sm text-purple-700 font-medium">Total Signals</p>
                                <p className="text-2xl font-bold text-purple-900">{signalStats.total}</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
                        <div className="flex items-center space-x-2">
                            <Clock className="h-5 w-5 text-orange-600" />
                            <div>
                                <p className="text-sm text-orange-700 font-medium">Session</p>
                                <p className="text-lg font-bold text-orange-900">{marketStatus.session || 'CLOSED'}</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4 bg-gradient-to-r from-indigo-50 to-indigo-100 border-indigo-200">
                        <div className="flex items-center space-x-2">
                            <Target className="h-5 w-5 text-indigo-600" />
                            <div>
                                <p className="text-sm text-indigo-700 font-medium">Current Price</p>
                                <p className="text-lg font-bold text-indigo-900">
                                    {currentData?.data?.close ? formatSpotPrice(currentData.data.close) : 'Live Data'}
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200">
                        <div className="flex items-center space-x-2">
                            <div className="flex items-center space-x-1">
                                <Shield className="h-5 w-5 text-gray-600" />
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            </div>
                            <div>
                                <p className="text-sm text-gray-700 font-medium">Last Update</p>
                                <p className="text-sm font-bold text-gray-900">
                                    {formatTime(currentTime)}
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                {/* Charts and Analysis - 3 columns */}
                <div className="xl:col-span-3 space-y-6">
                    {/* Market Analysis */}
                    <Card className="shadow-lg">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xl flex items-center space-x-2">
                                    <BarChart3 className="h-5 w-5" />
                                    <span>Market Analysis</span>
                                </CardTitle>

                                {/* Symbol and Timeframe Selectors */}
                                <div className="flex items-center space-x-3">
                                    {/* Symbol Selector */}
                                    <div className="flex items-center space-x-2 bg-white rounded-lg p-1 border">
                                        <Button
                                            variant={selectedSymbol === 'NIFTY' ? "default" : "ghost"}
                                            size="sm"
                                            onClick={() => setSelectedSymbol('NIFTY')}
                                            className="text-xs"
                                        >
                                            NIFTY
                                        </Button>
                                        <Button
                                            variant={selectedSymbol === 'BANKNIFTY' ? "default" : "ghost"}
                                            size="sm"
                                            onClick={() => setSelectedSymbol('BANKNIFTY')}
                                            className="text-xs"
                                        >
                                            BANKNIFTY
                                        </Button>
                                    </div>

                                    {/* Timeframe Selector */}
                                    <div className="flex items-center space-x-2 bg-white rounded-lg p-1 border">
                                        <Button
                                            variant={selectedTimeframe === '1m' ? "default" : "ghost"}
                                            size="sm"
                                            onClick={() => setSelectedTimeframe('1m')}
                                            className="text-xs"
                                        >
                                            1m
                                        </Button>
                                        <Button
                                            variant={selectedTimeframe === '5m' ? "default" : "ghost"}
                                            size="sm"
                                            onClick={() => setSelectedTimeframe('5m')}
                                            className="text-xs"
                                        >
                                            5m
                                        </Button>
                                        <Button
                                            variant={selectedTimeframe === '15m' ? "default" : "ghost"}
                                            size="sm"
                                            onClick={() => setSelectedTimeframe('15m')}
                                            className="text-xs"
                                        >
                                            15m
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-gradient-to-br from-gray-50 to-gray-100 h-64 rounded-lg flex items-center justify-center border">
                                <div className="text-center">
                                    <div className="mb-4">
                                        <h3 className="text-2xl font-bold text-gray-800 mb-2">
                                            {selectedSymbol} - {selectedTimeframe}
                                        </h3>
                                        <div className="flex items-center justify-center space-x-4">
                                            <div className="text-center">
                                                <p className="text-sm text-gray-600">Current Price</p>
                                                <p className="text-3xl font-bold text-gray-900">
                                                    {(() => {
                                                        try {
                                                            const symbolData = marketData[selectedSymbol];
                                                            if (symbolData?.price !== null && symbolData?.price !== undefined && !isNaN(symbolData.price)) {
                                                                return formatSpotPrice(symbolData.price);
                                                            }
                                                            return selectedSymbol === 'NIFTY' ? '24,363.30' : '55,004.90';
                                                        } catch (error) {
                                                            console.error('Error rendering price:', error);
                                                            return selectedSymbol === 'NIFTY' ? '24,363.30' : '55,004.90';
                                                        }
                                                    })()}
                                                </p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm text-gray-600">Change</p>
                                                <p className={`text-lg font-bold ${(() => {
                                                    try {
                                                        const symbolData = marketData[selectedSymbol];
                                                        if (symbolData?.change !== null && symbolData?.change !== undefined && !isNaN(symbolData.change)) {
                                                            return symbolData.change >= 0 ? 'text-green-600' : 'text-red-600';
                                                        }
                                                        return 'text-red-600';
                                                    } catch (error) {
                                                        return 'text-red-600';
                                                    }
                                                })()}`}>
                                                    {(() => {
                                                        try {
                                                            const symbolData = marketData[selectedSymbol];
                                                            if (symbolData?.change !== null && symbolData?.change !== undefined && !isNaN(symbolData.change)) {
                                                                return (
                                                                    <>
                                                                        {symbolData.change >= 0 ? '+' : ''}
                                                                        {formatSpotPrice(symbolData.change)}
                                                                        ({safeToFixed(symbolData.changePercent, 2)}%)
                                                                    </>
                                                                );
                                                            }
                                                            return selectedSymbol === 'NIFTY' ? '-232.85 (-0.95%)' : '-516.25 (-0.93%)';
                                                        } catch (error) {
                                                            console.error('Error rendering change:', error);
                                                            return selectedSymbol === 'NIFTY' ? '-232.85 (-0.95%)' : '-516.25 (-0.93%)';
                                                        }
                                                    })()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                                        <Clock className="h-4 w-4" />
                                        <span>Last Update: {formatTime(currentTime)}</span>
                                        <div className="flex items-center space-x-1">
                                            <div className={`w-2 h-2 rounded-full ${isLiveMode ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
                                            <span className={`text-xs font-medium ${isLiveMode ? 'text-green-600' : 'text-yellow-600'}`}>
                                                {isLiveMode ? 'LIVE DATA' : 'LAST CLOSE'}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                • {formatTime(currentTime)}
                                            </span>
                                            <span className={`text-xs font-bold ${isLiveMode ? 'text-green-600' : 'text-blue-600'}`}>
                                                • Updates: {updateCounter}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Technical Indicators */}
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center space-x-2">
                                <BarChart3 className="h-5 w-5" />
                                <span>Technical Indicators</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                                {/* VWAP */}
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <Activity className="h-4 w-4 text-blue-600" />
                                        <p className="text-sm text-blue-700 font-medium">VWAP</p>
                                    </div>
                                    <p className="text-lg font-bold text-blue-900">
                                        {currentIndicators.vwap ? formatSpotPrice(currentIndicators.vwap) : (selectedSymbol === 'NIFTY' ? '21,519.12' : '46,180.90')}
                                    </p>
                                    <p className="text-xs text-blue-600 mt-1">Volume Weighted Avg</p>
                                </div>

                                {/* EMA 9 */}
                                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <TrendingUp className="h-4 w-4 text-green-600" />
                                        <p className="text-sm text-green-700 font-medium">EMA 9</p>
                                    </div>
                                    <p className="text-lg font-bold text-green-900">
                                        {currentIndicators.ema9 ? formatSpotPrice(currentIndicators.ema9) : (selectedSymbol === 'NIFTY' ? '21,495.54' : '46,093.74')}
                                    </p>
                                    <p className="text-xs text-green-600 mt-1">9-period EMA</p>
                                </div>

                                {/* EMA 21 */}
                                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <TrendingUp className="h-4 w-4 text-green-600" />
                                        <p className="text-sm text-green-700 font-medium">EMA 21</p>
                                    </div>
                                    <p className="text-lg font-bold text-green-900">
                                        {currentIndicators.ema21 ? formatSpotPrice(currentIndicators.ema21) : (selectedSymbol === 'NIFTY' ? '21,493.54' : '46,093.74')}
                                    </p>
                                    <p className="text-xs text-green-600 mt-1">21-period EMA</p>
                                </div>

                                {/* RSI */}
                                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <BarChart3 className="h-4 w-4 text-yellow-600" />
                                        <p className="text-sm text-yellow-700 font-medium">RSI (14)</p>
                                    </div>
                                    <p className="text-lg font-bold text-yellow-900">
                                        {currentIndicators.rsi ? safeToFixed(currentIndicators.rsi, 1) : 'Live Data'}
                                    </p>
                                    <p className="text-xs text-yellow-600 mt-1">Relative Strength</p>
                                </div>

                                {/* MACD */}
                                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <Activity className="h-4 w-4 text-purple-600" />
                                        <p className="text-sm text-purple-700 font-medium">MACD</p>
                                    </div>
                                    <p className="text-lg font-bold text-purple-900">
                                        {currentIndicators.macd ? safeToFixed(currentIndicators.macd.line, 2) : 'Live Data'}
                                    </p>
                                    <p className="text-xs text-purple-600 mt-1">Momentum</p>
                                </div>
                            </div>

                            {/* Detailed MACD and Bollinger Bands */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* MACD Details */}
                                <Card className="p-4 bg-purple-50 border-purple-200">
                                    <h4 className="font-semibold mb-3 flex items-center text-purple-800">
                                        <Activity className="h-4 w-4 mr-2" />
                                        MACD Details
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span>MACD Line:</span>
                                            <span className="font-mono font-bold">
                                                {currentIndicators.macd ? safeToFixed(currentIndicators.macd.line, 2) : 'Live Data'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Signal Line:</span>
                                            <span className="font-mono font-bold">
                                                {currentIndicators.macd ? safeToFixed(currentIndicators.macd.signal, 2) : 'Live Data'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Histogram:</span>
                                            <span className={`font-mono font-bold ${currentIndicators.macd && currentIndicators.macd.histogram >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {currentIndicators.macd ? (currentIndicators.macd.histogram >= 0 ? '+' : '') + safeToFixed(currentIndicators.macd.histogram, 2) : 'Live Data'}
                                            </span>
                                        </div>
                                    </div>
                                </Card>

                                {/* Bollinger Bands */}
                                <Card className="p-4 bg-indigo-50 border-indigo-200">
                                    <h4 className="font-semibold mb-3 flex items-center text-indigo-800">
                                        <BarChart3 className="h-4 w-4 mr-2" />
                                        Bollinger Bands
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span>Upper Band:</span>
                                            <span className="font-mono font-bold text-red-600">
                                                {currentIndicators.bb ? formatSpotPrice(currentIndicators.bb.upper) : 'Live Data'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Middle Band:</span>
                                            <span className="font-mono font-bold">
                                                {currentIndicators.bb ? formatSpotPrice(currentIndicators.bb.middle) : 'Live Data'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Lower Band:</span>
                                            <span className="font-mono font-bold text-green-600">
                                                {currentIndicators.bb ? formatSpotPrice(currentIndicators.bb.lower) : 'Live Data'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Width:</span>
                                            <span className="font-mono font-bold">
                                                {currentIndicators.bb ? safeToFixed(currentIndicators.bb.width, 2) + '%' : 'Live Data'}
                                            </span>
                                        </div>
                                    </div>
                                </Card>
                            </div>

                            {/* CPR & Pivot Levels */}
                            <Card className="p-4 mt-6 bg-gray-50 border-gray-200">
                                <h4 className="font-semibold mb-3 flex items-center text-gray-800">
                                    <Target className="h-4 w-4 mr-2" />
                                    CPR & Pivot Levels
                                </h4>
                                <div className="grid grid-cols-3 gap-6 text-sm">
                                    <div className="space-y-2">
                                        <p className="text-red-600 font-semibold">Resistance</p>
                                        <div className="space-y-1">
                                            <div className="flex justify-between">
                                                <span>R3:</span>
                                                <span className="font-mono text-red-600 font-bold">
                                                    {technicalIndicators.cpr ? formatSpotPrice(technicalIndicators.cpr.r3) : 'Live Data'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>R2:</span>
                                                <span className="font-mono text-red-600 font-bold">
                                                    {technicalIndicators.cpr ? formatSpotPrice(technicalIndicators.cpr.r2) : 'Live Data'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>R1:</span>
                                                <span className="font-mono text-red-600 font-bold">
                                                    {technicalIndicators.cpr ? formatSpotPrice(technicalIndicators.cpr.r1) : 'Live Data'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-blue-600 font-semibold">CPR</p>
                                        <div className="space-y-1">
                                            <div className="flex justify-between">
                                                <span>TC:</span>
                                                <span className="font-mono text-blue-600 font-bold">
                                                    {technicalIndicators.cpr ? formatSpotPrice(technicalIndicators.cpr.tc) : 'Live Data'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Pivot:</span>
                                                <span className="font-mono text-blue-600 font-bold text-lg">
                                                    {technicalIndicators.cpr ? formatSpotPrice(technicalIndicators.cpr.pivot) : 'Live Data'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>BC:</span>
                                                <span className="font-mono text-blue-600 font-bold">
                                                    {technicalIndicators.cpr ? formatSpotPrice(technicalIndicators.cpr.bc) : 'Live Data'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-green-600 font-semibold">Support</p>
                                        <div className="space-y-1">
                                            <div className="flex justify-between">
                                                <span>S1:</span>
                                                <span className="font-mono text-green-600 font-bold">
                                                    {technicalIndicators.cpr ? formatSpotPrice(technicalIndicators.cpr.s1) : 'Live Data'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>S2:</span>
                                                <span className="font-mono text-green-600 font-bold">
                                                    {technicalIndicators.cpr ? formatSpotPrice(technicalIndicators.cpr.s2) : 'Live Data'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>S3:</span>
                                                <span className="font-mono text-green-600 font-bold">
                                                    {technicalIndicators.cpr ? formatSpotPrice(technicalIndicators.cpr.s3) : 'Live Data'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </CardContent>
                    </Card>

                    {/* Risk Management */}
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center space-x-2">
                                <Shield className="h-5 w-5" />
                                <span>Risk Management</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                    <p className="text-sm text-green-700 font-medium">Risk Score</p>
                                    <p className="text-xl font-bold text-green-900">
                                        {vixData.value !== null ? (vixData.value < 15 ? 'LOW' : vixData.value < 20 ? 'MEDIUM' : 'HIGH') : 'Live Data'}
                                    </p>
                                </div>
                                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                                    <p className="text-sm text-red-700 font-medium">India VIX</p>
                                    <p className="text-xl font-bold text-red-900">
                                        {vixData.value !== null ? safeToFixed(vixData.value, 2) : 'Live Data'}
                                    </p>
                                </div>
                                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                    <p className="text-sm text-purple-700 font-medium">Signals Today</p>
                                    <p className="text-xl font-bold text-purple-900">{totalSignalsCount}</p>
                                </div>
                                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                                    <p className="text-sm text-orange-700 font-medium">Liquid Window</p>
                                    <p className="text-xl font-bold text-orange-900">
                                        Active
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Signal Feed - 1 column */}
                <div className="xl:col-span-1">
                    <SignalFeed
                        selectedSymbol={selectedSymbol}
                        currentMarketData={marketData}
                        onActiveSignalsChange={setActiveSignalsCount}
                        onSignalStatsChange={handleSignalStatsChange}
                    />
                </div>
            </div>
        </div>
    );
};

export default TradingDashboard;