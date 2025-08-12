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
const MarketStatus = ({ status, isDemoMode, marketData }) => {
    const now = new Date();
    const istTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const hour = istTime.getHours();
    const minute = istTime.getMinutes();
    const day = istTime.getDay(); // 0 = Sunday, 6 = Saturday

    // Check if market is actually open (9:15 AM - 3:30 PM, Mon-Fri)
    const isWeekend = day === 0 || day === 6;
    const isMarketHours = (hour > 9 || (hour === 9 && minute >= 15)) && (hour < 15 || (hour === 15 && minute <= 30));
    const isActuallyOpen = !isWeekend && isMarketHours && !isDemoMode;

    // Check if in liquid window (9:25-11:00, 13:45-15:05)
    const isLiquidWindow = ((hour > 9 || (hour === 9 && minute >= 25)) && hour < 11) || 
                          ((hour > 13 || (hour === 13 && minute >= 45)) && (hour < 15 || (hour === 15 && minute <= 5)));

    const getStatusColor = () => {
        if (isDemoMode) return 'bg-blue-500';
        if (isActuallyOpen && isLiquidWindow) return 'bg-green-500';
        if (isActuallyOpen) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    const getStatusText = () => {
        if (isDemoMode) return 'Demo Mode';
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
        if (isDemoMode) return '';
        if (!isActuallyOpen) return ' • Showing Last Close';
        return ' • Live Data';
    };

    return (
        <div className="flex flex-col items-start space-y-1">
            <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 ${getStatusColor()} rounded-full ${isActuallyOpen ? 'animate-pulse' : ''}`}></div>
                <span className="text-sm font-medium">{getStatusText()}</span>
            </div>
            {!isDemoMode && (
                <div className="text-xs text-gray-500">
                    {getDataSourceText()}
                </div>
            )}
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
    const [isDemoMode, setIsDemoMode] = useState(false); // Default to live mode, let user choose demo mode
    const [showSettings, setShowSettings] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [activeSignalsCount, setActiveSignalsCount] = useState(0);
    const [updateCounter, setUpdateCounter] = useState(0);
    const [totalSignalsCount, setTotalSignalsCount] = useState(0);
    const [winRate, setWinRate] = useState(0);
    const [marketData, setMarketData] = useState(() => {
        // Always initialize with official closing values
        // Demo mode will override these if needed
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
        if (isDemoMode) {
            return {
                '1m': {
                    vwap: 21518.45,
                    ema9: 21512.30,
                    ema21: 21498.75,
                    rsi: 62.8,
                    macd: {
                        line: 15.25,
                        signal: 13.82,
                        histogram: 1.43
                    },
                    bb: {
                        upper: 21585.50,
                        middle: 21520.00,
                        lower: 21454.50,
                        width: 0.61
                    }
                },
                '5m': {
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
                    }
                },
                '15m': {
                    vwap: 21512.80,
                    ema9: 21505.20,
                    ema21: 21492.15,
                    rsi: 54.7,
                    macd: {
                        line: 9.85,
                        signal: 10.12,
                        histogram: -0.27
                    },
                    bb: {
                        upper: 21575.80,
                        middle: 21520.00,
                        lower: 21464.20,
                        width: 0.52
                    }
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
        // Return technical indicator values based on official closing prices
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
            console.log(`🔄 Update #${logCounter} at ${now.toLocaleTimeString()} - Mode: ${isLiveMode ? 'LIVE' : 'DEMO'}`);

            if (isDemoMode) {
                // Update demo market data
                setMarketData(prev => {
                    const validatedNifty = validateMarketData({
                        price: prev.NIFTY.price + (Math.random() - 0.5) * 2,
                        change: prev.NIFTY.change + (Math.random() - 0.5) * 0.5,
                        changePercent: prev.NIFTY.changePercent + (Math.random() - 0.5) * 0.01,
                        lastUpdate: new Date(),
                        dataSource: 'demo'
                    });
                    
                    const validatedBankNifty = validateMarketData({
                        price: prev.BANKNIFTY.price + (Math.random() - 0.5) * 5,
                        change: prev.BANKNIFTY.change + (Math.random() - 0.5) * 1,
                        changePercent: prev.BANKNIFTY.changePercent + (Math.random() - 0.5) * 0.01,
                        lastUpdate: new Date(),
                        dataSource: 'demo'
                    });
                    
                    return {
                        NIFTY: validatedNifty || prev.NIFTY,
                        BANKNIFTY: validatedBankNifty || prev.BANKNIFTY
                    };
                });
                
                // Update technical indicators dynamically in demo mode
                setTechnicalIndicators(prev => {
                    const currentSymbolData = prev[selectedTimeframe] || {};
                    const currentPrice = marketData[selectedSymbol]?.price || 24000;
                    
                    return {
                        ...prev,
                        [selectedTimeframe]: {
                            vwap: currentPrice + (Math.random() - 0.5) * 10,
                            ema9: currentPrice + (Math.random() - 0.5) * 8,
                            ema21: currentPrice + (Math.random() - 0.5) * 15,
                            rsi: Math.max(20, Math.min(80, (currentSymbolData.rsi || 50) + (Math.random() - 0.5) * 2)),
                            macd: {
                                line: (currentSymbolData.macd?.line || 0) + (Math.random() - 0.5) * 1,
                                signal: (currentSymbolData.macd?.signal || 0) + (Math.random() - 0.5) * 0.8,
                                histogram: (currentSymbolData.macd?.histogram || 0) + (Math.random() - 0.5) * 0.5
                            },
                            bb: {
                                upper: currentPrice + 50 + Math.random() * 10,
                                middle: currentPrice + (Math.random() - 0.5) * 5,
                                lower: currentPrice - 50 - Math.random() * 10,
                                width: Math.max(0.2, Math.min(1.0, (currentSymbolData.bb?.width || 0.5) + (Math.random() - 0.5) * 0.05))
                            }
                        }
                    };
                });
                
                // Update demo VIX data with realistic movements
                setVixData(prev => {
                    const baseVix = 15.25;
                    const volatility = 0.1; // Small movements each second
                    const newValue = Math.max(10, Math.min(30, prev.value + (Math.random() - 0.5) * volatility));
                    const change = newValue - baseVix;
                    const changePercent = (change / baseVix) * 100;
                    
                    return {
                        value: newValue,
                        change: change,
                        changePercent: changePercent
                    };
                });
                
            } else if (isLiveMode) {
                // Check if market is open for live updates
                const now = new Date();
                const istTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
                const hour = istTime.getHours();
                const minute = istTime.getMinutes();
                const day = istTime.getDay();
                const isWeekend = day === 0 || day === 6;
                const isMarketHours = (hour > 9 || (hour === 9 && minute >= 15)) && (hour < 15 || (hour === 15 && minute <= 30));
                const isMarketOpen = !isWeekend && isMarketHours;

                // Fetch live data during market hours
                if (isMarketOpen) {
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
                    // Market is closed - keep all data static (no updates)
                    console.log('Market closed - keeping static data');
                }
            }
        }, updateInterval); // Dynamic interval: 1s for live market hours, 3s for demo/off-hours

        return () => clearInterval(interval);
    }, [isDemoMode, isLiveMode]);

    // Handle mode switching - clear demo data when switching to live mode
    useEffect(() => {
        console.log('🔄 Mode switching useEffect triggered:', { isDemoMode, isLiveMode });
        if (!isDemoMode) {
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
        } else {
            // Initialize demo data when switching to demo mode (using realistic values around closing prices)
            setMarketData({
                NIFTY: { price: 24490.35, change: +2.95, changePercent: +0.012, lastUpdate: new Date(), dataSource: 'demo' },
                BANKNIFTY: { price: 55050.50, change: +6.80, changePercent: +0.012, lastUpdate: new Date(), dataSource: 'demo' },
                FINNIFTY: { price: 23250.25, change: +4.45, changePercent: +0.019, lastUpdate: new Date(), dataSource: 'demo' },
                SENSEX: { price: 80620.15, change: +15.50, changePercent: +0.019, lastUpdate: new Date(), dataSource: 'demo' },
                BITCOIN: { price: 60380.75, change: +135.25, changePercent: +0.22, lastUpdate: new Date(), dataSource: 'demo' },
                SOLANA: { price: 187.25, change: +1.50, changePercent: +0.81, lastUpdate: new Date(), dataSource: 'demo' }
            });
            setVixData({
                value: 12.25,
                change: +0.02,
                changePercent: +0.16
            });
            setTechnicalIndicators({
                '1m': {
                    vwap: 21518.45,
                    ema9: 21512.30,
                    ema21: 21498.75,
                    rsi: 62.8,
                    macd: {
                        line: 15.25,
                        signal: 13.82,
                        histogram: 1.43
                    },
                    bb: {
                        upper: 21585.50,
                        middle: 21520.00,
                        lower: 21454.50,
                        width: 0.61
                    }
                },
                '5m': {
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
                    }
                },
                '15m': {
                    vwap: 21512.80,
                    ema9: 21505.20,
                    ema21: 21492.15,
                    rsi: 54.7,
                    macd: {
                        line: 9.85,
                        signal: 10.12,
                        histogram: -0.27
                    },
                    bb: {
                        upper: 21575.80,
                        middle: 21520.00,
                        lower: 21464.20,
                        width: 0.52
                    }
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

    const DataModeToggle = () => {
        const [isToggling, setIsToggling] = useState(false);
        
        const switchToDemo = async () => {
            if (isToggling) return;
            setIsToggling(true);
            
            try {
                console.log('🎮 Switching to Demo mode...');
                
                // Try to call the API, but don't fail if it's not available
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 5000);
                    
                    const response = await fetch('/api/data/disable-live', { 
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        signal: controller.signal
                    });
                    
                    clearTimeout(timeoutId);
                    
                    if (response.ok) {
                        const result = await response.json();
                        console.log('✅ Server confirmed demo mode:', result);
                    } else {
                        console.warn('⚠️ Server API call failed, switching locally');
                    }
                } catch (apiError) {
                    console.warn('⚠️ Server not available, switching to demo mode locally:', apiError.message);
                }
                
                // Always switch to demo mode locally regardless of API success
                setIsDemoMode(true);
                setIsLiveMode(false);
                console.log('🎮 Successfully switched to Demo mode');
                
            } catch (error) {
                console.error('❌ Failed to switch to demo mode:', error);
                // Still switch locally even if there's an error
                setIsDemoMode(true);
                setIsLiveMode(false);
            } finally {
                setIsToggling(false);
            }
        };
        
        const switchToLive = async () => {
            if (isToggling) return;
            setIsToggling(true);
            
            try {
                console.log('📡 Switching to Live mode with Yahoo Finance...');
                
                // Try to call the API
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 10000);
                    
                    const response = await fetch('/api/data/enable-live', { 
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        signal: controller.signal
                    });
                    
                    clearTimeout(timeoutId);
                    
                    if (response.ok) {
                        const result = await response.json();
                        if (result.success) {
                            console.log('✅ Server confirmed live mode:', result);
                            setIsDemoMode(false);
                            setIsLiveMode(true);
                            console.log('📡 Successfully switched to Live mode with Yahoo Finance');
                        } else {
                            console.error('❌ Server rejected live mode:', result.error);
                            alert(`Failed to enable live mode: ${result.error || 'Unknown error'}\n\nPlease check the server logs for more details.`);
                        }
                    } else {
                        const errorText = await response.text().catch(() => 'Unknown error');
                        console.error('❌ Server API call failed with status:', response.status, errorText);
                        alert(`Failed to enable live mode: Server error (${response.status})\n\nError: ${errorText}\n\nMake sure the server is running with: npm run server:live`);
                    }
                } catch (apiError) {
                    console.error('❌ Server not available:', apiError.message);
                    alert(`Failed to enable live mode: Server not available\n\nError: ${apiError.message}\n\nTo fix this:\n1. Start the server: npm run server:live\n2. Or start both: npm run dev:live\n3. Check if port 3001 is available`);
                }
                
            } catch (error) {
                console.error('❌ Failed to switch to live mode:', error);
                alert('Failed to switch to live mode. Please try again.');
            } finally {
                setIsToggling(false);
            }
        };
        
        return (
            <div className="flex flex-col items-center space-y-1">
                <div className="flex items-center space-x-2 bg-white rounded-lg p-1 border">
                    <Button
                        variant={isDemoMode ? "default" : "ghost"}
                        size="sm"
                        onClick={switchToDemo}
                        disabled={isToggling}
                        className="flex items-center space-x-1"
                    >
                        <Database className="h-4 w-4" />
                        <span>{isToggling && isDemoMode ? 'Switching...' : 'Demo'}</span>
                    </Button>
                    <Button
                        variant={!isDemoMode ? "default" : "ghost"}
                        size="sm"
                        onClick={switchToLive}
                        disabled={isToggling || connectionStatus !== 'connected'}
                        className="flex items-center space-x-1"
                        title={connectionStatus !== 'connected' ? 'Server connection required for live mode' : ''}
                    >
                        <Zap className="h-4 w-4" />
                        <span>{isToggling && !isDemoMode ? 'Switching...' : 'Live (Yahoo)'}</span>
                    </Button>
                </div>
                {connectionStatus !== 'connected' && !isDemoMode && (
                    <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200">
                        ⚠️ Server required for live mode
                    </div>
                )}
                {!isDemoMode && connectionStatus === 'connected' && (
                    <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200">
                        ✅ Live data active
                    </div>
                )}
            </div>
        );
    };

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
                                        {isDemoMode ? (
                                            <div className="flex items-center space-x-1">
                                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                                <span className="text-xs text-blue-600 font-medium">Demo</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center space-x-1">
                                                <div className={`w-2 h-2 rounded-full ${isLiveMode ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
                                                <span className={`text-xs font-medium ${isLiveMode ? 'text-green-600' : 'text-yellow-600'}`}>
                                                    {isLiveMode ? 'LIVE DATA' : 'DEMO MODE'}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    • {formatTime(currentTime)}
                                                </span>
                                                <span className={`text-xs font-bold ${isLiveMode ? 'text-green-600' : 'text-blue-600'}`}>
                                                    • Updates: {updateCounter}
                                                </span>
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
                                        {currentIndicators.rsi ? safeToFixed(currentIndicators.rsi, 1) : (isDemoMode ? '--' : 'Live Data')}
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
                                        {currentIndicators.macd ? safeToFixed(currentIndicators.macd.line, 2) : (isDemoMode ? '--' : 'Live Data')}
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
                                                {currentIndicators.macd ? safeToFixed(currentIndicators.macd.line, 2) : (isDemoMode ? '--' : 'Live Data')}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Signal Line:</span>
                                            <span className="font-mono font-bold">
                                                {currentIndicators.macd ? safeToFixed(currentIndicators.macd.signal, 2) : (isDemoMode ? '--' : 'Live Data')}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Histogram:</span>
                                            <span className={`font-mono font-bold ${currentIndicators.macd && currentIndicators.macd.histogram >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {currentIndicators.macd ? (currentIndicators.macd.histogram >= 0 ? '+' : '') + safeToFixed(currentIndicators.macd.histogram, 2) : (isDemoMode ? '--' : 'Live Data')}
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
                                                {currentIndicators.bb ? formatSpotPrice(currentIndicators.bb.upper) : (isDemoMode ? '--' : 'Live Data')}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Middle Band:</span>
                                            <span className="font-mono font-bold">
                                                {currentIndicators.bb ? formatSpotPrice(currentIndicators.bb.middle) : (isDemoMode ? '--' : 'Live Data')}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Lower Band:</span>
                                            <span className="font-mono font-bold text-green-600">
                                                {currentIndicators.bb ? formatSpotPrice(currentIndicators.bb.lower) : (isDemoMode ? '--' : 'Live Data')}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Width:</span>
                                            <span className="font-mono font-bold">
                                                {currentIndicators.bb ? safeToFixed(currentIndicators.bb.width, 2) + '%' : (isDemoMode ? '--' : 'Live Data')}
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
                                        {vixData.value !== null ? safeToFixed(vixData.value, 2) : (isDemoMode ? '--' : 'Live Data')}
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