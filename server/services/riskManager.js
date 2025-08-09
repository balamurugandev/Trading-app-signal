const moment = require('moment-timezone');

class RiskManager {
  constructor() {
    this.maxSignalsPerHour = 10;
    this.maxSignalsPerDay = 50;
    this.signalHistory = new Map();
    this.dailyStats = new Map();
  }

  /**
   * Check if signal generation is allowed based on risk limits
   */
  canGenerateSignal(symbol, timeframe) {
    const now = moment().tz('Asia/Kolkata');
    const hourKey = `${symbol}_${timeframe}_${now.format('YYYY-MM-DD_HH')}`;
    const dayKey = `${symbol}_${timeframe}_${now.format('YYYY-MM-DD')}`;

    // Check hourly limit
    const hourlyCount = this.signalHistory.get(hourKey) || 0;
    if (hourlyCount >= this.maxSignalsPerHour) {
      console.log(`Hourly signal limit reached for ${symbol} ${timeframe}`);
      return false;
    }

    // Check daily limit
    const dailyCount = this.signalHistory.get(dayKey) || 0;
    if (dailyCount >= this.maxSignalsPerDay) {
      console.log(`Daily signal limit reached for ${symbol} ${timeframe}`);
      return false;
    }

    return true;
  }

  /**
   * Record a generated signal
   */
  recordSignal(symbol, timeframe, signal) {
    const now = moment().tz('Asia/Kolkata');
    const hourKey = `${symbol}_${timeframe}_${now.format('YYYY-MM-DD_HH')}`;
    const dayKey = `${symbol}_${timeframe}_${now.format('YYYY-MM-DD')}`;

    // Update counters
    this.signalHistory.set(hourKey, (this.signalHistory.get(hourKey) || 0) + 1);
    this.signalHistory.set(dayKey, (this.signalHistory.get(dayKey) || 0) + 1);

    // Store signal details for analysis
    if (!this.dailyStats.has(dayKey)) {
      this.dailyStats.set(dayKey, {
        signals: [],
        totalSignals: 0,
        avgStrength: 0
      });
    }

    const dayStats = this.dailyStats.get(dayKey);
    dayStats.signals.push({
      timestamp: signal.timestamp,
      strength: signal.strength,
      symbol,
      timeframe
    });
    dayStats.totalSignals++;
    dayStats.avgStrength = dayStats.signals.reduce((sum, s) => sum + s.strength, 0) / dayStats.totalSignals;
  }

  /**
   * Validate signal quality before generation
   */
  validateSignalQuality(marketData, indicators, conditions) {
    const validations = [];

    // Check data quality
    if (!marketData || marketData.length < 50) {
      validations.push({ passed: false, reason: 'Insufficient market data' });
    }

    // Check indicator completeness
    const requiredIndicators = ['vwap', 'ema9', 'ema21', 'rsi', 'macd', 'bb'];
    for (const indicator of requiredIndicators) {
      if (!indicators[indicator] || indicators[indicator].length === 0) {
        validations.push({ passed: false, reason: `Missing ${indicator} indicator` });
      }
    }

    // Check market volatility (avoid signals in extremely low volatility)
    const currentBB = indicators.bb[indicators.bb.length - 1];
    if (currentBB) {
      const bbWidth = (currentBB.upper - currentBB.lower) / currentBB.middle;
      if (bbWidth < 0.01) { // Less than 1% width
        validations.push({ passed: false, reason: 'Market volatility too low' });
      }
    }

    // Check signal strength threshold
    if (conditions && conditions.strength < 60) {
      validations.push({ passed: false, reason: 'Signal strength below threshold' });
    }

    const failedValidations = validations.filter(v => !v.passed);
    
    return {
      passed: failedValidations.length === 0,
      failures: failedValidations,
      score: Math.max(0, 100 - (failedValidations.length * 20))
    };
  }

  /**
   * Calculate position size based on risk parameters
   */
  calculatePositionSize(accountBalance, riskPercentage, entryPrice, stopLoss) {
    const riskAmount = accountBalance * (riskPercentage / 100);
    const riskPerShare = Math.abs(entryPrice - stopLoss);
    
    if (riskPerShare === 0) return 0;
    
    const positionSize = Math.floor(riskAmount / riskPerShare);
    
    return {
      quantity: positionSize,
      riskAmount: riskAmount,
      riskPerShare: riskPerShare,
      totalValue: positionSize * entryPrice
    };
  }

  /**
   * Check if current time is within liquid trading windows
   */
  isLiquidTradingWindow() {
    const now = moment().tz('Asia/Kolkata');
    const time = now.format('HH:mm');
    const day = now.day();

    // No trading on weekends
    if (day === 0 || day === 6) return false;

    // Liquid windows: 9:25-11:00 and 13:45-15:05
    const morningSession = time >= '09:25' && time <= '11:00';
    const afternoonSession = time >= '13:45' && time <= '15:05';

    return morningSession || afternoonSession;
  }

  /**
   * Get risk metrics for dashboard
   */
  getRiskMetrics(symbol, timeframe) {
    const now = moment().tz('Asia/Kolkata');
    const dayKey = `${symbol}_${timeframe}_${now.format('YYYY-MM-DD')}`;
    const hourKey = `${symbol}_${timeframe}_${now.format('YYYY-MM-DD_HH')}`;

    const dailyStats = this.dailyStats.get(dayKey) || {
      signals: [],
      totalSignals: 0,
      avgStrength: 0
    };

    return {
      dailySignalCount: this.signalHistory.get(dayKey) || 0,
      hourlySignalCount: this.signalHistory.get(hourKey) || 0,
      maxDailySignals: this.maxSignalsPerDay,
      maxHourlySignals: this.maxSignalsPerHour,
      avgSignalStrength: dailyStats.avgStrength,
      isLiquidWindow: this.isLiquidTradingWindow(),
      canGenerateSignal: this.canGenerateSignal(symbol, timeframe)
    };
  }

  /**
   * Clean up old signal history (run daily)
   */
  cleanupHistory() {
    const cutoffDate = moment().tz('Asia/Kolkata').subtract(7, 'days');
    
    for (const [key, value] of this.signalHistory.entries()) {
      const keyDate = key.split('_').slice(-1)[0].split('_')[0];
      if (moment(keyDate).isBefore(cutoffDate)) {
        this.signalHistory.delete(key);
      }
    }

    for (const [key, value] of this.dailyStats.entries()) {
      const keyDate = key.split('_').slice(-1)[0];
      if (moment(keyDate).isBefore(cutoffDate)) {
        this.dailyStats.delete(key);
      }
    }

    console.log('Risk manager history cleaned up');
  }

  /**
   * Emergency stop - halt all signal generation
   */
  emergencyStop(reason = 'Manual stop') {
    this.emergencyStopActive = true;
    this.emergencyStopReason = reason;
    this.emergencyStopTime = moment().tz('Asia/Kolkata').toISOString();
    
    console.log(`EMERGENCY STOP ACTIVATED: ${reason}`);
  }

  /**
   * Resume signal generation after emergency stop
   */
  resumeSignals() {
    this.emergencyStopActive = false;
    this.emergencyStopReason = null;
    this.emergencyStopTime = null;
    
    console.log('Signal generation resumed');
  }

  /**
   * Check if emergency stop is active
   */
  isEmergencyStopActive() {
    return this.emergencyStopActive || false;
  }
}

module.exports = RiskManager;