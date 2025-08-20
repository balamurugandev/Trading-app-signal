import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Activity,
    TrendingUp,
    Clock,
    Settings,
    Wifi,
    Zap,
    BarChart3,
    Target,
    CheckCircle,
    XCircle,
    DollarSign
} from 'lucide-react';

// Utility functions
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
const formatSpotPrice = (price) => `${price?.toFixed(2) || '0.00'}`;

// Cost Calculator Component
const CostCalculator = ({ signal, isDemoMode }) => {
    if (!signal || !isDemoMode) return null;

    const premium = signal.premium || 100;
    const quantity = 50;
    const turnover = premium * quantity;
    const stt = turnover * 0.0625 / 100;
    const exchangeFee = turnover * 0.00345 / 100;
    const sebiTurnover = turnover * 0.0001 / 100;
    const gst = (exchangeFee + sebiTurnover) * 0.18;
    const brokerage = 20;
    const totalCosts = stt + exchangeFee + sebiTurnover + gst + brokerage;
    const costPercentage = (totalCosts / turnover) * 100;

    return (
        <div className="bg-orange-50 p-3 rounded-lg border border-orange-200 mt-2">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-800">Cost Breakdown</span>
                </div>
                <Badge className="bg-orange-600 text-white text-xs">
                    {costPercentage.toFixed(3)}% impact
                </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                    <span>Total Cost:</span>
                    <span className="font-mono text-red-600">₹{totalCosts.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                    <span>Net Premium:</span>
                    <span className="font-mono text-green-600">₹{(premium - totalCosts / quantity).toFixed(2)}</span>
                </div>
            </div>
        </div>
    );
};

// Market Quality Indicator
const MarketQualityIndicator = ({ isDemoMode }) => {
    const [marketQuality, setMarketQuality] = useState({
        latency: 45,
        tickRate: 120,
        isStable: true
    });

    useEffect(() => {
        if (isDemoMode) {
            const interval = setInterval(() => {
                setMarketQuality(prev => ({
                    latency: Math.max(20, Math.min(300, prev.latency + (Math.random() - 0.5) * 20)),
                    tickRate: Math.max(80, Math.min(200, prev.tickRate + (Math.random() - 0.5) * 10)),
                    isStable: prev.latency < 150
                }));
            }, 2000);
            return () => clearInterval(interval);
        }
    }, [isDemoMode]);

    const getLatencyColor = () => {
        if (marketQuality.latency < 100) return 'text-green-600';
        if (marketQuality.latency < 200) return 'text-yellow-600';
        return 'text-red-600';
    };

    return (
        <Card className="p-4">
            <h4 className="font-semibold mb-3 flex items-center">
                <Wifi className="h-4 w-4 mr-2" />
                Market Quality
            </h4>
            <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span>Latency:</span>
                    <span className={`font-mono font-bold ${getLatencyColor()}`}>
                        {isDemoMode ? `${marketQuality.latency.toFixed(0)}ms` : 'Live Data'}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span>Tick Rate:</span>
                    <span className="font-mono">
                        {isDemoMode ? `${marketQuality.tickRate.toFixed(0)}/s` : 'Live Data'}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge className={`text-xs ${marketQuality.isStable ? 'bg-green-500' : 'bg-red-500'} text-white`}>
                        {isDemoMode ? (marketQuality.isStable ? 'Stable' : 'Degraded') : 'Live'}
                    </Badge>
                </div>
            </div>
        </Card>
    );
};

// Enhanced Signal Card
const EnhancedSignalCard = ({ signal, isDemoMode, onStatusChange }) => {
    return (
        <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-300 p-4 rounded-lg border transition-all duration-300">
            {/* Signal Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-emerald-600 animate-pulse text-white rounded-full flex items-center justify-center text-xs font-bold">
                        #1
                    </div>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="font-bold">{signal.symbol}</span>
                    <Badge variant="outline" className="text-xs font-bold">{signal.timeframe}</Badge>
                    <Badge className="text-xs bg-emerald-500 animate-pulse text-white">
                        🔴 LIVE
                    </Badge>
                    <div className="flex items-center space-x-1 text-xs text-gray-600">
                        <Clock className="h-3 w-3" />
                        <span>{signal.signalTime || formatTime(new Date())}</span>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <Badge className="text-xs bg-green-500 text-white">
                        {signal.strength?.toFixed(0) || 85}%
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                        {signal.confidence || 'High'}
                    </Badge>
                </div>
            </div>

            {/* Price Information */}
            <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                <div>
                    <p className="text-gray-600 font-medium">Spot Price ({signal.timeframe})</p>
                    <p className="font-bold text-gray-800">{formatSpotPrice(signal.spotPrice)}</p>
                </div>
                <div>
                    <p className="text-gray-600 font-medium">Strike & Premium</p>
                    <p className="font-bold text-green-800">₹{signal.premium} ({signal.optionStrike} {signal.optionType})</p>
                    {signal.expiry && (
                        <p className="text-xs text-gray-500">Exp: {signal.expiry}</p>
                    )}
                </div>
                <div>
                    <p className="text-gray-600 font-medium">Stop Loss</p>
                    <p className="font-bold text-red-600">{formatSpotPrice(signal.stopLoss)}</p>
                </div>
                <div>
                    <p className="text-gray-600 font-medium">Targets</p>
                    <p className="font-bold text-green-600">
                        {formatSpotPrice(signal.target1)} | {formatSpotPrice(signal.target2)}
                    </p>
                </div>
            </div>

            {/* Cost Breakdown */}
            <CostCalculator signal={signal} isDemoMode={isDemoMode} />

            {/* Action Buttons */}
            <div className="mt-3 flex space-x-2">
                <Button
                    size="sm"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs"
                    onClick={() => onStatusChange('hit_target')}
                >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Execute Trade
                </Button>
                <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 border-red-300 text-red-600 hover:bg-red-50 text-xs"
                    onClick={() => onStatusChange('rejected')}
                >
                    <XCircle className="h-3 w-3 mr-1" />
                    Reject
                </Button>
            </div>
        </div>
    );
};

// Main Advanced Trading Dashboard Component
const AdvancedTradingDashboard = ({ connectionStatus }) => {
    const [selectedSymbol, setSelectedSymbol] = useState('NIFTY');
    const [selectedTimeframe, setSelectedTimeframe] = useState('5m');
    const [isDemoMode, setIsDemoMode] = useState(false); // Start with live mode
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isLiveDataEnabled, setIsLiveDataEnabled] = useState(false);

    // Market data state - will be populated from live API
    const [marketData, setMarketData] = useState({
        NIFTY: { price: 0, change: 0, changePercent: 0 },
        BANKNIFTY: { price: 0, change: 0, changePercent: 0 },
        FINNIFTY: { price: 0, change: 0, changePercent: 0 },
        SENSEX: { price: 0, change: 0, changePercent: 0 },
        BITCOIN: { price: 0, change: 0, changePercent: 0 },
        SOLANA: { price: 0, change: 0, changePercent: 0 }
    });

    // Technical indicators state
    const [technicalIndicators, setTechnicalIndicators] = useState({
        'NIFTY': {
            '5m': {
                vwap: 24355.80,
                ema9: 24345.12,
                ema21: 24338.54,
                rsi: 42.8,
                macd: { line: -15.2, signal: -11.1, histogram: -4.1 }
            }
        },
        'BANKNIFTY': {
            '5m': {
                vwap: 55025.15,
                ema9: 55015.40,
                ema21: 55008.25,
                rsi: 44.2,
                macd: { line: -11.8, signal: -7.9, histogram: -3.9 }
            }
        }
    });

    // Demo signal generator
    const getDemoSignal = () => {
        const currentPrice = marketData[selectedSymbol]?.price || (selectedSymbol === 'NIFTY' ? 24363.30 : 55004.90);
        const strikeInterval = selectedSymbol === 'NIFTY' ? 100 : 100;
        const strike = Math.round(currentPrice / strikeInterval) * strikeInterval;
        const premium = selectedSymbol === 'NIFTY' ? (85.50 + Math.random() * 20) : (125.75 + Math.random() * 30);
        
        const currentIndicators = technicalIndicators[selectedSymbol]?.[selectedTimeframe] || {};
        const stopLossPrice = Math.max(
            currentIndicators.vwap || currentPrice * 0.995,
            currentIndicators.ema21 || currentPrice * 0.99,
            currentPrice * 0.985
        );
        
        const riskAmount = currentPrice - stopLossPrice;
        const target1Price = currentPrice + (riskAmount * 1.2);
        const target2Price = currentPrice + (riskAmount * 2.0);
        
        const signalTime = new Date();
        const istTime = new Date(signalTime.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
        
        return {
            id: `advanced_${selectedSymbol}_${selectedTimeframe}_${Date.now()}`,
            symbol: selectedSymbol,
            timeframe: selectedTimeframe,
            signalTime: istTime.toLocaleTimeString('en-IN', { 
                hour12: true, 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit' 
            }),
            spotPrice: currentPrice,
            optionStrike: strike,
            premium: premium,
            stopLoss: stopLossPrice,
            target1: target1Price,
            target2: target2Price,
            confidence: 'High',
            strength: 70 + Math.random() * 25
        };
    };

    // Update current time
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Fetch live market data
    useEffect(() => {
        const fetchMarketData = async () => {
            try {
                const response = await fetch('/api/data/current');
                if (response.ok) {
                    const result = await response.json();
                    if (result.data) {
                        const updatedMarketData = {};
                        Object.entries(result.data).forEach(([symbol, data]) => {
                            updatedMarketData[symbol] = {
                                price: data.ltp,
                                change: data.change,
                                changePercent: data.changePercent,
                                volume: data.volume,
                                timestamp: data.timestamp,
                                isMarketOpen: data.isMarketOpen,
                                dataSource: data.dataSource
                            };
                        });
                        setMarketData(updatedMarketData);
                        setIsLiveDataEnabled(result.isLive);
                        console.log('📊 Updated market data:', updatedMarketData);
                    }
                }
            } catch (error) {
                console.error('Error fetching market data:', error);
            }
        };

        // Initial fetch
        fetchMarketData();

        // Set up periodic updates every 2 seconds
        const interval = setInterval(fetchMarketData, 2000);
        return () => clearInterval(interval);
    }, []);

    // Enable live data mode on component mount
    useEffect(() => {
        const enableLiveData = async () => {
            try {
                const response = await fetch('/api/data/enable-live', { method: 'POST' });
                if (response.ok) {
                    const result = await response.json();
                    console.log('✅ Live data enabled:', result);
                    setIsLiveDataEnabled(true);
                }
            } catch (error) {
                console.error('Failed to enable live data:', error);
            }
        };

        enableLiveData();
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <Zap className="h-8 w-8 text-emerald-600" />
                            <h1 className="text-3xl font-bold text-gray-900">Advanced Trading Dashboard</h1>
                        </div>
                        <Badge className="bg-emerald-500 text-white">
                            <Activity className="h-3 w-3 mr-1" />
                            PRO MODE
                        </Badge>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="text-right">
                            <p className="text-sm text-gray-600">IST Time</p>
                            <p className="font-mono text-lg font-bold text-gray-900">
                                {formatTime(currentTime)}
                            </p>
                        </div>
                        <Badge className={`${connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'} text-white`}>
                            {connectionStatus === 'connected' ? 'CONNECTED' : 'DEMO MODE'}
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Main Dashboard Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Left Panel - Controls */}
                <div className="xl:col-span-1 space-y-6">
                    {/* Symbol and Timeframe Selection */}
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center space-x-2">
                                <Settings className="h-5 w-5" />
                                <span>Trading Controls</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">Symbol</label>
                                    <div className="flex space-x-2">
                                        <Button
                                            variant={selectedSymbol === 'NIFTY' ? 'default' : 'outline'}
                                            onClick={() => setSelectedSymbol('NIFTY')}
                                            className="flex-1"
                                        >
                                            NIFTY
                                        </Button>
                                        <Button
                                            variant={selectedSymbol === 'BANKNIFTY' ? 'default' : 'outline'}
                                            onClick={() => setSelectedSymbol('BANKNIFTY')}
                                            className="flex-1"
                                        >
                                            BANKNIFTY
                                        </Button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">Timeframe</label>
                                    <div className="flex space-x-2">
                                        {['1m', '5m', '15m'].map(tf => (
                                            <Button
                                                key={tf}
                                                variant={selectedTimeframe === tf ? 'default' : 'outline'}
                                                onClick={() => setSelectedTimeframe(tf)}
                                                className="flex-1"
                                            >
                                                {tf}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700">Demo Mode</span>
                                    <Button
                                        variant={isDemoMode ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setIsDemoMode(!isDemoMode)}
                                    >
                                        {isDemoMode ? 'ON' : 'OFF'}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Market Quality */}
                    <MarketQualityIndicator isDemoMode={isDemoMode} />

                    {/* Current Market Data */}
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center space-x-2">
                                <BarChart3 className="h-5 w-5" />
                                <span>{selectedSymbol} Data</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Current Price:</span>
                                    <span className="font-bold text-lg">
                                        {formatSpotPrice(marketData[selectedSymbol]?.price)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Change:</span>
                                    <span className={`font-bold ${marketData[selectedSymbol]?.change < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        {marketData[selectedSymbol]?.change?.toFixed(2)} ({marketData[selectedSymbol]?.changePercent?.toFixed(2)}%)
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Center Panel - Technical Indicators */}
                <div className="xl:col-span-1">
                    <Card className="shadow-lg h-full">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center space-x-2">
                                <Target className="h-5 w-5" />
                                <span>Technical Analysis</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-blue-50 p-3 rounded-lg">
                                        <div className="text-xs text-gray-600 mb-1">VWAP</div>
                                        <div className="font-bold text-blue-800">
                                            {technicalIndicators[selectedSymbol]?.[selectedTimeframe]?.vwap?.toFixed(2) || 'N/A'}
                                        </div>
                                    </div>
                                    <div className="bg-green-50 p-3 rounded-lg">
                                        <div className="text-xs text-gray-600 mb-1">EMA 9</div>
                                        <div className="font-bold text-green-800">
                                            {technicalIndicators[selectedSymbol]?.[selectedTimeframe]?.ema9?.toFixed(2) || 'N/A'}
                                        </div>
                                    </div>
                                    <div className="bg-purple-50 p-3 rounded-lg">
                                        <div className="text-xs text-gray-600 mb-1">EMA 21</div>
                                        <div className="font-bold text-purple-800">
                                            {technicalIndicators[selectedSymbol]?.[selectedTimeframe]?.ema21?.toFixed(2) || 'N/A'}
                                        </div>
                                    </div>
                                    <div className="bg-orange-50 p-3 rounded-lg">
                                        <div className="text-xs text-gray-600 mb-1">RSI</div>
                                        <div className="font-bold text-orange-800">
                                            {technicalIndicators[selectedSymbol]?.[selectedTimeframe]?.rsi?.toFixed(1) || 'N/A'}
                                        </div>
                                    </div>
                                </div>

                                {/* MACD Display */}
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <div className="text-xs text-gray-600 mb-2">MACD</div>
                                    <div className="grid grid-cols-3 gap-2 text-xs">
                                        <div>
                                            <div className="text-gray-500">Line</div>
                                            <div className="font-mono font-bold">
                                                {technicalIndicators[selectedSymbol]?.[selectedTimeframe]?.macd?.line?.toFixed(2) || 'N/A'}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-gray-500">Signal</div>
                                            <div className="font-mono font-bold">
                                                {technicalIndicators[selectedSymbol]?.[selectedTimeframe]?.macd?.signal?.toFixed(2) || 'N/A'}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-gray-500">Histogram</div>
                                            <div className="font-mono font-bold">
                                                {technicalIndicators[selectedSymbol]?.[selectedTimeframe]?.macd?.histogram?.toFixed(2) || 'N/A'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Panel - Signal Feed */}
                <div className="xl:col-span-1">
                    <Card className="shadow-lg h-full">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center space-x-2">
                                <Zap className="h-5 w-5" />
                                <span>Advanced Signals</span>
                                <Badge className="bg-emerald-500 text-white ml-2">
                                    <Activity className="h-3 w-3 mr-1" />
                                    LIVE
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <EnhancedSignalCard
                                    signal={getDemoSignal()}
                                    isDemoMode={isDemoMode}
                                    onStatusChange={(status) => console.log('Signal status:', status)}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default AdvancedTradingDashboard;