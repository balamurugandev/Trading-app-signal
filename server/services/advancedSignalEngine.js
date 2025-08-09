const EventEmitter = require('events');

class AdvancedSignalEngine extends EventEmitter {
    constructor() {
        super();
        this.marketQuality = {
            latency: 45,
            tickRate: 120,
            reconnects: 0,
            domImbalance: 15.2,
            isStable: true
        };
        
        this.costRegime = {
            sttRate: 0.0625, // Post Oct 1, 2024 - 0.0625% on premium for options
            exchangeFeeRate: 0.00345, // NSE transaction fee
            sebiTurnoverRate: 0.0001, // SEBI turnover fee
            gstRate: 0.18, // 18% GST on exchange and SEBI fees
            brokerageFlat: 20 // Flat ₹20 per order
        };
        
        this.liquidityThresholds = {
            minDepth: 500,
            maxSpread: 5.0,
            minVolume: 1000
        };
        
        this.safetyRails = {
            maxLatency: 150,
            maxConsecutiveLosses: 3,
            dailyMaxLoss: 10000,
            maxTradesPerDay: 20
        };
        
        this.cprClassification = {
            narrow: 0.3,
            wide: 0.7
        };
        
        this.blackoutWindows = [
            { start: '09:15', end: '09:20', reason: 'Opening volatility' },
            { start: '15:25', end: '15:30', reason: 'Closing volatility' }
        ];
        
        this.startEngine();
    }
    
    startEngine() {
        // Simulate market quality updates
        setInterval(() => {
            this.updateMarketQuality();
        }, 2000);
        
        // Generate advanced signals
        setInterval(() => {
            this.generateAdvancedSignal();
        }, 30000);
    }
    
    updateMarketQuality() {
        this.marketQuality = {
            latency: Math.max(20, Math.min(300, this.marketQuality.latency + (Math.random() - 0.5) * 20)),
            tickRate: Math.max(80, Math.min(200, this.marketQuality.tickRate + (Math.random() - 0.5) * 10)),
            reconnects: this.marketQuality.reconnects + (Math.random() > 0.99 ? 1 : 0),
            domImbalance: this.marketQuality.domImbalance + (Math.random() - 0.5) * 5,
            isStable: this.marketQuality.latency < this.safetyRails.maxLatency
        };
        
        this.emit('marketQualityUpdate', this.marketQuality);
    }
    
    calculateCosts(premium, quantity = 50) {
        const turnover = premium * quantity;
        
        const stt = turnover * this.costRegime.sttRate / 100;
        const exchangeFee = turnover * this.costRegime.exchangeFeeRate / 100;
        const sebiTurnover = turnover * this.costRegime.sebiTurnoverRate / 100;
        const gst = (exchangeFee + sebiTurnover) * this.costRegime.gstRate;
        const brokerage = this.costRegime.brokerageFlat;
        
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
    }
    
    assessLiquidity(strike, symbol) {
        // Simulate liquidity assessment
        const spread = 1.5 + Math.random() * 3;
        const depth = 60 + Math.random() * 40;
        const volume = 500 + Math.random() * 2000;
        
        const spreadScore = spread <= this.liquidityThresholds.maxSpread ? 100 : 50;
        const depthScore = depth >= 80 ? 100 : depth >= 60 ? 75 : 50;
        const volumeScore = volume >= this.liquidityThresholds.minVolume ? 100 : 50;
        
        const overallScore = (spreadScore + depthScore + volumeScore) / 3;
        
        return {
            spread: spread.toFixed(2),
            depth: depth.toFixed(0),
            volume: volume.toFixed(0),
            score: overallScore >= 80 ? 'Excellent' : overallScore >= 60 ? 'Good' : 'Poor',
            passesFilter: overallScore >= 60
        };
    }
    
    classifyCPR(high, low, close) {
        const pivot = (high + low + close) / 3;
        const tc = (pivot - low) + pivot;
        const bc = pivot - (high - pivot);
        const cprWidth = ((tc - bc) / pivot) * 100;
        
        let classification;
        if (cprWidth < this.cprClassification.narrow) {
            classification = { type: 'Narrow', hint: 'Trending Day Expected', color: 'green' };
        } else if (cprWidth > this.cprClassification.wide) {
            classification = { type: 'Wide', hint: 'Choppy/Range Day', color: 'red' };
        } else {
            classification = { type: 'Normal', hint: 'Mixed Conditions', color: 'blue' };
        }
        
        return {
            width: cprWidth.toFixed(2),
            classification,
            tc: tc.toFixed(2),
            pivot: pivot.toFixed(2),
            bc: bc.toFixed(2)
        };
    }
    
    isInBlackoutWindow() {
        const now = new Date();
        const currentTime = now.toTimeString().slice(0, 5);
        
        return this.blackoutWindows.some(window => {
            return currentTime >= window.start && currentTime <= window.end;
        });
    }
    
    validateSignalPreconditions(marketData, indicators) {
        const preconditions = {
            structureTrend: marketData.price > indicators.vwap && indicators.ema9 > indicators.ema21,
            momentum: indicators.rsi > 50 || (indicators.macd.line > indicators.macd.signal && indicators.macd.histogram > 0),
            volatility: indicators.bb.expanding || marketData.pivotReclaim,
            marketQuality: this.marketQuality.latency <= this.safetyRails.maxLatency && this.marketQuality.isStable,
            notInBlackout: !this.isInBlackoutWindow()
        };
        
        const allPassed = Object.values(preconditions).every(condition => condition);
        
        return {
            passed: allPassed,
            details: preconditions
        };
    }
    
    generateAdvancedSignal() {
        // Simulate market data
        const marketData = {
            symbol: Math.random() > 0.5 ? 'NIFTY' : 'BANKNIFTY',
            price: 21520 + (Math.random() - 0.5) * 100,
            timeframe: ['1m', '5m', '15m'][Math.floor(Math.random() * 3)]
        };
        
        // Simulate technical indicators
        const indicators = {
            vwap: marketData.price - 5 + Math.random() * 10,
            ema9: marketData.price - 3 + Math.random() * 6,
            ema21: marketData.price - 8 + Math.random() * 16,
            rsi: 45 + Math.random() * 30,
            macd: {
                line: 10 + Math.random() * 10,
                signal: 8 + Math.random() * 10,
                histogram: -2 + Math.random() * 4
            },
            bb: {
                upper: marketData.price + 30,
                middle: marketData.price,
                lower: marketData.price - 30,
                expanding: Math.random() > 0.5
            }
        };
        
        // Validate preconditions
        const validation = this.validateSignalPreconditions(marketData, indicators);
        
        if (!validation.passed) {
            console.log('Signal preconditions not met:', validation.details);
            return;
        }
        
        // Generate strike and assess liquidity
        const strike = Math.round(marketData.price / 50) * 50;
        const premium = 50 + Math.random() * 100;
        const liquidity = this.assessLiquidity(strike, marketData.symbol);
        
        if (!liquidity.passesFilter) {
            console.log('Liquidity filter failed for strike:', strike);
            return;
        }
        
        // Calculate costs
        const costs = this.calculateCosts(premium);
        
        // Generate signal
        const signal = {
            instrument: marketData.symbol,
            timeframe: marketData.timeframe,
            setup: Math.random() > 0.5 ? 'MomentumContinuation' : 'CPRReclaim',
            signal: 'BUY_CALL',
            underlying_entry: marketData.price,
            option_strike: `${strike} CE`,
            option_ltp: premium,
            spread_paise: parseFloat(liquidity.spread) * 100,
            depth_score: parseFloat(liquidity.depth) / 100,
            dom_imbalance: `${this.marketQuality.domImbalance > 0 ? '+' : ''}${this.marketQuality.domImbalance.toFixed(1)}%`,
            market_quality: {
                latency_ms: Math.round(this.marketQuality.latency),
                tick_rate_hz: Math.round(this.marketQuality.tickRate),
                stable: this.marketQuality.isStable
            },
            costs: {
                stt_regime: 'post-01-Oct-2024',
                est_total_cost_pct: parseFloat(costs.percentage)
            },
            order_controls: {
                type: 'market',
                slice: true,
                slice_hint: 'auto if >freeze'
            },
            stop_loss_underlying: marketData.price - (marketData.price * 0.01),
            sl_basis: 'VWAP',
            targets: {
                t1: marketData.price + (marketData.price * 0.015),
                t2: marketData.price + (marketData.price * 0.025)
            },
            trail: {
                mode: 'auto',
                type: 'EMA9',
                step: 0
            },
            confirmations: validation.details,
            confidence: liquidity.score === 'Excellent' && costs.percentage < 0.2 ? 'High' : 'Medium',
            invalidation: ['close<EMA21/VWAP', 'MACD down', 'RSI<50', 'DOM offer surge', 'latency>300ms'],
            timestamp_ist: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
        };
        
        this.emit('advancedSignal', signal);
        console.log('Advanced signal generated:', signal);
    }
    
    getMarketQuality() {
        return this.marketQuality;
    }
    
    getCostRegime() {
        return this.costRegime;
    }
    
    getSafetyRails() {
        return this.safetyRails;
    }
}

module.exports = AdvancedSignalEngine;