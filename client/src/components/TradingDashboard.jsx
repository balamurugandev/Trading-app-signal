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

// Enhanced Market Status Component
const MarketStatus = ({ status, isDemoMode }) => {
    const now = new Date();
    const istTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
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
                            const premium = symbol === 'NIFTY' ? 50 + Math.random() * 100 : 80 + Math.random() * 150;

                            const signal = {
                                id: `manual_${Date.now()}_${Math.random()}`,
                                symbol,
                                timeframe,
                                type: 'BUY',
                                entryPrice: entryPrice,
                                spotPrice: entryPrice,
                                optionStrike: strike,
                                optionType: 'CALL',
                                premium: premium,
                                stopLoss: entryPrice - (entryPrice * 0.01),
                                target1: entryPrice + (entryPrice * 0.015),
                                target2: entryPrice + (entryPrice * 0.025),
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

                            setTotalSignalsGenerated(prev => prev + 1);
                            setDemoSignals(prev => [signal, ...prev]);
                        }}
                        className="text-xs"
                    >
                        Generate Signal
                    </Button>
                )}
            </div>

            {isDemoMode ? (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mb-4">
                    <div className="flex items-center space-x-2">
                        <Database className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">Demo Mode - Simulated Signals</span>
                    </div>
                </div>
            ) : (
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
    const [isLiveMode, setIsLiveMode] = useState(false);
    const [isDemoMode, setIsDemoMode] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [activeSignalsCount, setActiveSignalsCount] = useState(0);
    const [totalSignalsCount, setTotalSignalsCount] = useState(0);
    const [winRate, setWinRate] = useState(0);
    const [marketData, setMarketData] = useState(() => {
        if (isDemoMode) {
            return {
                NIFTY: { price: 21520.35, change: +15.25, changePercent: +0.07 },
                BANKNIFTY: { price: 46180.50, change: -25.75, changePercent: -0.06 }
            };
        }
        return {
            NIFTY: { price: null, change: null, changePercent: null },
            BANKNIFTY: { price: null, change: null, changePercent: null }
        };
    });
    const [vixData, setVixData] = useState(() => {
        if (isDemoMode) {
            return {
                value: 15.25,
                change: -0.85,
                changePercent: -5.28
            };
        }
        return {
            value: null,
            change: null,
            changePercent: null
        };
    });

    const [technicalIndicators, setTechnicalIndicators] = useState(() => {
        if (isDemoMode) {
            return {
                vwap: 21515.25,
                ema9: 21508.75,
                ema21: 21495.50,
                rsi: 58.2,
                macd: {
                    line: 12.45,
                    signal: 11.82,
                    histogram: 0.63
                },
                bb: {
                    upper: 21580.25,
                    middle: 21520.00,
                    lower: 21459.75,
                    width: 0.56
                },
                cpr: {
                    r3: 21645.50,
                    r2: 21590.25,
                    r1: 21555.75,
                    tc: 21535.00,
                    pivot: 21520.00,
                    bc: 21505.00,
                    s1: 21484.25,
                    s2: 21449.75,
                    s3: 21394.50
                }
            };
        }
        return {
            vwap: null,
            ema9: null,
            ema21: null,
            rsi: null,
            macd: null,
            bb: null,
            cpr: null
        };
    });

    // Real-time clock update and demo data simulation
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());

            if (isDemoMode) {
                setMarketData(prev => ({
                    NIFTY: {
                        price: prev.NIFTY.price + (Math.random() - 0.5) * 2,
                        change: prev.NIFTY.change + (Math.random() - 0.5) * 0.5,
                        changePercent: prev.NIFTY.changePercent + (Math.random() - 0.5) * 0.01
                    },
                    BANKNIFTY: {
                        price: prev.BANKNIFTY.price + (Math.random() - 0.5) * 5,
                        change: prev.BANKNIFTY.change + (Math.random() - 0.5) * 1,
                        changePercent: prev.BANKNIFTY.changePercent + (Math.random() - 0.5) * 0.01
                    }
                }));

                setVixData(prev => ({
                    value: Math.max(10, Math.min(30, prev.value + (Math.random() - 0.5) * 0.5)),
                    change: prev.change + (Math.random() - 0.5) * 0.2,
                    changePercent: prev.changePercent + (Math.random() - 0.5) * 1
                }));

                // Update technical indicators with realistic variations
                setTechnicalIndicators(prev => ({
                    vwap: prev.vwap + (Math.random() - 0.5) * 1.5,
                    ema9: prev.ema9 + (Math.random() - 0.5) * 1.2,
                    ema21: prev.ema21 + (Math.random() - 0.5) * 0.8,
                    rsi: Math.max(20, Math.min(80, prev.rsi + (Math.random() - 0.5) * 2)),
                    macd: {
                        line: prev.macd.line + (Math.random() - 0.5) * 0.5,
                        signal: prev.macd.signal + (Math.random() - 0.5) * 0.3,
                        histogram: prev.macd.histogram + (Math.random() - 0.5) * 0.2
                    },
                    bb: {
                        upper: prev.bb.upper + (Math.random() - 0.5) * 2,
                        middle: prev.bb.middle + (Math.random() - 0.5) * 1.5,
                        lower: prev.bb.lower + (Math.random() - 0.5) * 2,
                        width: Math.max(0.2, Math.min(1.5, prev.bb.width + (Math.random() - 0.5) * 0.1))
                    },
                    cpr: prev.cpr // CPR levels typically don't change intraday
                }));
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [isDemoMode]);

    // Handle mode switching - clear demo data when switching to live mode
    useEffect(() => {
        if (!isDemoMode) {
            // Clear demo data when switching to live mode
            setMarketData({
                NIFTY: { price: null, change: null, changePercent: null },
                BANKNIFTY: { price: null, change: null, changePercent: null }
            });
            setVixData({
                value: null,
                change: null,
                changePercent: null
            });
            setTechnicalIndicators({
                vwap: null,
                ema9: null,
                ema21: null,
                rsi: null,
                macd: null,
                bb: null,
                cpr: null
            });
            // Reset signal statistics
            setActiveSignalsCount(0);
            setTotalSignalsCount(0);
            setWinRate(0);
        } else {
            // Initialize demo data when switching to demo mode
            setMarketData({
                NIFTY: { price: 21520.35, change: +15.25, changePercent: +0.07 },
                BANKNIFTY: { price: 46180.50, change: -25.75, changePercent: -0.06 }
            });
            setVixData({
                value: 15.25,
                change: -0.85,
                changePercent: -5.28
            });
            setTechnicalIndicators({
                vwap: 21515.25,
                ema9: 21508.75,
                ema21: 21495.50,
                rsi: 58.2,
                macd: {
                    line: 12.45,
                    signal: 11.82,
                    histogram: 0.63
                },
                bb: {
                    upper: 21580.25,
                    middle: 21520.00,
                    lower: 21459.75,
                    width: 0.56
                },
                cpr: {
                    r3: 21645.50,
                    r2: 21590.25,
                    r1: 21555.75,
                    tc: 21535.00,
                    pivot: 21520.00,
                    bc: 21505.00,
                    s1: 21484.25,
                    s2: 21449.75,
                    s3: 21394.50
                }
            });
        }
    }, [isDemoMode]);

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

    const ConnectionIndicator = () => (
        <div className="flex items-center space-x-2">
            {connectionStatus === 'connected' ? (
                <>
                    <Wifi className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600 font-medium">Connected</span>
                </>
            ) : (
                <>
                    <WifiOff className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-red-600 font-medium">
                        {connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
                    </span>
                </>
            )}
        </div>
    );

    const DataModeToggle = () => (
        <div className="flex items-center space-x-2 bg-white rounded-lg p-1 border">
            <Button
                variant={isDemoMode ? "default" : "ghost"}
                size="sm"
                onClick={() => {
                    setIsDemoMode(true);
                    setIsLiveMode(false);
                }}
                className="flex items-center space-x-1"
            >
                <Database className="h-4 w-4" />
                <span>Demo</span>
            </Button>
            <Button
                variant={!isDemoMode ? "default" : "ghost"}
                size="sm"
                onClick={() => {
                    setIsDemoMode(false);
                    setIsLiveMode(true);
                }}
                className="flex items-center space-x-1"
            >
                <Zap className="h-4 w-4" />
                <span>Live</span>
            </Button>
        </div>
    );

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
                        <DataModeToggle />
                        <MarketStatus status={marketStatus} isDemoMode={isDemoMode} />
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
                                <p className="text-2xl font-bold text-green-900">{signalStats.winRate.toFixed(1)}%</p>
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
                                    {currentData?.data?.close ? formatSpotPrice(currentData.data.close) : (isDemoMode ? '--' : 'Live Data')}
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
                            <CardTitle className="text-xl flex items-center space-x-2">
                                <BarChart3 className="h-5 w-5" />
                                <span>Market Analysis</span>
                            </CardTitle>
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
                                                    {marketData[selectedSymbol]?.price ? formatSpotPrice(marketData[selectedSymbol].price) : (isDemoMode ? '--' : 'Live Data')}
                                                </p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm text-gray-600">Change</p>
                                                <p className={`text-lg font-bold ${marketData[selectedSymbol]?.change >= 0 ? 'text-green-600' : 'text-red-600'
                                                    }`}>
                                                    {marketData[selectedSymbol]?.change !== null ? (
                                                        <>
                                                            {marketData[selectedSymbol]?.change >= 0 ? '+' : ''}
                                                            {formatSpotPrice(marketData[selectedSymbol]?.change)}
                                                            ({marketData[selectedSymbol]?.changePercent?.toFixed(2)}%)
                                                        </>
                                                    ) : (isDemoMode ? '--' : 'Live Data')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                                        <Clock className="h-4 w-4" />
                                        <span>Last Update: {formatTime(currentTime)}</span>
                                        {isDemoMode ? (
                                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                        ) : (
                                            <div className="flex items-center space-x-1">
                                                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                                                <span className="text-xs text-orange-600 font-medium">Waiting for live data</span>
                                            </div>
                                        )}
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
                                        {technicalIndicators.vwap ? formatSpotPrice(technicalIndicators.vwap) : (isDemoMode ? '--' : 'Live Data')}
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
                                        {technicalIndicators.ema9 ? formatSpotPrice(technicalIndicators.ema9) : (isDemoMode ? '--' : 'Live Data')}
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
                                        {technicalIndicators.ema21 ? formatSpotPrice(technicalIndicators.ema21) : (isDemoMode ? '--' : 'Live Data')}
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
                                        {technicalIndicators.rsi ? technicalIndicators.rsi.toFixed(1) : (isDemoMode ? '--' : 'Live Data')}
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
                                        {technicalIndicators.macd ? technicalIndicators.macd.line.toFixed(2) : (isDemoMode ? '--' : 'Live Data')}
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
                                                {technicalIndicators.macd ? technicalIndicators.macd.line.toFixed(2) : (isDemoMode ? '--' : 'Live Data')}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Signal Line:</span>
                                            <span className="font-mono font-bold">
                                                {technicalIndicators.macd ? technicalIndicators.macd.signal.toFixed(2) : (isDemoMode ? '--' : 'Live Data')}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Histogram:</span>
                                            <span className={`font-mono font-bold ${technicalIndicators.macd && technicalIndicators.macd.histogram >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {technicalIndicators.macd ? (technicalIndicators.macd.histogram >= 0 ? '+' : '') + technicalIndicators.macd.histogram.toFixed(2) : (isDemoMode ? '--' : 'Live Data')}
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
                                                {technicalIndicators.bb ? formatSpotPrice(technicalIndicators.bb.upper) : (isDemoMode ? '--' : 'Live Data')}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Middle Band:</span>
                                            <span className="font-mono font-bold">
                                                {technicalIndicators.bb ? formatSpotPrice(technicalIndicators.bb.middle) : (isDemoMode ? '--' : 'Live Data')}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Lower Band:</span>
                                            <span className="font-mono font-bold text-green-600">
                                                {technicalIndicators.bb ? formatSpotPrice(technicalIndicators.bb.lower) : (isDemoMode ? '--' : 'Live Data')}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Width:</span>
                                            <span className="font-mono font-bold">
                                                {technicalIndicators.bb ? technicalIndicators.bb.width.toFixed(2) + '%' : (isDemoMode ? '--' : 'Live Data')}
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
                                                    {technicalIndicators.cpr ? formatSpotPrice(technicalIndicators.cpr.r3) : (isDemoMode ? '--' : 'Live Data')}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>R2:</span>
                                                <span className="font-mono text-red-600 font-bold">
                                                    {technicalIndicators.cpr ? formatSpotPrice(technicalIndicators.cpr.r2) : (isDemoMode ? '--' : 'Live Data')}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>R1:</span>
                                                <span className="font-mono text-red-600 font-bold">
                                                    {technicalIndicators.cpr ? formatSpotPrice(technicalIndicators.cpr.r1) : (isDemoMode ? '--' : 'Live Data')}
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
                                                    {technicalIndicators.cpr ? formatSpotPrice(technicalIndicators.cpr.tc) : (isDemoMode ? '--' : 'Live Data')}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Pivot:</span>
                                                <span className="font-mono text-blue-600 font-bold text-lg">
                                                    {technicalIndicators.cpr ? formatSpotPrice(technicalIndicators.cpr.pivot) : (isDemoMode ? '--' : 'Live Data')}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>BC:</span>
                                                <span className="font-mono text-blue-600 font-bold">
                                                    {technicalIndicators.cpr ? formatSpotPrice(technicalIndicators.cpr.bc) : (isDemoMode ? '--' : 'Live Data')}
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
                                                    {technicalIndicators.cpr ? formatSpotPrice(technicalIndicators.cpr.s1) : (isDemoMode ? '--' : 'Live Data')}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>S2:</span>
                                                <span className="font-mono text-green-600 font-bold">
                                                    {technicalIndicators.cpr ? formatSpotPrice(technicalIndicators.cpr.s2) : (isDemoMode ? '--' : 'Live Data')}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>S3:</span>
                                                <span className="font-mono text-green-600 font-bold">
                                                    {technicalIndicators.cpr ? formatSpotPrice(technicalIndicators.cpr.s3) : (isDemoMode ? '--' : 'Live Data')}
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
                                        {vixData.value !== null ? (vixData.value < 15 ? 'LOW' : vixData.value < 20 ? 'MEDIUM' : 'HIGH') : (isDemoMode ? '--' : 'Live Data')}
                                    </p>
                                </div>
                                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                                    <p className="text-sm text-red-700 font-medium">India VIX</p>
                                    <p className="text-xl font-bold text-red-900">
                                        {vixData.value !== null ? vixData.value.toFixed(2) : (isDemoMode ? '--' : 'Live Data')}
                                    </p>
                                </div>
                                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                    <p className="text-sm text-purple-700 font-medium">Signals Today</p>
                                    <p className="text-xl font-bold text-purple-900">{totalSignalsCount}</p>
                                </div>
                                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                                    <p className="text-sm text-orange-700 font-medium">Liquid Window</p>
                                    <p className="text-xl font-bold text-orange-900">
                                        {isDemoMode ? 'Demo' : 'Active'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Signal Feed - 1 column */}
                <div className="xl:col-span-1">
                    <SignalFeed
                        isDemoMode={isDemoMode}
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