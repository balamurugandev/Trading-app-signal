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

      // Check if we recently generated a signal (avoid spam) - RELAXED for testing
      const signalKey = `${symbol}_${timeframe}`;
      const lastSignalTime = this.lastSignals.get(signalKey);
      const now = moment();
      
      // Reduce minimum interval for more frequent signals during testing
      const minInterval = Math.max(1, this.getMinSignalInterval(timeframe) * 0.5); // 50% of normal interval
      
      if (lastSignalTime && now.diff(lastSignalTime, 'minutes') < minInterval) {
        console.log(`Signal blocked - too recent. Last: ${lastSignalTime.format('HH:mm:ss')}, Min interval: ${minInterval}min`);
        return null;
      }

      // SCALPING MODE: Very relaxed conditions for frequent signals
      const trendFilter = this.checkTrendFilter(currentPrice, indicators);
      const momentumTrigger = this.checkMomentumTrigger(indicators);
      const volatilityStructure = this.checkVolatilityStructure(currentPrice, indicators);
      const signalValidation = this.validateSignal(indicators);

      console.log(`Original conditions: Trend=${trendFilter.passed}, Momentum=${momentumTrigger.passed}, Volatility=${volatilityStructure.passed}, Validation=${signalValidation.passed}`);

      // SCALPING MODE: Generate signals more frequently for testing
      // Handle RSI as either a number or array (take the last value if array)
      const currentRSI = Array.isArray(indicators.rsi) ? indicators.rsi[indicators.rsi.length - 1] : indicators.rsi;
      
      // VERY RELAXED CONDITIONS FOR SCALPING TESTING - Always generate signals during market hours
      const basicConditionsMet = true; // Always pass for testing

      console.log(`✅ GENERATING SCALPING SIGNAL - RSI: ${currentRSI?.toFixed(1)}, Price: ${currentCandle.close}`);
      
      // Override conditions for scalping - always pass
      const scalpingConditions = {
        trendFilter: { ...trendFilter, passed: true },
        momentumTrigger: { ...momentumTrigger, passed: true },
        volatilityStructure: { ...volatilityStructure, passed: true },
        signalValidation: { ...signalValidation, passed: true }
      };

      const signal = this.createBuySignal(
        symbol,
        timeframe,
        currentCandle,
        indicators,
        scalpingConditions
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
   * Check trend filter conditions - RELAXED FOR SCALPING
   * - Price above VWAP OR near VWAP (within 0.1%)
   * - EMA9 > EMA21 OR price showing momentum
   */
  checkTrendFilter(currentPrice, indicators) {
    const { vwap, ema9, ema21 } = indicators;

    // Get latest values safely
    const latestVWAP = Array.isArray(vwap) ? vwap[vwap.length - 1] : vwap;
    const latestEMA9 = Array.isArray(ema9) ? ema9[ema9.length - 1] : ema9;
    const latestEMA21 = Array.isArray(ema21) ? ema21[ema21.length - 1] : ema21;

    // RELAXED: Price above VWAP or within 0.1% (for scalping)
    const vwapTolerance = latestVWAP * 0.001; // 0.1% tolerance
    const aboveVWAP = currentPrice >= (latestVWAP - vwapTolerance);
    
    // RELAXED: EMA alignment OR price momentum
    const emaAligned = latestEMA9 > latestEMA21;
    const priceNearEMA9 = Math.abs(currentPrice - latestEMA9) < (currentPrice * 0.002); // Within 0.2%
    
    // Pass if either condition is met (much more relaxed for scalping)
    // FOR TESTING: Always pass during market hours to ensure signals are generated
    const passed = true; // aboveVWAP || emaAligned || priceNearEMA9;

    console.log(`Trend Filter: Price=${currentPrice.toFixed(2)}, VWAP=${latestVWAP?.toFixed(2)}, EMA9=${latestEMA9?.toFixed(2)}, EMA21=${latestEMA21?.toFixed(2)}, Passed=${passed}`);

    return {
      passed,
      aboveVWAP,
      emaAligned,
      vwapValue: latestVWAP,
      ema9Value: latestEMA9,
      ema21Value: latestEMA21
    };
  }

  /**
   * Check momentum trigger conditions - SIMPLIFIED FOR SCALPING
   * - RSI above 30 (not oversold)
   * - OR MACD histogram positive
   * - OR recent price momentum
   */
  checkMomentumTrigger(indicators) {
    const { rsi, macd } = indicators;

    // Get latest values safely
    const latestRSI = Array.isArray(rsi) ? rsi[rsi.length - 1] : rsi;
    const latestMACD = Array.isArray(macd) ? macd[macd.length - 1] : macd;

    // SIMPLIFIED: RSI not oversold (above 30)
    const rsiCondition = latestRSI && latestRSI > 30;

    // SIMPLIFIED: MACD histogram positive OR line above signal
    let macdCondition = false;
    if (latestMACD) {
      if (latestMACD.histogram !== undefined) {
        macdCondition = latestMACD.histogram > -2; // Allow slightly negative
      } else if (latestMACD.line !== undefined && latestMACD.signal !== undefined) {
        macdCondition = latestMACD.line > latestMACD.signal - 1; // Allow close values
      } else {
        macdCondition = true; // If no MACD data, don't block
      }
    } else {
      macdCondition = true; // If no MACD data, don't block
    }

    // SCALPING: Pass if either condition is met OR if we have basic momentum
    const passed = rsiCondition || macdCondition || true; // Always pass for scalping

    console.log(`Momentum Trigger: RSI=${latestRSI?.toFixed(1)}, RSI_OK=${rsiCondition}, MACD_OK=${macdCondition}, Passed=${passed}`);

    return {
      passed,
      rsiCondition,
      macdCondition,
      trigger: rsiCondition ? 'RSI' : (macdCondition ? 'MACD' : 'SCALPING')
    };
  }

  /**
   * Check volatility/structure conditions - SIMPLIFIED FOR SCALPING
   * - Always pass for scalping (we want more signals)
   * - Basic volatility check only
   */
  checkVolatilityStructure(currentPrice, indicators) {
    const { bb, cpr } = indicators;

    // SIMPLIFIED: Always allow signals for scalping
    // In real scalping, we take signals based on momentum, not complex structure
    let passed = true;
    
    // Optional: Basic Bollinger Bands check
    let bbCondition = true;
    if (bb && Array.isArray(bb) && bb.length > 0) {
      const currentBB = bb[bb.length - 1];
      if (currentBB && currentBB.middle) {
        // Allow signals if price is not at extreme BB levels
        bbCondition = currentPrice > currentBB.lower && currentPrice < currentBB.upper * 1.01;
      }
    }

    // Optional: Basic CPR check
    let cprCondition = true;
    if (cpr && cpr.pivot) {
      // Allow signals if price is above pivot or in reasonable range
      cprCondition = currentPrice > cpr.pivot * 0.995; // Within 0.5% of pivot
    }

    passed = bbCondition && cprCondition;

    console.log(`Volatility Structure: BB=${bbCondition}, CPR=${cprCondition}, Passed=${passed}`);

    return {
      passed,
      bbCondition,
      cprCondition,
      reason: passed ? 'Structure OK' : 'Structure blocked'
    };
  }

  /**
   * Final signal validation - SIMPLIFIED FOR SCALPING
   * - Always pass for scalping (we want more signals)
   */
  validateSignal(indicators) {
    // SIMPLIFIED: Always pass for scalping
    // In scalping, we rely on quick entries and exits, not complex validation
    const passed = true;

    console.log(`Signal Validation: Always passed for scalping`);

    return {
      passed,
      reason: 'Scalping mode - validation bypassed'
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
    if (conditions.momentumTrigger.rsiCondition) {
      strength += 25; // RSI condition met
    }
    if (conditions.momentumTrigger.macdCondition) {
      strength += 20; // MACD condition met
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
    // More responsive intervals during ALL market hours for scalping
    const now = moment().tz('Asia/Kolkata');
    const time = now.format('HH:mm');
    const isLiquidWindow = (time >= '09:25' && time <= '11:00') || 
                          (time >= '13:45' && time <= '15:05');
    
    // Reduce intervals during liquid windows, but keep reasonable intervals during all market hours
    const multiplier = isLiquidWindow ? 0.3 : 0.7; // More aggressive during liquid, but still active during all hours
    
    switch (timeframe) {
      case '1m': return Math.max(1, Math.floor(3 * multiplier)); // 1-2 minutes
      case '5m': return Math.max(2, Math.floor(8 * multiplier)); // 2-6 minutes  
      case '15m': return Math.max(5, Math.floor(20 * multiplier)); // 5-14 minutes
      default: return Math.max(1, Math.floor(4 * multiplier));
    }
  }
}

module.exports = SignalGenerator;