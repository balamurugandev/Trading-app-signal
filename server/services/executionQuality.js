class ExecutionQualityService {
    constructor() {
        this.executionHistory = [];
        this.slippageModel = {
            marketImpact: 0.001, // 0.1% base market impact
            liquidityFactor: 1.0,
            volatilityFactor: 1.0
        };
        
        this.orderSlicing = {
            freezeLimit: 1800, // NSE freeze limit for NIFTY
            maxSliceSize: 900,
            sliceDelay: 100 // ms between slices
        };
        
        this.marketProtection = {
            maxSlippagePercent: 0.5,
            depthCheckLevels: 5
        };
    }
    
    estimateSlippage(symbol, quantity, orderType, marketDepth) {
        let baseSlippage = this.slippageModel.marketImpact;
        
        // Adjust for quantity
        const quantityImpact = Math.log(quantity / 100) * 0.0005;
        
        // Adjust for market depth
        const depthImpact = marketDepth.spread / marketDepth.midPrice * 0.5;
        
        // Adjust for order type
        const orderTypeMultiplier = orderType === 'market' ? 1.2 : 0.8;
        
        const estimatedSlippage = (baseSlippage + quantityImpact + depthImpact) * orderTypeMultiplier;
        
        return {
            estimated: estimatedSlippage,
            breakdown: {
                base: baseSlippage,
                quantity: quantityImpact,
                depth: depthImpact,
                orderType: orderTypeMultiplier
            }
        };
    }
    
    calculateOptimalSlicing(quantity, symbol) {
        const freezeLimit = this.orderSlicing.freezeLimit;
        
        if (quantity <= freezeLimit) {
            return {
                needsSlicing: false,
                slices: [{ quantity, delay: 0 }]
            };
        }
        
        const numSlices = Math.ceil(quantity / this.orderSlicing.maxSliceSize);
        const sliceSize = Math.floor(quantity / numSlices);
        const remainder = quantity % numSlices;
        
        const slices = [];
        for (let i = 0; i < numSlices; i++) {
            slices.push({
                quantity: sliceSize + (i < remainder ? 1 : 0),
                delay: i * this.orderSlicing.sliceDelay
            });
        }
        
        return {
            needsSlicing: true,
            slices,
            totalSlices: numSlices,
            estimatedTime: numSlices * this.orderSlicing.sliceDelay
        };
    }
    
    assessMarketProtection(orderPrice, marketDepth, maxSlippagePercent) {
        const midPrice = (marketDepth.bestBid + marketDepth.bestAsk) / 2;
        const maxSlippageAmount = midPrice * (maxSlippagePercent / 100);
        
        let protectedPrice;
        let protectionType;
        
        if (orderPrice > midPrice) {
            // Buy order
            protectedPrice = Math.min(orderPrice, marketDepth.bestAsk + maxSlippageAmount);
            protectionType = 'buy_limit';
        } else {
            // Sell order
            protectedPrice = Math.max(orderPrice, marketDepth.bestBid - maxSlippageAmount);
            protectionType = 'sell_limit';
        }
        
        return {
            originalPrice: orderPrice,
            protectedPrice,
            protectionType,
            maxSlippage: maxSlippageAmount,
            wouldTrigger: Math.abs(orderPrice - midPrice) > maxSlippageAmount
        };
    }
    
    simulateFill(order, marketDepth, latency) {
        const fillSimulation = {
            orderId: order.id,
            symbol: order.symbol,
            quantity: order.quantity,
            orderType: order.type,
            requestedPrice: order.price,
            timestamp: new Date(),
            latency: latency
        };
        
        // Simulate fill based on order type and market conditions
        if (order.type === 'market') {
            // Market order - fill at best available price with slippage
            const slippageEstimate = this.estimateSlippage(
                order.symbol, 
                order.quantity, 
                order.type, 
                marketDepth
            );
            
            const fillPrice = order.side === 'buy' 
                ? marketDepth.bestAsk * (1 + slippageEstimate.estimated)
                : marketDepth.bestBid * (1 - slippageEstimate.estimated);
            
            fillSimulation.fillPrice = fillPrice;
            fillSimulation.slippage = Math.abs(fillPrice - marketDepth.midPrice) / marketDepth.midPrice;
            fillSimulation.status = 'filled';
            
        } else if (order.type === 'limit') {
            // Limit order - check if price is achievable
            const canFill = order.side === 'buy' 
                ? order.price >= marketDepth.bestAsk
                : order.price <= marketDepth.bestBid;
            
            if (canFill) {
                fillSimulation.fillPrice = order.price;
                fillSimulation.slippage = 0;
                fillSimulation.status = 'filled';
            } else {
                fillSimulation.status = 'pending';
                fillSimulation.reason = 'price not achievable';
            }
        }
        
        // Add to execution history
        this.executionHistory.push(fillSimulation);
        
        return fillSimulation;
    }
    
    getExecutionMetrics(timeframe = '1d') {
        const cutoffTime = new Date();
        cutoffTime.setHours(cutoffTime.getHours() - (timeframe === '1d' ? 24 : 1));
        
        const recentExecutions = this.executionHistory.filter(
            exec => exec.timestamp > cutoffTime && exec.status === 'filled'
        );
        
        if (recentExecutions.length === 0) {
            return {
                totalTrades: 0,
                avgSlippage: 0,
                fillRate: 0,
                avgLatency: 0
            };
        }
        
        const totalSlippage = recentExecutions.reduce((sum, exec) => sum + (exec.slippage || 0), 0);
        const totalLatency = recentExecutions.reduce((sum, exec) => sum + exec.latency, 0);
        const totalOrders = this.executionHistory.filter(exec => exec.timestamp > cutoffTime).length;
        
        return {
            totalTrades: recentExecutions.length,
            avgSlippage: (totalSlippage / recentExecutions.length * 100).toFixed(3),
            fillRate: ((recentExecutions.length / totalOrders) * 100).toFixed(1),
            avgLatency: (totalLatency / recentExecutions.length).toFixed(0),
            bestSlippage: Math.min(...recentExecutions.map(e => e.slippage || 0)) * 100,
            worstSlippage: Math.max(...recentExecutions.map(e => e.slippage || 0)) * 100
        };
    }
    
    generateExecutionReport(signalId) {
        const signalExecutions = this.executionHistory.filter(
            exec => exec.signalId === signalId
        );
        
        if (signalExecutions.length === 0) {
            return null;
        }
        
        const entry = signalExecutions.find(exec => exec.side === 'buy');
        const exit = signalExecutions.find(exec => exec.side === 'sell');
        
        let pnl = 0;
        let totalCosts = 0;
        
        if (entry && exit) {
            pnl = (exit.fillPrice - entry.fillPrice) * entry.quantity;
            totalCosts = this.calculateTradingCosts(entry) + this.calculateTradingCosts(exit);
        }
        
        return {
            signalId,
            entry: entry || null,
            exit: exit || null,
            grossPnL: pnl.toFixed(2),
            totalCosts: totalCosts.toFixed(2),
            netPnL: (pnl - totalCosts).toFixed(2),
            totalSlippage: ((entry?.slippage || 0) + (exit?.slippage || 0)) * 100,
            executionQuality: this.assessExecutionQuality(signalExecutions)
        };
    }
    
    calculateTradingCosts(execution) {
        const turnover = execution.fillPrice * execution.quantity;
        
        // Post Oct 1, 2024 STT rates
        const stt = turnover * 0.0625 / 100; // 0.0625% on premium for options
        const exchangeFee = turnover * 0.00345 / 100;
        const sebiTurnover = turnover * 0.0001 / 100;
        const gst = (exchangeFee + sebiTurnover) * 0.18;
        const brokerage = 20; // Flat ₹20 per order
        
        return stt + exchangeFee + sebiTurnover + gst + brokerage;
    }
    
    assessExecutionQuality(executions) {
        const avgSlippage = executions.reduce((sum, exec) => sum + (exec.slippage || 0), 0) / executions.length;
        const avgLatency = executions.reduce((sum, exec) => sum + exec.latency, 0) / executions.length;
        
        let score = 100;
        
        // Penalize high slippage
        if (avgSlippage > 0.005) score -= 20; // >0.5%
        else if (avgSlippage > 0.002) score -= 10; // >0.2%
        
        // Penalize high latency
        if (avgLatency > 200) score -= 15;
        else if (avgLatency > 100) score -= 5;
        
        // Bonus for all fills
        const fillRate = executions.filter(e => e.status === 'filled').length / executions.length;
        if (fillRate === 1) score += 10;
        
        return {
            score: Math.max(0, score),
            grade: score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : 'D',
            avgSlippage: (avgSlippage * 100).toFixed(3),
            avgLatency: avgLatency.toFixed(0)
        };
    }
    
    getSlippageModel() {
        return this.slippageModel;
    }
    
    updateSlippageModel(actualSlippage, predictedSlippage, marketConditions) {
        // Simple learning mechanism to improve slippage predictions
        const error = actualSlippage - predictedSlippage;
        const learningRate = 0.1;
        
        this.slippageModel.marketImpact += error * learningRate * 0.1;
        
        // Adjust for market conditions
        if (marketConditions.volatility > 0.02) {
            this.slippageModel.volatilityFactor += error * learningRate * 0.05;
        }
        
        if (marketConditions.liquidity < 0.5) {
            this.slippageModel.liquidityFactor += error * learningRate * 0.05;
        }
    }
}

module.exports = ExecutionQualityService;