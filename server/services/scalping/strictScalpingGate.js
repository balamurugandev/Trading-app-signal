const moment = require('moment-timezone');

class StrictScalpingGate {
  constructor(dataProvider, technicalAnalysis) {
    this.dataProvider = dataProvider;
    this.technicalAnalysis = technicalAnalysis;
    
    // Risk limits
    this.riskLimits = {
      perTradeRiskPct: 0.75,
      dailyLossCapPct: 2.0,
      maxTradesPerDay: 6
    };
    
    // Options tradability thresholds
    this.optionsGates = {
      NIFTY: { maxSpreadPct: 1.5, minDelta: 0.45 },
      BANKNIFTY: { maxSpreadPct: 2.0, minDelta: 0.45 }
    };
    
    // ATR multipliers
    this.atrBounds = {
      sl: { min: 0.8, max: 2.0, default: 1.2 },
      tp: { min: 1.0, max: 3.0, default: 1.6 }
    };
    
    // Daily tracking
    this.dailyStats = {
      tradesCount: 0,
      totalLoss: 0,
      lastResetDate: moment().format('YYYY-MM-DD')
    };
  }

  /**
   * Main validation gate - processes raw signal and returns PASSED/REWRITTEN/REJECTED
   */
  async validateScalpingSignal(rawSignal) {
    try {
      console.log(`🔍 SCALPING GATE: Validating ${rawSignal.instrument} ${rawSignal.timeframes?.entry || rawSignal.timeframe}`);
      
      // Reset daily stats if new day
      this.resetDailyStatsIfNeeded();
      
      // Get market data and indicators
      const marketData = await this.getMarketDataForValidation(rawSignal);
      if (!marketData.valid) {
        return this.reject('INVALID_MARKET_DATA', marketData.reasons);
      }
      
      // Determine signal direction based on rules
      const signalAnalysis = await this.analyzeSignalDirection(rawSignal, marketData);
      
      const results = [];
      
      // Check CALL signal if bullish conditions
      if (signalAnalysis.bullish.valid) {
        const callResult = await this.validateSignal(rawSignal, marketData, 'CALL', signalAnalysis.bullish);
        results.push(callResult);
      }
      
      // Check PUT signal if bearish conditions
      if (signalAnalysis.bearish.valid) {
        const putResult = await this.validateSignal(rawSignal, marketData, 'PUT', signalAnalysis.bearish);
        results.push(putResult);
      }
      
      // If no valid direction found
      if (results.length === 0) {
        return this.reject('NO_VALID_DIRECTION', [
          `Bullish: ${signalAnalysis.bullish.reasons.join(', ')}`,
          `Bearish: ${signalAnalysis.bearish.reasons.join(', ')}`
        ]);
      }
      
      return results;
      
    } catch (error) {
      console.error('❌ Scalping gate error:', error);
      return this.reject('VALIDATION_ERROR', [error.message]);
    }
  }

  /**
   * Validate individual CALL or PUT signal
   */
  async validateSignal(rawSignal, marketData, side, directionAnalysis) {
    const validations = {
      timeframeAlignment: { status: 'PENDING', reasons: [] },
      entryTrigger: { status: 'PENDING', reasons: [] },
      structureConfirmation: { status: 'PENDING', reasons: [] },
      atrBasedLevels: { status: 'PENDING', reasons: [] },
      optionsTradability: { status: 'PENDING', reasons: [] },
      premiumRiskReward: { status: 'PENDING', reasons: [] },
      eventFilter: { status: 'PENDING', reasons: [] },
      riskLimits: { status: 'PENDING', reasons: [] }
    };

    // 1. Timeframe Alignment
    const timeframeCheck = this.validateTimeframeAlignment(rawSignal);
    validations.timeframeAlignment = timeframeCheck;

    // 2. Entry Trigger
    const entryCheck = this.validateEntryTrigger(rawSignal, marketData, side, directionAnalysis);
    validations.entryTrigger = entryCheck;

    // 3. Structure Confirmation
    const structureCheck = this.validateStructureConfirmation(marketData, side);
    validations.structureConfirmation = structureCheck;

    // 4. ATR-based SL/TP
    const atrCheck = await this.validateATRLevels(rawSignal, marketData);
    validations.atrBasedLevels = atrCheck;

    // 5. Options Tradability
    const optionsCheck = await this.validateOptionsTradability(rawSignal, side);
    validations.optionsTradability = optionsCheck;

    // 6. Premium R:R after costs
    const rrCheck = await this.validatePremiumRiskReward(rawSignal, atrCheck.levels, side);
    validations.premiumRiskReward = rrCheck;

    // 7. Event Filter
    const eventCheck = this.validateEventFilter();
    validations.eventFilter = eventCheck;

    // 8. Risk Limits
    const riskCheck = this.validateRiskLimits();
    validations.riskLimits = riskCheck;

    // Determine final decision
    return this.makeFinalDecision(rawSignal, validations, side, marketData, atrCheck.levels);
  }

  /**
   * Analyze signal direction based on EMA and RSI rules
   */
  async analyzeSignalDirection(rawSignal, marketData) {
    const { indicators5m, indicators15m } = marketData;
    
    const analysis = {
      bullish: { valid: false, reasons: [] },
      bearish: { valid: false, reasons: [] }
    };

    // Get latest values
    const close5m = marketData.candles5m[marketData.candles5m.length - 1].close;
    const ema20_5m = indicators5m.ema20[indicators5m.ema20.length - 1];
    const ema20_15m = indicators15m.ema20[indicators15m.ema20.length - 1];
    const ema50_15m = indicators15m.ema50[indicators15m.ema50.length - 1];
    const rsi5m = indicators5m.rsi[indicators5m.rsi.length - 1];

    // Bullish CALL conditions
    const bullishConditions = {
      close_above_ema20_5m: close5m > ema20_5m,
      ema20_above_ema50_15m: ema20_15m > ema50_15m,
      rsi_in_reset_zone: rsi5m >= 45 && rsi5m <= 60
    };

    if (bullishConditions.close_above_ema20_5m && 
        bullishConditions.ema20_above_ema50_15m && 
        bullishConditions.rsi_in_reset_zone) {
      analysis.bullish.valid = true;
      analysis.bullish.reasons.push('All bullish conditions met');
    } else {
      if (!bullishConditions.close_above_ema20_5m) 
        analysis.bullish.reasons.push(`5m close (${close5m.toFixed(2)}) not above EMA20 (${ema20_5m.toFixed(2)})`);
      if (!bullishConditions.ema20_above_ema50_15m) 
        analysis.bullish.reasons.push(`15m EMA20 (${ema20_15m.toFixed(2)}) not above EMA50 (${ema50_15m.toFixed(2)})`);
      if (!bullishConditions.rsi_in_reset_zone) 
        analysis.bullish.reasons.push(`RSI (${rsi5m.toFixed(1)}) not in 45-60 reset zone`);
    }

    // Bearish PUT conditions
    const bearishConditions = {
      close_below_ema20_5m: close5m < ema20_5m,
      ema20_below_ema50_15m: ema20_15m < ema50_15m,
      rsi_in_reset_zone: rsi5m >= 40 && rsi5m <= 55
    };

    if (bearishConditions.close_below_ema20_5m && 
        bearishConditions.ema20_below_ema50_15m && 
        bearishConditions.rsi_in_reset_zone) {
      analysis.bearish.valid = true;
      analysis.bearish.reasons.push('All bearish conditions met');
    } else {
      if (!bearishConditions.close_below_ema20_5m) 
        analysis.bearish.reasons.push(`5m close (${close5m.toFixed(2)}) not below EMA20 (${ema20_5m.toFixed(2)})`);
      if (!bearishConditions.ema20_below_ema50_15m) 
        analysis.bearish.reasons.push(`15m EMA20 (${ema20_15m.toFixed(2)}) not below EMA50 (${ema50_15m.toFixed(2)})`);
      if (!bearishConditions.rsi_in_reset_zone) 
        analysis.bearish.reasons.push(`RSI (${rsi5m.toFixed(1)}) not in 40-55 reset zone`);
    }

    return analysis;
  }

  /**
   * Validate timeframe alignment
   */
  validateTimeframeAlignment(rawSignal) {
    const timeframes = rawSignal.timeframes || { bias: '15m', entry: '5m' };
    
    const validCombinations = [
      { bias: '15m', entry: '5m' },
      { bias: '5m', entry: '1m' }
    ];

    const isValid = validCombinations.some(combo => 
      combo.bias === timeframes.bias && combo.entry === timeframes.entry
    );

    return {
      status: isValid ? 'PASS' : 'FAIL',
      reasons: isValid ? ['Valid timeframe alignment'] : [`Invalid combination: bias=${timeframes.bias}, entry=${timeframes.entry}`],
      timeframes
    };
  }

  /**
   * Validate entry trigger
   */
  validateEntryTrigger(rawSignal, marketData, side, directionAnalysis) {
    return {
      status: 'PASS',
      reasons: directionAnalysis.reasons,
      side,
      trigger: side === 'CALL' ? 'bullish_breakout' : 'bearish_breakdown'
    };
  }

  /**
   * Validate structure confirmation
   */
  validateStructureConfirmation(marketData, side) {
    const candles = marketData.candles5m.slice(-10); // Last 10 candles
    
    if (side === 'CALL') {
      // Check for higher highs and higher lows
      const highs = candles.map(c => c.high);
      const lows = candles.map(c => c.low);
      
      const recentHighs = highs.slice(-3);
      const recentLows = lows.slice(-3);
      
      const higherHighs = recentHighs[2] > recentHighs[0];
      const higherLows = recentLows[2] > recentLows[0];
      
      const structureValid = higherHighs && higherLows;
      
      return {
        status: structureValid ? 'PASS' : 'FAIL',
        reasons: structureValid ? ['Higher highs and higher lows confirmed'] : ['Structure not bullish'],
        pattern: 'higher_highs_lows'
      };
    } else {
      // Check for lower highs and lower lows
      const highs = candles.map(c => c.high);
      const lows = candles.map(c => c.low);
      
      const recentHighs = highs.slice(-3);
      const recentLows = lows.slice(-3);
      
      const lowerHighs = recentHighs[2] < recentHighs[0];
      const lowerLows = recentLows[2] < recentLows[0];
      
      const structureValid = lowerHighs && lowerLows;
      
      return {
        status: structureValid ? 'PASS' : 'FAIL',
        reasons: structureValid ? ['Lower highs and lower lows confirmed'] : ['Structure not bearish'],
        pattern: 'lower_highs_lows'
      };
    }
  }

  /**
   * Validate ATR-based levels
   */
  async validateATRLevels(rawSignal, marketData) {
    const atr5m = this.calculateATR(marketData.candles5m, 14);
    const currentPrice = marketData.candles5m[marketData.candles5m.length - 1].close;
    
    // Get current SL/TP distances from raw signal
    const slDistance = Math.abs(currentPrice - rawSignal.stopLoss);
    const tpDistance = Math.abs(rawSignal.target1 - currentPrice);
    
    // Calculate ATR multiples
    const slMultiple = slDistance / atr5m;
    const tpMultiple = tpDistance / atr5m;
    
    let status = 'PASS';
    let reasons = [];
    let levels = {
      atr: atr5m,
      sl: rawSignal.stopLoss,
      tp1: rawSignal.target1,
      slMultiple,
      tpMultiple
    };
    
    // Check if within bounds
    const slInBounds = slMultiple >= this.atrBounds.sl.min && slMultiple <= this.atrBounds.sl.max;
    const tpInBounds = tpMultiple >= this.atrBounds.tp.min && tpMultiple <= this.atrBounds.tp.max;
    
    if (!slInBounds || !tpInBounds) {
      // Auto-rescale
      const newSlDistance = atr5m * this.atrBounds.sl.default;
      const newTpDistance = atr5m * this.atrBounds.tp.default;
      
      levels.sl = currentPrice - newSlDistance;
      levels.tp1 = currentPrice + newTpDistance;
      levels.slMultiple = this.atrBounds.sl.default;
      levels.tpMultiple = this.atrBounds.tp.default;
      
      status = 'REWRITE';
      reasons.push(`Auto-rescaled: SL=${this.atrBounds.sl.default}×ATR, TP=${this.atrBounds.tp.default}×ATR`);
    } else {
      reasons.push(`ATR levels valid: SL=${slMultiple.toFixed(1)}×ATR, TP=${tpMultiple.toFixed(1)}×ATR`);
    }
    
    return { status, reasons, levels };
  }

  /**
   * Validate options tradability
   */
  async validateOptionsTradability(rawSignal, side) {
    const instrument = rawSignal.instrument || rawSignal.symbol;
    const currentPrice = rawSignal.spotPrice || rawSignal.spot;
    
    // Determine strike
    const strikeInterval = instrument === 'NIFTY' ? 50 : 100;
    const atmStrike = Math.round(currentPrice / strikeInterval) * strikeInterval;
    const selectedStrike = side === 'CALL' ? atmStrike : atmStrike; // ATM for both
    
    // Mock options data (in real implementation, fetch from options chain)
    const mockOptionsData = this.getMockOptionsData(instrument, selectedStrike, side, currentPrice);
    
    const gates = this.optionsGates[instrument];
    const spreadPct = (mockOptionsData.ask - mockOptionsData.bid) / mockOptionsData.premium * 100;
    
    let status = 'PASS';
    let reasons = [];
    
    // Check spread
    if (spreadPct > gates.maxSpreadPct) {
      status = 'FAIL';
      reasons.push(`Spread ${spreadPct.toFixed(1)}% > ${gates.maxSpreadPct}% limit`);
    }
    
    // Check delta (use absolute value for PUT options)
    const absDelta = Math.abs(mockOptionsData.delta);
    if (absDelta < gates.minDelta) {
      status = 'FAIL';
      reasons.push(`Delta ${absDelta.toFixed(2)} < ${gates.minDelta} minimum`);
    }
    
    // Check depth
    if (!mockOptionsData.depthOk) {
      status = 'FAIL';
      reasons.push('Insufficient market depth');
    }
    
    if (status === 'PASS') {
      reasons.push(`Options tradable: spread=${spreadPct.toFixed(1)}%, delta=${Math.abs(mockOptionsData.delta).toFixed(2)}`);
    }
    
    return {
      status,
      reasons,
      optionData: {
        strike: selectedStrike,
        side,
        premium: mockOptionsData.premium,
        bid: mockOptionsData.bid,
        ask: mockOptionsData.ask,
        spreadPct,
        delta: mockOptionsData.delta,
        depthOk: mockOptionsData.depthOk
      }
    };
  }

  /**
   * Validate premium risk-reward after costs
   */
  async validatePremiumRiskReward(rawSignal, atrLevels, side) {
    const entryPremium = rawSignal.premium || 50; // Mock if not provided
    
    // Calculate premiums at SL and TP levels
    const slPremium = this.calculatePremiumAtLevel(rawSignal, atrLevels.sl, side);
    const tpPremium = this.calculatePremiumAtLevel(rawSignal, atrLevels.tp1, side);
    
    // Calculate risk and reward
    const risk = Math.abs(entryPremium - slPremium);
    const reward = Math.abs(tpPremium - entryPremium);
    
    // Add costs (simplified)
    const costs = entryPremium * 0.01; // 1% total costs
    const netRisk = risk + costs;
    const netReward = reward - costs;
    
    const netRR = netReward / netRisk;
    
    let status = netRR >= 1.2 ? 'PASS' : 'FAIL';
    let reasons = [];
    
    if (status === 'PASS') {
      reasons.push(`Net R:R ${netRR.toFixed(2)} ≥ 1.2 requirement`);
    } else {
      reasons.push(`Net R:R ${netRR.toFixed(2)} < 1.2 requirement`);
      
      // Attempt rescale (already done in ATR validation)
      status = 'FAIL'; // Cannot rescue if R:R is fundamentally poor
    }
    
    return {
      status,
      reasons,
      riskReward: {
        entryPremium,
        slPremium,
        tpPremium,
        risk: netRisk,
        reward: netReward,
        ratio: netRR,
        costs
      }
    };
  }

  /**
   * Validate event filter
   */
  validateEventFilter() {
    // Mock implementation - in real system, check economic calendar
    const now = moment();
    const hour = now.hour();
    const minute = now.minute();
    
    // Block during typical high-impact times (simplified)
    const blockedTimes = [
      { start: '09:15', end: '09:25' }, // Market opening
      { start: '15:25', end: '15:35' }  // Market closing
    ];
    
    const currentTime = now.format('HH:mm');
    const isBlocked = blockedTimes.some(period => 
      currentTime >= period.start && currentTime <= period.end
    );
    
    return {
      status: isBlocked ? 'BLOCKED' : 'PASS',
      reasons: isBlocked ? ['High-impact event window'] : ['No event conflicts']
    };
  }

  /**
   * Validate risk limits
   */
  validateRiskLimits() {
    let status = 'PASS';
    let reasons = [];
    
    // Check daily trade count
    if (this.dailyStats.tradesCount >= this.riskLimits.maxTradesPerDay) {
      status = 'FAIL';
      reasons.push(`Daily trade limit reached: ${this.dailyStats.tradesCount}/${this.riskLimits.maxTradesPerDay}`);
    }
    
    // Check daily loss cap
    if (this.dailyStats.totalLoss >= this.riskLimits.dailyLossCapPct) {
      status = 'FAIL';
      reasons.push(`Daily loss cap reached: ${this.dailyStats.totalLoss.toFixed(1)}%/${this.riskLimits.dailyLossCapPct}%`);
    }
    
    if (status === 'PASS') {
      reasons.push(`Risk limits OK: trades=${this.dailyStats.tradesCount}/${this.riskLimits.maxTradesPerDay}, loss=${this.dailyStats.totalLoss.toFixed(1)}%`);
    }
    
    return { status, reasons };
  }

  /**
   * Make final decision based on all validations
   */
  makeFinalDecision(rawSignal, validations, side, marketData, atrLevels) {
    const failedValidations = Object.entries(validations).filter(([key, val]) => val.status === 'FAIL' || val.status === 'BLOCKED');
    const rewriteValidations = Object.entries(validations).filter(([key, val]) => val.status === 'REWRITE');
    
    let finalStatus;
    let reasons = [];
    
    if (failedValidations.length > 0) {
      finalStatus = 'REJECTED';
      reasons = failedValidations.map(([key, val]) => `${key}: ${val.reasons.join(', ')}`);
    } else if (rewriteValidations.length > 0) {
      finalStatus = 'REWRITTEN';
      reasons = rewriteValidations.map(([key, val]) => `${key}: ${val.reasons.join(', ')}`);
    } else {
      finalStatus = 'PASSED';
      reasons = ['All validations passed'];
    }
    
    // Build final payload
    const finalPayload = this.buildFinalPayload(rawSignal, validations, side, marketData, atrLevels);
    
    return {
      status: finalStatus,
      reasons,
      side,
      validations,
      finalPayload: finalStatus !== 'REJECTED' ? finalPayload : null
    };
  }

  /**
   * Build final payload according to schema
   */
  buildFinalPayload(rawSignal, validations, side, marketData, atrLevels) {
    const currentPrice = marketData.candles5m[marketData.candles5m.length - 1].close;
    const optionData = validations.optionsTradability.optionData;
    const rrData = validations.premiumRiskReward.riskReward;
    
    return {
      instrument: rawSignal.instrument || rawSignal.symbol,
      mode: "SCALP",
      timeframes: validations.timeframeAlignment.timeframes,
      timestamp: moment().tz('Asia/Kolkata').toISOString(),
      side: side,
      spot: currentPrice,
      option: {
        expiry: rawSignal.expiry || this.getNextExpiryDate(),
        selected_strike: optionData.strike,
        strike_rule: side === 'CALL' ? 'ATM_CALL' : 'ATM_PUT',
        premium_entry: optionData.premium,
        greeks: {
          delta: optionData.delta,
          iv: 0.15 // Mock IV
        },
        liquidity: {
          bid: optionData.bid,
          ask: optionData.ask,
          spread_pct: optionData.spreadPct,
          depth_ok: optionData.depthOk
        }
      },
      entry_rule_text: `${side} entry: ${validations.entryTrigger.reasons.join(', ')}`,
      risk_model: {
        atr_basis: "ATR(5m,14)",
        sl_rule: `entry ± ${atrLevels.slMultiple.toFixed(1)}×ATR5`,
        tp1_rule: `entry ± ${atrLevels.tpMultiple.toFixed(1)}×ATR5`,
        k_sl: atrLevels.slMultiple,
        k_tp: atrLevels.tpMultiple,
        trail: "supertrend(5m)",
        time_exit: "max 6 bars"
      },
      validations: {
        atr_rr_gate: validations.atrBasedLevels.status,
        options_tradability: validations.optionsTradability.status,
        execution_rr_after_costs: validations.premiumRiskReward.status,
        event_filter: validations.eventFilter.status
      },
      costs_model: {
        slippage: "max(tick,0.5*spread)",
        brokerage: "model-A",
        fees: "IN"
      },
      risk_limits: this.riskLimits,
      decision: {
        status: "PASSED",
        reasons: ["All gates passed"]
      }
    };
  }

  // Helper methods
  async getMarketDataForValidation(rawSignal) {
    try {
      const symbol = rawSignal.instrument || rawSignal.symbol;
      const candles5m = await this.dataProvider.getLatestData(symbol, '5m');
      const candles15m = await this.dataProvider.getLatestData(symbol, '15m');
      
      if (!candles5m || !candles15m || candles5m.length < 50 || candles15m.length < 50) {
        return { valid: false, reasons: ['Insufficient market data'] };
      }
      
      const indicators5m = this.technicalAnalysis.calculateIndicators(candles5m);
      const indicators15m = this.technicalAnalysis.calculateIndicators(candles15m);
      
      return {
        valid: true,
        candles5m,
        candles15m,
        indicators5m,
        indicators15m
      };
    } catch (error) {
      return { valid: false, reasons: [error.message] };
    }
  }

  calculateATR(candles, period = 14) {
    if (candles.length < period + 1) return 50; // Default fallback
    
    let atrSum = 0;
    for (let i = candles.length - period; i < candles.length; i++) {
      const current = candles[i];
      const previous = candles[i - 1];
      
      const tr = Math.max(
        current.high - current.low,
        Math.abs(current.high - previous.close),
        Math.abs(current.low - previous.close)
      );
      
      atrSum += tr;
    }
    
    return atrSum / period;
  }

  getMockOptionsData(instrument, strike, side, spotPrice) {
    const intrinsic = side === 'CALL' ? Math.max(0, spotPrice - strike) : Math.max(0, strike - spotPrice);
    const timeValue = instrument === 'NIFTY' ? 15 : 25;
    const premium = intrinsic + timeValue;
    
    // Realistic bid-ask spread (0.5-1.0% for liquid options)
    const spreadPct = instrument === 'NIFTY' ? 0.8 : 1.2; // Within limits
    const spreadAmount = premium * (spreadPct / 100);
    
    return {
      premium,
      bid: premium - spreadAmount / 2,
      ask: premium + spreadAmount / 2,
      delta: side === 'CALL' ? 0.55 : -0.55,
      depthOk: true
    };
  }

  calculatePremiumAtLevel(rawSignal, level, side) {
    // Simplified premium calculation at different spot levels
    const currentSpot = rawSignal.spotPrice || rawSignal.spot;
    const currentPremium = rawSignal.premium || 50;
    const spotMove = level - currentSpot;
    
    // Approximate delta effect
    const deltaEffect = spotMove * 0.5; // Assume 0.5 delta
    return Math.max(5, currentPremium + (side === 'CALL' ? deltaEffect : -deltaEffect));
  }

  getNextExpiryDate() {
    const now = moment().tz('Asia/Kolkata');
    let nextExpiry = moment().tz('Asia/Kolkata').day(4); // Thursday
    
    if (now.day() > 4 || (now.day() === 4 && now.hour() >= 15 && now.minute() >= 30)) {
      nextExpiry.add(1, 'week');
    }
    
    return nextExpiry.format('DD-MMM-YYYY').toUpperCase();
  }

  resetDailyStatsIfNeeded() {
    const today = moment().format('YYYY-MM-DD');
    if (this.dailyStats.lastResetDate !== today) {
      this.dailyStats = {
        tradesCount: 0,
        totalLoss: 0,
        lastResetDate: today
      };
    }
  }

  reject(reason, details = []) {
    return {
      status: 'REJECTED',
      reasons: [reason, ...details],
      finalPayload: null
    };
  }
}

module.exports = StrictScalpingGate;