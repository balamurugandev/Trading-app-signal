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
            netPremium: (premium - totalCosts / quantity).toFixed(2)
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

    // Enhanced signal validation based on the specification
    const validateSignalPreconditions = (signal) => {
        const preconditions = {
            structureTrend: signal.spotPrice > signal.vwap && signal.ema9 > signal.ema21,
            momentum: signal.rsi > 50 || (signal.macd?.line > signal.macd?.signal && signal.macd?.histogram > 0),
            volatility: signal.bbExpanding || signal.pivotReclaim,
            liquidity: liquidityScore.spread <= 5.0 && liquidityScore.depth >= 60,
            marketQuality: signal.latency <= 150 && signal.stable,
            costSanity: signal.totalCostPct < signal.expectedEdge
        };

        return {
            passed: Object.values(preconditions).every(Boolean),
            details: preconditions
        };
    };

    const signalValidation = validateSignalPreconditions(signal);

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

            {/* Enhanced Confirmations based on specification */}
            <div className="mt-3 flex flex-wrap gap-1">
                <Badge
                    variant="outline"
                    className={`text-xs ${signalValidation.details.structureTrend ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                >
                    {signalValidation.details.structureTrend ? '✓' : '✗'} Above VWAP & EMA9 greater than EMA21
                </Badge>
                <Badge
                    variant="outline"
                    className={`text-xs ${signalValidation.details.momentum ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}
                >
                    {signalValidation.details.momentum ? '✓' : '✗'} RSI greater than 50 Rising | MACD Bull
                </Badge>
                <Badge
                    variant="outline"
                    className={`text-xs ${signalValidation.details.volatility ? 'bg-purple-100 text-purple-800' : 'bg-red-100 text-red-800'}`}
                >
                    {signalValidation.details.volatility ? '✓' : '✗'} BB Expanding | Pivot Reclaim
                </Badge>
                <Badge
                    variant="outline"
                    className={`text-xs ${signalValidation.details.liquidity ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}
                >
                    {signalValidation.details.liquidity ? '✓' : '✗'} Liquidity OK
                </Badge>
                <Badge
                    variant="outline"
                    className={`text-xs ${signalValidation.details.marketQuality ? 'bg-indigo-100 text-indigo-800' : 'bg-red-100 text-red-800'}`}
                >
                    {signalValidation.details.marketQuality ? '✓' : '✗'} Latency less than or equal to 150ms
                </Badge>
                <Badge
                    variant="outline"
                    className={`text-xs ${signalValidation.details.costSanity ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}
                >
                    {signalValidation.details.costSanity ? '✓' : '✗'} Cost less than Edge
                </Badge>
            </div>

            {/* Enhanced Signal Logic Panel */}
            <div className="mt-3 bg-gray-50 p-2 rounded">
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                        <Info className="h-3 w-3 text-gray-600" />
                        <span className="text-xs font-medium text-gray-700">Signal Logic</span>
                    </div>
                    <Badge className={`text-xs ${signalValidation.passed ? 'bg-green-500' : 'bg-red-500'} text-white`}>
                        {signalValidation.passed ? 'VALID' : 'INVALID'}
                    </Badge>
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                    <p><strong>Setup:</strong> {signal.setup || 'MomentumContinuation'}</p>
                    <p><strong>Entry Logic:</strong> {signal.setup === 'CPRReclaim' ?
                        'Strong reclaim/close above Pivot/CPR with VWAP support and momentum uptick' :
                        'Pullback holds above EMA21/VWAP; strong close near high with BB expansion'}</p>
                    <p><strong>Strike Selection:</strong> ATM/1-step ITM with minimum spread (₹{liquidityScore.spread}) and highest depth ({liquidityScore.depth}%)</p>
                    <p><strong>Invalidation:</strong> Close below EMA21/VWAP, MACD bear cross, RSI less than 50, DOM offer surge, latency greater than 300ms</p>
                </div>
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

    // Enhanced demo signal matching the specification
    const [demoSignal] = useState({
        id: 'advanced_demo_1',
        instrument: 'NIFTY',
        symbol: 'NIFTY',
        timeframe: '5m',
        setup: 'MomentumContinuation',
        signal: 'BUY_CALL',
        type: 'BUY',
        underlying_entry: 21520.0,
        entryPrice: 21520,
        spotPrice: 21520,
        option_strike: '21500 CE',
        optionStrike: 21500,
        optionType: 'CALL',
        option_ltp: 85.50,
        premium: 85.50,
        spread_paise: 250, // ₹2.50 spread
        depth_score: 0.85,
        dom_imbalance: '+15.2%',
        market_quality: {
            latency_ms: 45,
            tick_rate_hz: 120,
            stable: true
        },
        costs: {
            stt_regime: 'post-01-Oct-2024',
            est_total_cost_pct: 0.18
        },
        order_controls: {
            type: 'market',
            slice: true,
            slice_hint: 'auto if >freeze'
        },
        stop_loss_underlying: 21305.0,
        stopLoss: 21305,
        sl_basis: 'VWAP',
        targets: {
            t1: 21843.0,
            t2: 22058.0
        },
        target1: 21843,
        target2: 22058,
        trail: {
            mode: 'auto',
            type: 'EMA9',
            step: 0
        },
        confirmations: ['AboveVWAP', 'EMA9>EMA21', 'RSI>50 rising', 'BB expanding'],
        confidence: 'High',
        invalidation: ['close<EMA21/VWAP', 'MACD down', 'RSI<50', 'DOM offer surge', 'latency>300ms'],
        timestamp_ist: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        strength: 85,
        timestamp: new Date().toISOString(),
        status: 'active',
        // Additional fields for validation
        vwap: 21515.25,
        ema9: 21508.75,
        ema21: 21495.50,
        rsi: 58.2,
        macd: {
            line: 12.45,
            signal: 11.82,
            histogram: 0.63
        },
        bbExpanding: true,
        pivotReclaim: false,
        latency: 45,
        stable: true,
        totalCostPct: 0.18,
        expectedEdge: 2.1,
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
                        <div className="flex items-center space-x-2">
                            <Button
                                size="sm"
                                variant={isDemoMode ? 'outline' : 'default'}
                                onClick={() => setIsDemoMode(false)}
                                className="text-xs h-6"
                            >
                                Standard
                            </Button>
                            <Button
                                size="sm"
                                variant={isDemoMode ? 'default' : 'outline'}
                                onClick={() => setIsDemoMode(true)}
                                className="text-xs h-6"
                            >
                                Advanced
                            </Button>
                        </div>
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
                    {/* Comprehensive Technical Analysis Dashboard */}
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center space-x-2">
                                <BarChart3 className="h-5 w-5" />
                                <span>Technical Analysis Engine</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                {/* RSI 7 & 14 */}
                                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-yellow-800">RSI Analysis</span>
                                        <Badge className="bg-yellow-600 text-white text-xs">Live</Badge>
                                    </div>
                                    <div className="space-y-1 text-xs">
                                        <div className="flex justify-between">
                                            <span>RSI(7):</span>
                                            <span className="font-mono font-bold">{isDemoMode ? '65.2' : 'Live'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>RSI(14):</span>
                                            <span className="font-mono font-bold">{isDemoMode ? '58.7' : 'Live'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Status:</span>
                                            <span className="text-green-600 font-bold">Rising</span>
                                        </div>
                                    </div>
                                </div>

                                {/* MACD Analysis */}
                                <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-purple-800">MACD(12,26,9)</span>
                                        <Badge className="bg-purple-600 text-white text-xs">Bull</Badge>
                                    </div>
                                    <div className="space-y-1 text-xs">
                                        <div className="flex justify-between">
                                            <span>Line:</span>
                                            <span className="font-mono font-bold">{isDemoMode ? '12.45' : 'Live'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Signal:</span>
                                            <span className="font-mono font-bold">{isDemoMode ? '11.82' : 'Live'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Histogram:</span>
                                            <span className="text-green-600 font-bold">{isDemoMode ? '+0.63' : 'Live'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Bollinger Bands */}
                                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-blue-800">BB(20,2)</span>
                                        <Badge className="bg-blue-600 text-white text-xs">Expanding</Badge>
                                    </div>
                                    <div className="space-y-1 text-xs">
                                        <div className="flex justify-between">
                                            <span>Bandwidth:</span>
                                            <span className="font-mono font-bold">{isDemoMode ? '0.56%' : 'Live'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Position:</span>
                                            <span className="text-green-600 font-bold">Upper Half</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Expansion:</span>
                                            <span className="text-green-600 font-bold">Yes</span>
                                        </div>
                                    </div>
                                </div>

                                {/* VWAP Analysis */}
                                <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-indigo-800">VWAP Analysis</span>
                                        <Badge className="bg-indigo-600 text-white text-xs">Above</Badge>
                                    </div>
                                    <div className="space-y-1 text-xs">
                                        <div className="flex justify-between">
                                            <span>VWAP:</span>
                                            <span className="font-mono font-bold">{isDemoMode ? '21515.25' : 'Live'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Crosses (15b):</span>
                                            <span className="font-mono font-bold">{isDemoMode ? '2' : 'Live'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Trend:</span>
                                            <span className="text-green-600 font-bold">Strong</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

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

                                {/* Options Ladder (ATM±10) */}
                                <Card className="p-4">
                                    <h4 className="font-semibold mb-3 flex items-center">
                                        <Layers className="h-4 w-4 mr-2" />
                                        Options Ladder (ATM±3)
                                    </h4>
                                    <div className="space-y-1 text-xs">
                                        <div className="grid grid-cols-4 gap-1 font-bold text-gray-700 border-b pb-1">
                                            <span>Strike</span>
                                            <span>Bid/Ask</span>
                                            <span>Vol</span>
                                            <span>OI</span>
                                        </div>
                                        {/* ITM Strikes */}
                                        <div className="grid grid-cols-4 gap-1 text-green-600">
                                            <span>21450 CE</span>
                                            <span>125/128</span>
                                            <span>2.1K</span>
                                            <span>15.2K</span>
                                        </div>
                                        <div className="grid grid-cols-4 gap-1 text-green-600">
                                            <span>21500 CE</span>
                                            <span>84/86.5</span>
                                            <span>5.8K</span>
                                            <span>28.5K</span>
                                        </div>
                                        {/* ATM Strike - Highlighted */}
                                        <div className="grid grid-cols-4 gap-1 bg-blue-100 p-1 rounded font-bold">
                                            <span>21550 CE</span>
                                            <span>48/50.5</span>
                                            <span>12.3K</span>
                                            <span>45.2K</span>
                                        </div>
                                        {/* OTM Strikes */}
                                        <div className="grid grid-cols-4 gap-1 text-red-600">
                                            <span>21600 CE</span>
                                            <span>22/24</span>
                                            <span>8.7K</span>
                                            <span>32.1K</span>
                                        </div>
                                        <div className="grid grid-cols-4 gap-1 text-red-600">
                                            <span>21650 CE</span>
                                            <span>8/10</span>
                                            <span>3.2K</span>
                                            <span>18.9K</span>
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
                                            <span>Per-trade Risk:</span>
                                            <span className="font-mono text-blue-600">₹2,500</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Daily Max Loss:</span>
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
                                            <span>Max Trades:</span>
                                            <span className="font-mono">
                                                {safetyRails.currentTrades}/{safetyRails.maxTrades}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Consecutive Losses:</span>
                                            <span className="font-mono text-orange-600">{safetyRails.consecutiveLosses}/3</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>News Blackout:</span>
                                            <Badge className="bg-green-500 text-white text-xs">Clear</Badge>
                                        </div>
                                        {safetyRails.coolOffActive && (
                                            <Badge className="bg-red-500 text-white text-xs w-full justify-center">
                                                Cool-off Active - 3 Consecutive Losses
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
                            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                    <p className="text-sm text-green-700 font-medium">Avg Slippage</p>
                                    <p className="text-xl font-bold text-green-900">0.25%</p>
                                    <p className="text-xs text-green-600">vs 0.30% est</p>
                                </div>
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                    <p className="text-sm text-blue-700 font-medium">Fill Rate</p>
                                    <p className="text-xl font-bold text-blue-900">98.5%</p>
                                    <p className="text-xs text-blue-600">47/48 fills</p>
                                </div>
                                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                    <p className="text-sm text-purple-700 font-medium">Avg STT+Fees</p>
                                    <p className="text-xl font-bold text-purple-900">0.18%</p>
                                    <p className="text-xs text-purple-600">Post Oct-24</p>
                                </div>
                                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                                    <p className="text-sm text-orange-700 font-medium">Edge After Costs</p>
                                    <p className="text-xl font-bold text-orange-900">+2.1%</p>
                                    <p className="text-xs text-orange-600">Net profitable</p>
                                </div>
                                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                                    <p className="text-sm text-indigo-700 font-medium">Avg Entry Latency</p>
                                    <p className="text-xl font-bold text-indigo-900">47ms</p>
                                    <p className="text-xs text-indigo-600">Target: &lt;150ms</p>
                                </div>
                                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                                    <p className="text-sm text-red-700 font-medium">Avg Exit Latency</p>
                                    <p className="text-xl font-bold text-red-900">52ms</p>
                                    <p className="text-xs text-red-600">Target: &lt;150ms</p>
                                </div>
                            </div>

                            {/* Detailed Telemetry */}
                            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card className="p-4 bg-gray-50">
                                    <h4 className="font-semibold mb-3 flex items-center">
                                        <Activity className="h-4 w-4 mr-2" />
                                        Execution Telemetry
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span>Order Slices Used:</span>
                                            <span className="font-mono">12/48 trades</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Market Protection Triggered:</span>
                                            <span className="font-mono">3/48 trades</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Realized vs Est Slippage:</span>
                                            <span className="font-mono text-green-600">-0.05% better</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Latency Spikes (&gt;300ms):</span>
                                            <span className="font-mono text-red-600">2 events</span>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="p-4 bg-gray-50">
                                    <h4 className="font-semibold mb-3 flex items-center">
                                        <Target className="h-4 w-4 mr-2" />
                                        Exit Reasons Analysis
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span>Target Hit (T1):</span>
                                            <span className="font-mono text-green-600">28 trades (58%)</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Target Hit (T2):</span>
                                            <span className="font-mono text-green-600">8 trades (17%)</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Stop Loss Hit:</span>
                                            <span className="font-mono text-red-600">9 trades (19%)</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Trail Stop:</span>
                                            <span className="font-mono text-blue-600">3 trades (6%)</span>
                                        </div>
                                    </div>
                                </Card>
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