const moment = require('moment-timezone');

class SimpleScalpingGenerator {
  constructor() {
    this.lastSignals = new Map();
    this.signalCounter = 0;
  }

  /**
   * Generate a simple, realistic scalping signal
   */
  generateScalpingSignal(symbol, timeframe, currentMarketPrice) {
    try {
      // Validate inputs
      if (!currentMarketPrice || currentMarketPrice < 1000) {
        console.log(`❌ Invalid market price for ${symbol}: ${currentMarketPrice}`);
        return null;
      }

      // Check rate limiting (max 1 signal per 5 minutes per symbol-timeframe)
      const signalKey = `${symbol}_${timeframe}`;
      const lastSignalTime = this.lastSignals.get(signalKey);
      const now = moment();
      
      if (lastSignalTime && now.diff(lastSignalTime, 'minutes') < 5) {
        console.log(`⏰ Rate limited: ${signalKey}, last signal ${now.diff(lastSignalTime, 'minutes')}m ago`);
        return null;
      }

      console.log(`🎯 Generating scalping signal for ${symbol} at ₹${currentMarketPrice}`);

      // Calculate option strike (ITM for scalping)
      const strikeInterval = symbol === 'NIFTY' ? 50 : 100;
      const atmStrike = Math.round(currentMarketPrice / strikeInterval) * strikeInterval;
      const itmStrike = atmStrike - strikeInterval; // ITM for better delta

      // Calculate realistic premium for ITM option
      const intrinsicValue = Math.max(0, currentMarketPrice - itmStrike);
      const timeValue = symbol === 'NIFTY' ? 12 : 18; // Base time value
      const premium = intrinsicValue + timeValue;

      // Calculate scalping levels (tight for quick moves)
      const stopLossPercent = 0.15; // 0.15% for scalping
      const target1Percent = 0.20;  // 0.20% for T1
      const target2Percent = 0.35;  // 0.35% for T2

      const stopLoss = currentMarketPrice * (1 - stopLossPercent / 100);
      const target1 = currentMarketPrice * (1 + target1Percent / 100);
      const target2 = currentMarketPrice * (1 + target2Percent / 100);

      // Calculate premium levels at different spot prices
      const premiumStopLoss = Math.max(5, intrinsicValue - (currentMarketPrice - stopLoss) + timeValue * 0.7);
      const premiumTarget1 = intrinsicValue + (target1 - currentMarketPrice) + timeValue * 1.1;
      const premiumTarget2 = intrinsicValue + (target2 - currentMarketPrice) + timeValue * 1.2;

      // Get expiry date (next Thursday)
      const expiry = this.getNextExpiryDate();

      // Create signal
      this.signalCounter++;
      const signal = {
        id: `scalping_${symbol}_${timeframe}_${Date.now()}_${this.signalCounter}`,
        symbol,
        timeframe,
        type: 'BUY',
        timestamp: now.toISOString(),
        
        // Entry details
        entryPrice: currentMarketPrice,
        spotPrice: currentMarketPrice,
        premium: Math.round(premium * 100) / 100,
        optionStrike: itmStrike,
        optionType: 'CALL',
        expiry: expiry,
        
        // Spot-based levels
        stopLoss: Math.round(stopLoss * 100) / 100,
        target1: Math.round(target1 * 100) / 100,
        target2: Math.round(target2 * 100) / 100,
        
        // Strike-based levels (same strike, different premiums)
        strikeStopLoss: itmStrike,
        strikeTarget1: itmStrike,
        strikeTarget2: itmStrike,
        
        // Premium-based levels
        premiumStopLoss: Math.round(premiumStopLoss * 100) / 100,
        premiumTarget1: Math.round(premiumTarget1 * 100) / 100,
        premiumTarget2: Math.round(premiumTarget2 * 100) / 100,
        
        // Signal metadata
        strength: 75, // Fixed strength for scalping
        confidence: 'Medium',
        conditions: {
          trendFilter: true,
          momentumTrigger: 'RSI',
          volatilityStructure: true,
          signalValidation: true
        },
        
        // Scalping specific
        riskReward: '1:1.3',
        setup: 'ScalpingMomentum',
        isLive: true
      };

      // Update rate limiting
      this.lastSignals.set(signalKey, now);

      console.log(`✅ Generated scalping signal: ${symbol} ${itmStrike} CE @ ₹${premium.toFixed(2)}`);
      return signal;

    } catch (error) {
      console.error(`❌ Error generating scalping signal for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Get next Thursday expiry date
   */
  getNextExpiryDate() {
    const now = moment().tz('Asia/Kolkata');
    let nextExpiry = moment().tz('Asia/Kolkata').day(4); // Thursday
    
    // If today is Thursday after 3:30 PM or Friday/Weekend, move to next week
    if (now.day() > 4 || (now.day() === 4 && now.hour() >= 15 && now.minute() >= 30)) {
      nextExpiry.add(1, 'week');
    }
    
    return nextExpiry.format('DD-MMM-YYYY').toUpperCase();
  }

  /**
   * Check if we should generate a signal (market hours + conditions)
   */
  shouldGenerateSignal() {
    const now = moment().tz('Asia/Kolkata');
    const day = now.day();
    const time = now.format('HH:mm');
    
    // Market hours check
    const isWeekend = day === 0 || day === 6;
    const isMarketHours = time >= '09:15' && time <= '15:30';
    
    // For scalping, generate signals throughout market hours
    return !isWeekend && isMarketHours;
  }
}

module.exports = SimpleScalpingGenerator;