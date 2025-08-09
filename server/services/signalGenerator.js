const moment = require('moment-timezone');

class SignalGenerator {
  constructor(technicalAnalysis, riskManager) {
    this.ta = technicalAnalysis;
    this.riskManager = riskManager;
    this.lastSignals = new Map(); // Track last signal time to avoid spam
  }

  /**
   * Generate BUY signals based on confluence strategy
   * Only generates signals during liquid windows with all filters aligned
   */
  generateSignal(symbol, timeframe, marketData, indicators) {
    try {
      // Skip if insufficient data
      if (!marketData || marketData.length < 50) return null;

      const currentCandle = marketData[marketData.length - 1];
      const currentPrice = currentCandle.close;

      // Check if we recently generated a signal (avoid spam)
      const signalKey = `${symbol}_${timeframe}`;
      const lastSignalTime = this.lastSignals.get(signalKey);
      const now = moment();
      
      if (lastSignalTime && now.diff(lastSignalTime, 'minutes') < this.getMinSignalInterval(timeframe)) {
        return null;
      }

      // 1. TREND FILTER: Price above VWAP and EMA alignment
      const trendFilter = this.checkTrendFilter(currentPrice, indicators);
      if (!trendFilter.passed) return null;

      // 2. MOMENTUM TRIGGER: RSI or MACD conditions
      const momentumTrigger = this.checkMomentumTrigger(indicators);
      if (!momentumTrigger.passed) return null;

      // 3. VOLATILITY/STRUCTURE: BB expansion or CPR support
      const volatilityStructure = this.checkVolatilityStructure(currentPrice, indicators);
      if (!volatilityStructure.passed) return null;

      // 4. SIGNAL VALIDATION: VWAP not flat and momentum present
      const signalValidation = this.validateSignal(indicators);
      if (!signalValidation.passed) return null;

      // All filters passed - generate signal
      const signal = this.createBuySignal(
        symbol,
        timeframe,
        currentCandle,
        indicators,
        {
          trendFilter,
          momentumTrigger,
          volatilityStructure,
          signalValidation
        }
      );

      // Update last signal time
      this.lastSignals.set(signalKey, now);

      return signal;

    } catch (error) {
      console.error(`Error generating signal for ${symbol} ${timeframe}:`, error);
      return null;
    }
  }

  /**
   * Check trend filter conditions
   * - Price above intraday VWAP
   * - Fast EMAs aligned bullish (9 EMA > 21 EMA)
   */
  checkTrendFilter(currentPrice, indicators) {
    const { vwap, ema9, ema21 } = indicators;

    // Price above VWAP
    const aboveVWAP = this.ta.isPriceAboveVWAP(currentPrice, vwap);
    
    // EMA alignment (9 > 21)
    const emaAligned = this.ta.isEMAAlignedBullish(ema9, ema21);

    const passed = aboveVWAP && emaAligned;

    return {
      passed,
      aboveVWAP,
      emaAligned,
      vwapValue: vwap[vwap.length - 1],
      ema9Value: ema9[ema9.length - 1],
      ema21Value: ema21[ema21.length - 1]
    };
  }

  /**
   * Check momentum trigger conditions
   * - RSI turning up through 40-60 zone (ideally 50-55)
   * - OR MACD line crosses above signal line with histogram expansion
   */
  checkMomentumTrigger(indicators) {
    const { rsi, rsi7, rsi9, macd } = indicators;

    // Check RSI momentum (prefer 7-9 period for scalping)
    const rsiMomentum7 = this.ta.checkRSIMomentum(rsi7);
    const rsiMomentum9 = this.ta.checkRSIMomentum(rsi9);
    const rsiMomentum14 = this.ta.checkRSIMomentum(rsi);

    // Use best RSI signal (prefer shorter periods)
    let bestRSI = rsiMomentum7;
    if (!bestRSI.isTurningUp && rsiMomentum9.isTurningUp) bestRSI = rsiMomentum9;
    if (!bestRSI.isTurningUp && rsiMomentum14.isTurningUp) bestRSI = rsiMomentum14;

    const rsiCondition = bestRSI.isTurningUp && bestRSI.inOptimalZone;

    // Check MACD momentum
    const macdMomentum = this.ta.checkMACDMomentum(macd);
    const macdCondition = macdMomentum.bullishCrossover && macdMomentum.histogramExpanding;

    const passed = rsiCondition || macdCondition;

    return {
      passed,
      rsiCondition,
      macdCondition,
      rsiDetails: bestRSI,
      macdDetails: macdMomentum,
      trigger: rsiCondition ? 'RSI' : (macdCondition ? 'MACD' : 'NONE')
    };
  }

  /**
   * Check volatility/structure conditions
   * - Bollinger Bands expansion during breakouts
   * - OR price reclaims/demonstrates support at CPR/pivot levels
   */
  checkVolatilityStructure(currentPrice, indicators) {
    const { bb, cpr, pivots } = indicators;

    // Bollinger Bands expansion
    const bbExpanding = this.ta.isBBExpanding(bb);
    
    // Check if price is breaking out above BB middle
    const currentBB = bb[bb.length - 1];
    const bbBreakout = currentPrice > currentBB.middle && bbExpanding;

    // CPR support/resistance
    let cprSupport = false;
    if (cpr) {
      // Price above pivot or reclaiming pivot area
      cprSupport = currentPrice > cpr.pivot || 
                   (currentPrice > cpr.bc && currentPrice < cpr.tc);
    }

    // Recent pivot support
    let pivotSupport = false;
    if (pivots && pivots.length > 0) {
      const recentPivots = pivots.slice(-5); // Last 5 pivots
      pivotSupport = recentPivots.some(pivot => 
        pivot.type === 'low' && 
        Math.abs(currentPrice - pivot.price) / pivot.price < 0.002 // Within 0.2%
      );
    }

    const passed = bbBreakout || cprSupport || pivotSupport;

    return {
      passed,
      bbExpanding,
      bbBreakout,
      cprSupport,
      pivotSupport,
      currentBB: currentBB,
      cpr: cpr
    };
  }

  /**
   * Final signal validation
   * - VWAP not flat (has momentum)
   * - Overall momentum present
   */
  validateSignal(indicators) {
    const { vwap } = indicators;

    // Check if VWAP is trending (not flat)
    let vwapTrending = false;
    if (vwap.length >= 10) {
      const recent = vwap.slice(-10);
      const slope = (recent[recent.length - 1] - recent[0]) / recent.length;
      vwapTrending = Math.abs(slope) > 0.1; // Minimum slope threshold
    }

    const passed = vwapTrending;

    return {
      passed,
      vwapTrending
    };
  }

  /**
   * Create BUY signal with all necessary details
   */
  createBuySignal(symbol, timeframe, currentCandle, indicators, conditions) {
    const currentPrice = currentCandle.close;
    const { cpr, vwap, ema9, psar } = indicators;

    // Calculate stop loss (pullback low, VWAP, or CPR band)
    const stopLoss = this.calculateStopLoss(currentPrice, currentCandle, indicators);
    
    // Calculate targets (1R-1.5R)
    const riskAmount = currentPrice - stopLoss;
    const target1 = currentPrice + (riskAmount * 1.0); // 1R
    const target2 = currentPrice + (riskAmount * 1.5); // 1.5R

    // Determine option strike (ATM or slightly ITM)
    const optionStrike = this.getOptionStrike(symbol, currentPrice);

    return {
      id: `${symbol}_${timeframe}_${Date.now()}`,
      symbol,
      timeframe,
      type: 'BUY',
      timestamp: moment().tz('Asia/Kolkata').toISOString(),
      
      // Entry details
      entryPrice: currentPrice,
      optionStrike,
      optionType: 'CALL',
      
      // Risk management
      stopLoss,
      target1,
      target2,
      riskReward: '1:1.5',
      
      // Technical context
      vwap: vwap[vwap.length - 1],
      ema9: ema9[ema9.length - 1],
      
      // Signal strength and conditions
      strength: this.calculateSignalStrength(conditions),
      conditions: {
        trendFilter: conditions.trendFilter.passed,
        momentumTrigger: conditions.momentumTrigger.trigger,
        volatilityStructure: conditions.volatilityStructure.passed,
        signalValidation: conditions.signalValidation.passed
      },
      
      // Trading instructions
      instructions: this.generateTradingInstructions(conditions, stopLoss, target1, target2),
      
      // Trailing stop guidance
      trailingStop: {
        method: 'EMA9', // or 'PSAR'
        currentLevel: ema9[ema9.length - 1]
      }
    };
  }

  /**
   * Calculate stop loss based on multiple factors
   */
  calculateStopLoss(currentPrice, currentCandle, indicators) {
    const { vwap, cpr } = indicators;
    
    const options = [];
    
    // Option 1: Recent pullback low (current candle low)
    options.push(currentCandle.low);
    
    // Option 2: VWAP level
    if (vwap.length > 0) {
      options.push(vwap[vwap.length - 1]);
    }
    
    // Option 3: CPR pivot level
    if (cpr && cpr.pivot < currentPrice) {
      options.push(cpr.pivot);
    }
    
    // Choose the highest valid stop loss (tightest)
    const validStops = options.filter(stop => stop < currentPrice);
    return validStops.length > 0 ? Math.max(...validStops) : currentPrice * 0.995; // 0.5% fallback
  }

  /**
   * Get appropriate option strike (ATM or slightly ITM)
   */
  getOptionStrike(symbol, currentPrice) {
    // Round to nearest strike based on symbol
    let strikeInterval;
    
    if (symbol === 'NIFTY') {
      strikeInterval = currentPrice > 20000 ? 100 : 50;
    } else if (symbol === 'BANKNIFTY') {
      strikeInterval = 100;
    } else {
      strikeInterval = 50; // Default
    }
    
    // ATM strike
    const atmStrike = Math.round(currentPrice / strikeInterval) * strikeInterval;
    
    // Slightly ITM (one strike below for calls)
    const itmStrike = atmStrike - strikeInterval;
    
    // Return ATM for now, can be made configurable
    return atmStrike;
  }

  /**
   * Calculate signal strength based on confluence
   */
  calculateSignalStrength(conditions) {
    let strength = 0;
    
    // Trend filter strength
    if (conditions.trendFilter.passed) strength += 25;
    
    // Momentum trigger strength
    if (conditions.momentumTrigger.rsiCondition && conditions.momentumTrigger.rsiDetails.inIdealZone) {
      strength += 30; // Higher for ideal RSI zone
    } else if (conditions.momentumTrigger.rsiCondition) {
      strength += 20;
    }
    
    if (conditions.momentumTrigger.macdCondition) strength += 25;
    
    // Volatility/structure strength
    if (conditions.volatilityStructure.bbBreakout) strength += 20;
    if (conditions.volatilityStructure.cprSupport) strength += 15;
    if (conditions.volatilityStructure.pivotSupport) strength += 10;
    
    return Math.min(strength, 100); // Cap at 100%
  }

  /**
   * Generate trading instructions
   */
  generateTradingInstructions(conditions, stopLoss, target1, target2) {
    const instructions = [];
    
    instructions.push(`Entry: Buy ${conditions.momentumTrigger.trigger} momentum signal`);
    instructions.push(`Stop Loss: ${stopLoss.toFixed(2)} (${conditions.volatilityStructure.cprSupport ? 'CPR' : 'Technical'} level)`);
    instructions.push(`Target 1: ${target1.toFixed(2)} (1R) - Exit 50% position`);
    instructions.push(`Target 2: ${target2.toFixed(2)} (1.5R) - Exit remaining 50%`);
    instructions.push(`Trail remaining position with 9 EMA after Target 1`);
    
    return instructions;
  }

  /**
   * Get minimum interval between signals for timeframe
   */
  getMinSignalInterval(timeframe) {
    switch (timeframe) {
      case '1m': return 2; // 2 minutes
      case '5m': return 10; // 10 minutes
      case '15m': return 30; // 30 minutes
      default: return 5;
    }
  }
}

module.exports = SignalGenerator;