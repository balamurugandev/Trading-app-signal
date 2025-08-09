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
    XCircle,
    DollarSign,
    Timer,
    Layers,
    AlertTriangle,
    Eye,
    Lock,
    Unlock,
    TrendingUpIcon,
    Info
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
const formatSpotPrice = (price) => `${price?.toFixed(2) || '0.00'}`;

// Cost Calculator Component
const CostCalculator = ({ signal, isDemoMode }) => {
    const calculateCosts = () => {
        if (!signal || !isDemoMode) return null;
        
        const premium = signal.premium || 100;
        const quantity = 50; // Standard lot size
        const turnover = premium * quantity;
        
        // Post Oct 1, 2024 STT rates
        const stt = turnover * 0.0625 / 100; // 0.0625% on premium for options
        const exchangeFee = turnover * 0.00345 / 100; // NSE transaction fee
        const sebiTurnover = turnover * 0.0001 / 100; // SEBI turnover fee
        const gst = (exchangeFee + sebiTurnover) * 0.18; // 18% GST
        const brokerage = 20; // Flat ₹20 per order
        
        const totalCosts = stt + exchangeFee + sebiTurnover + gst + brokerage;
        const costPercentage = (totalCosts / turnover) * 100;
        
        return {
            stt: stt.toFixed(2),
            exchangeFee: exchangeFee.toFixed(2),
            sebiTurnover: sebiTurnover.toFixed(2),
            gst: gst.toFixed(2),
            brokerage: brokerage.toFixed(2),
            total: totalCosts.toFixed(2),
            percentage: costPercentage.toFixed(3),
            netPremium: (premium - totalCosts/quantity).toFixed(2)
        };
    };

    const costs = calculateCosts();
    if (!costs) return null;

    return (
        <div className="bg-orange-50 p-3 rounded-lg border border-orange-200 mt-2">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-800">Cost Breakdown</span>
                </div>
                <Badge className="bg-orange-600 text-white text-xs">
                    {costs.percentage}% impact
                </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                    <span>STT:</span>
                    <span className="font-mono">₹{costs.stt}</span>
                </div>
                <div className="flex justify-between">
                    <span>Exchange:</span>
                    <span className="font-mono">₹{costs.exchangeFee}</span>
                </div>
                <div className="flex justify-between">
                    <span>SEBI:</span>
                    <span className="font-mono">₹{costs.sebiTurnover}</span>
                </div>
                <div className="flex justify-between">
                    <span>GST:</span>
                    <span className="font-mono">₹{costs.gst}</span>
                </div>
                <div className="flex justify-between font-semibold">
                    <span>Total Cost:</span>
                    <span className="font-mono text-red-600">₹{costs.total}</span>
                </div>
                <div className="flex justify-between font-semibold">
                    <span>Net Premium:</span>
                    <span className="font-mono text-green-600">₹{costs.netPremium}</span>
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
        reconnects: 0,
        domImbalance: 15.2,
        isStable: true
    });

    useEffect(() => {
        if (isDemoMode) {
            const interval = setInterval(() => {
                setMarketQuality(prev => ({
                    latency: Math.max(20, Math.min(300, prev.latency + (Math.random() - 0.5) * 20)),
                    tickRate: Math.max(80, Math.min(200, prev.tickRate + (Math.random() - 0.5) * 10)),
                    reconnects: prev.reconnects + (Math.random() > 0.99 ? 1 : 0),
                    domImbalance: prev.domImbalance + (Math.random() - 0.5) * 5,
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
                    <span>DOM Imbalance:</span>
                    <span className={`font-mono ${marketQuality.domImbalance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {isDemoMode ? `${marketQuality.domImbalance > 0 ? '+' : ''}${marketQuality.domImbalance.toFixed(1)}%` : 'Live Data'}
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

// CPR Width Classifier
const CPRClassifier = ({ isDemoMode }) => {
    const [cprWidth, setCprWidth] = useState(0.45);
    
    useEffect(() => {
        if (isDemoMode) {
            const interval = setInterval(() => {
                setCprWidth(prev => Math.max(0.1, Math.min(1.2, prev + (Math.random() - 0.5) * 0.1)));
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [isDemoMode]);

    const getClassification = () => {
        if (cprWidth < 0.3) return { type: 'Narrow', color: 'bg-green-500', hint: 'Trending Day Expected' };
        if (cprWidth < 0.7) return { type: 'Normal', color: 'bg-blue-500', hint: 'Mixed Conditions' };
        return { type: 'Wide', color: 'bg-red-500', hint: 'Choppy/Range Day' };
    };

    const classification = getClassification();

    return (
        <div className="flex items-center space-x-2">
            <Badge className={`${classification.color} text-white text-xs`}>
                CPR: {isDemoMode ? classification.type : 'Live'}
            </Badge>
            {isDemoMode && (
                <span className="text-xs text-gray-600">{classification.hint}</span>
            )}
        </div>
    );
};

// Enhanced Signal Card with all new features
const EnhancedSignalCard = ({ signal, isDemoMode, onStatusChange }) => {
    const [orderControls, setOrderControls] = useState({
        orderType: 'market',
        sliceEnabled: true,
        maxSlippage: 0.5
    });

    const [liquidityScore, setLiquidityScore] = useState({
        spread: 2.5,
        depth: 85,
        score: 'Good'
    });

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
                    <Badge variant="outline" className="text-xs">{signal.timeframe}</Badge>
                    <Badge className="text-xs bg-emerald-500 animate-pulse text-white">
                        🔴 LIVE
                    </Badge>
                </div>
                <Badge className="text-xs bg-green-500 text-white">
                    {signal.strength}%
                </Badge>
            </div>

            {/* Price Information */}
            <div className="grid grid-cols-2 gap-3 text-sm mb-3">
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

            {/* Liquidity Information */}
            <div className="bg-blue-50 p-2 rounded mb-3">
                <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                        <Layers className="h-3 w-3 text-blue-600" />
                        <span className="font-medium">Liquidity</span>
                    </div>
                    <Badge className={`text-xs ${liquidityScore.score === 'Good' ? 'bg-green-500' : 'bg-yellow-500'} text-white`}>
                        {liquidityScore.score}
                    </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-1 text-xs">
                    <div className="flex justify-between">
                        <span>Spread:</span>
                        <span className="font-mono">₹{liquidityScore.spread}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Depth:</span>
                        <span className="font-mono">{liquidityScore.depth}%</span>
                    </div>
                </div>
            </div>

            {/* Order Controls */}
            <div className="bg-purple-50 p-2 rounded mb-3">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-purple-800">Order Controls</span>
                    <Settings className="h-3 w-3 text-purple-600" />
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        size="sm"
                        variant={orderControls.orderType === 'market' ? 'default' : 'outline'}
                        onClick={() => setOrderControls(prev => ({ ...prev, orderType: 'market' }))}
                        className="text-xs h-6"
                    >
                        Market
                    </Button>
                    <Button
                        size="sm"
                        variant={orderControls.orderType === 'limit' ? 'default' : 'outline'}
                        onClick={() => setOrderControls(prev => ({ ...prev, orderType: 'limit' }))}
                        className="text-xs h-6"
                    >
                        Limit
                    </Button>
                    <Button
                        size="sm"
                        variant={orderControls.sliceEnabled ? 'default' : 'outline'}
                        onClick={() => setOrderControls(prev => ({ ...prev, sliceEnabled: !prev.sliceEnabled }))}
                        className="text-xs h-6"
                    >
                        {orderControls.sliceEnabled ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                        Slice
                    </Button>
                </div>
            </div>

            {/* Cost Breakdown */}
            <CostCalculator signal={signal} isDemoMode={isDemoMode} />

            {/* Confirmations */}
            <div className="mt-3 flex flex-wrap gap-1">
                <Badge variant="outline" className="text-xs bg-green-100 text-green-800">
                    ✓ Above VWAP
                </Badge>
                <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800">
                    ✓ EMA9>EMA21
                </Badge>
                <Badge variant="outline" className="text-xs bg-purple-100 text-purple-800">
                    ✓ RSI Rising
                </Badge>
                <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-800">
                    ✓ BB Expanding
                </Badge>
            </div>

            {/* Why This Signal Panel */}
            <div className="mt-3 bg-gray-50 p-2 rounded">
                <div className="flex items-center space-x-2 mb-1">
                    <Info className="h-3 w-3 text-gray-600" />
                    <span className="text-xs font-medium text-gray-700">Signal Logic</span>
                </div>
                <p className="text-xs text-gray-600">
                    Momentum continuation setup: Price above VWAP with EMA9>EMA21, RSI rising above 50, 
                    MACD bullish crossover, and Bollinger Bands expanding. Strong DOM support.
                </p>
            </div>

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
    const [isDemoMode, setIsDemoMode] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [activeSignalsCount, setActiveSignalsCount] = useState(1);
    const [totalSignalsCount, setTotalSignalsCount] = useState(1);
    const [winRate, setWinRate] = useState(75.5);
    
    // Safety Rails State
    const [safetyRails, setSafetyRails] = useState({
        dailyMaxLoss: 5000,
        currentLoss: 1250,
        maxTrades: 10,
        currentTrades: 3,
        consecutiveLosses: 0,
        coolOffActive: false
    });

    // Demo signal for advanced features
    const [demoSignal] = useState({
        id: 'advanced_demo_1',
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
        timestamp: new Date().toISOString(),
        status: 'active',
        conditions: {
            trendFilter: true,
            momentumTrigger: 'RSI',
            volatilityStructure: true,
            signalValidation: true
        }
    });

    // Real-time clock update
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
            {/* Advanced Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-4xl font-bold text-slate-900 mb-2">Advanced NSE Scalping Engine</h1>
                        <p className="text-slate-600 text-lg">Execution-aware signals with cost optimization & market quality monitoring</p>
                    </div>

                    <div className="flex items-center space-x-4">
                        <CPRClassifier isDemoMode={isDemoMode} />
                        <Badge className="bg-blue-500 text-white">
                            <Database className="h-3 w-3 mr-1" />
                            Advanced Mode
                        </Badge>
                    </div>
                </div>

                {/* Enhanced Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    <Card className="p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200">
                        <div className="flex items-center space-x-2">
                            <Activity className="h-5 w-5 text-emerald-600" />
                            <div>
                                <p className="text-sm text-emerald-700 font-medium">Active Signals</p>
                                <p className="text-2xl font-bold text-emerald-900">{activeSignalsCount}</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4 bg-gradient-to-r from-green-50 to-green-100 border-green-200">
                        <div className="flex items-center space-x-2">
                            <TrendingUp className="h-5 w-5 text-green-600" />
                            <div>
                                <p className="text-sm text-green-700 font-medium">Win Rate</p>
                                <p className="text-2xl font-bold text-green-900">{winRate.toFixed(1)}%</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                        <div className="flex items-center space-x-2">
                            <DollarSign className="h-5 w-5 text-blue-600" />
                            <div>
                                <p className="text-sm text-blue-700 font-medium">Net P&L</p>
                                <p className="text-2xl font-bold text-blue-900">+₹3,750</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
                        <div className="flex items-center space-x-2">
                            <Shield className="h-5 w-5 text-purple-600" />
                            <div>
                                <p className="text-sm text-purple-700 font-medium">Risk Used</p>
                                <p className="text-2xl font-bold text-purple-900">{((safetyRails.currentLoss / safetyRails.dailyMaxLoss) * 100).toFixed(0)}%</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
                        <div className="flex items-center space-x-2">
                            <Timer className="h-5 w-5 text-orange-600" />
                            <div>
                                <p className="text-sm text-orange-700 font-medium">Avg Latency</p>
                                <p className="text-2xl font-bold text-orange-900">45ms</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4 bg-gradient-to-r from-red-50 to-red-100 border-red-200">
                        <div className="flex items-center space-x-2">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            <div>
                                <p className="text-sm text-red-700 font-medium">Trades Left</p>
                                <p className="text-2xl font-bold text-red-900">{safetyRails.maxTrades - safetyRails.currentTrades}</p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                {/* Left Panel - Market Analysis & Controls */}
                <div className="xl:col-span-3 space-y-6">
                    {/* Market Quality Dashboard */}
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center space-x-2">
                                <Eye className="h-5 w-5" />
                                <span>Market Microstructure</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <MarketQualityIndicator isDemoMode={isDemoMode} />
                                
                                {/* Depth of Market */}
                                <Card className="p-4">
                                    <h4 className="font-semibold mb-3 flex items-center">
                                        <Layers className="h-4 w-4 mr-2" />
                                        Level 2 Data
                                    </h4>
                                    <div className="space-y-1 text-xs">
                                        <div className="flex justify-between text-red-600">
                                            <span>Ask: 86.50</span>
                                            <span>500</span>
                                        </div>
                                        <div className="flex justify-between text-red-600">
                                            <span>Ask: 86.25</span>
                                            <span>750</span>
                                        </div>
                                        <div className="flex justify-between font-bold">
                                            <span>Spread:</span>
                                            <span>₹2.50</span>
                                        </div>
                                        <div className="flex justify-between text-green-600">
                                            <span>Bid: 84.00</span>
                                            <span>650</span>
                                        </div>
                                        <div className="flex justify-between text-green-600">
                                            <span>Bid: 83.75</span>
                                            <span>400</span>
                                        </div>
                                    </div>
                                </Card>

                                {/* Safety Rails */}
                                <Card className="p-4">
                                    <h4 className="font-semibold mb-3 flex items-center">
                                        <Shield className="h-4 w-4 mr-2" />
                                        Safety Rails
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span>Daily Loss:</span>
                                            <span className="font-mono text-red-600">
                                                ₹{safetyRails.currentLoss}/₹{safetyRails.dailyMaxLoss}
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div 
                                                className="bg-red-500 h-2 rounded-full" 
                                                style={{ width: `${(safetyRails.currentLoss / safetyRails.dailyMaxLoss) * 100}%` }}
                                            ></div>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Trades:</span>
                                            <span className="font-mono">
                                                {safetyRails.currentTrades}/{safetyRails.maxTrades}
                                            </span>
                                        </div>
                                        {safetyRails.coolOffActive && (
                                            <Badge className="bg-red-500 text-white text-xs w-full justify-center">
                                                Cool-off Active
                                            </Badge>
                                        )}
                                    </div>
                                </Card>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Post-Trade Analytics */}
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center space-x-2">
                                <BarChart3 className="h-5 w-5" />
                                <span>Session Analytics</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                    <p className="text-sm text-green-700 font-medium">Avg Slippage</p>
                                    <p className="text-xl font-bold text-green-900">0.25%</p>
                                </div>
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                    <p className="text-sm text-blue-700 font-medium">Fill Rate</p>
                                    <p className="text-xl font-bold text-blue-900">98.5%</p>
                                </div>
                                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                    <p className="text-sm text-purple-700 font-medium">Avg Cost</p>
                                    <p className="text-xl font-bold text-purple-900">0.18%</p>
                                </div>
                                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                                    <p className="text-sm text-orange-700 font-medium">Edge After Costs</p>
                                    <p className="text-xl font-bold text-orange-900">+2.1%</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Panel - Enhanced Signal Feed */}
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
                                    signal={demoSignal} 
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