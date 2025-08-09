const { 
  EMA, 
  RSI, 
  MACD, 
  BollingerBands,
  VWAP: VWAPIndicator
} = require('technicalindicators');

class TechnicalAnalysis {
  constructor() {
    this.indicators = {};
  }

  /**
   * Calculate all technical indicators for the given market data
   * @param {Array} data - Array of OHLCV data
   * @returns {Object} - Object containing all calculated indicators
   */
  calculateIndicators(data) {
    if (!data || data.length < 50) {
      throw new Error('Insufficient data for technical analysis');
    }

    const closes = data.map(d => d.close);
    const highs = data.map(d => d.high);
    const lows = data.map(d => d.low);
    const volumes = data.map(d => d.volume);

    return {
      // VWAP calculation
      vwap: this.calculateVWAP(data),
      
      // EMA calculations for trend filter
      ema9: EMA.calculate({ period: 9, values: closes }),
      ema21: EMA.calculate({ period: 21, values: closes }),
      
      // RSI for momentum trigger (default 14, but 7-9 preferred for scalping)
      rsi: RSI.calculate({ period: 14, values: closes }),
      rsi7: RSI.calculate({ period: 7, values: closes }),
      rsi9: RSI.calculate({ period: 9, values: closes }),
      
      // MACD for momentum confirmation
      macd: MACD.calculate({
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9,
        values: closes
      }),
      
      // Bollinger Bands for volatility/structure
      bb: BollingerBands.calculate({
        period: 20,
        stdDev: 2,
        values: closes
      }),
      
      // CPR (Central Pivot Range) levels
      cpr: this.calculateCPR(data),
      
      // Parabolic SAR for trailing stops
      psar: this.calculateParabolicSAR(data),
      
      // Support and Resistance levels
      pivots: this.calculatePivotLevels(data)
    };
  }

  /**
   * Calculate VWAP (Volume Weighted Average Price)
   * Essential for trend filter - only long signals above VWAP
   */
  calculateVWAP(data) {
    const vwap = [];
    let cumulativeTPV = 0; // Typical Price * Volume
    let cumulativeVolume = 0;

    for (let i = 0; i < data.length; i++) {
      const typicalPrice = (data[i].high + data[i].low + data[i].close) / 3;
      const tpv = typicalPrice * data[i].volume;
      
      cumulativeTPV += tpv;
      cumulativeVolume += data[i].volume;
      
      vwap.push(cumulativeVolume > 0 ? cumulativeTPV / cumulativeVolume : data[i].close);
    }

    return vwap;
  }

  /**
   * Calculate CPR (Central Pivot Range) levels
   * Used for structure-based entries and stops
   */
  calculateCPR(data) {
    if (data.length < 2) return null;

    const yesterday = data[data.length - 2];
    const pivot = (yesterday.high + yesterday.low + yesterday.close) / 3;
    
    return {
      pivot: pivot,
      bc: (yesterday.high + yesterday.low) / 2, // Bottom Central
      tc: (pivot - yesterday.low) + pivot, // Top Central
      r1: 2 * pivot - yesterday.low,
      r2: pivot + (yesterday.high - yesterday.low),
      r3: yesterday.high + 2 * (pivot - yesterday.low),
      s1: 2 * pivot - yesterday.high,
      s2: pivot - (yesterday.high - yesterday.low),
      s3: yesterday.low - 2 * (yesterday.high - pivot)
    };
  }

  /**
   * Calculate Parabolic SAR for trailing stops
   */
  calculateParabolicSAR(data, step = 0.02, max = 0.2) {
    if (data.length < 2) return [];

    const psar = [];
    let trend = 1; // 1 for uptrend, -1 for downtrend
    let af = step; // Acceleration factor
    let ep = data[0].high; // Extreme point
    let sar = data[0].low;

    psar.push(sar);

    for (let i = 1; i < data.length; i++) {
      const current = data[i];
      const prev = data[i - 1];

      if (trend === 1) {
        // Uptrend
        sar = psar[i - 1] + af * (ep - psar[i - 1]);
        
        if (current.low <= sar) {
          // Trend reversal
          trend = -1;
          sar = ep;
          ep = current.low;
          af = step;
        } else {
          if (current.high > ep) {
            ep = current.high;
            af = Math.min(af + step, max);
          }
        }
      } else {
        // Downtrend
        sar = psar[i - 1] + af * (ep - psar[i - 1]);
        
        if (current.high >= sar) {
          // Trend reversal
          trend = 1;
          sar = ep;
          ep = current.high;
          af = step;
        } else {
          if (current.low < ep) {
            ep = current.low;
            af = Math.min(af + step, max);
          }
        }
      }

      psar.push(sar);
    }

    return psar;
  }

  /**
   * Calculate pivot levels for support/resistance
   */
  calculatePivotLevels(data) {
    if (data.length < 20) return [];

    const pivots = [];
    const lookback = 5;

    for (let i = lookback; i < data.length - lookback; i++) {
      const current = data[i];
      let isHighPivot = true;
      let isLowPivot = true;

      // Check if current point is a pivot high
      for (let j = i - lookback; j <= i + lookback; j++) {
        if (j !== i && data[j].high >= current.high) {
          isHighPivot = false;
          break;
        }
      }

      // Check if current point is a pivot low
      for (let j = i - lookback; j <= i + lookback; j++) {
        if (j !== i && data[j].low <= current.low) {
          isLowPivot = false;
          break;
        }
      }

      if (isHighPivot) {
        pivots.push({
          index: i,
          type: 'high',
          price: current.high,
          timestamp: current.timestamp
        });
      }

      if (isLowPivot) {
        pivots.push({
          index: i,
          type: 'low',
          price: current.low,
          timestamp: current.timestamp
        });
      }
    }

    return pivots;
  }

  /**
   * Check if Bollinger Bands are expanding (volatility increase)
   * Used for breakout confirmation
   */
  isBBExpanding(bb, lookback = 3) {
    if (bb.length < lookback + 1) return false;

    const current = bb[bb.length - 1];
    const previous = bb[bb.length - 2];

    const currentWidth = current.upper - current.lower;
    const previousWidth = previous.upper - previous.lower;

    return currentWidth > previousWidth;
  }

  /**
   * Check EMA alignment for trend filter
   * Returns true if EMAs are aligned bullishly (9 EMA > 21 EMA)
   */
  isEMAAlignedBullish(ema9, ema21) {
    if (!ema9.length || !ema21.length) return false;
    
    const current9 = ema9[ema9.length - 1];
    const current21 = ema21[ema21.length - 1];
    
    return current9 > current21;
  }

  /**
   * Check if price is above VWAP (trend filter)
   */
  isPriceAboveVWAP(price, vwap) {
    if (!vwap.length) return false;
    return price > vwap[vwap.length - 1];
  }

  /**
   * Check RSI momentum conditions
   * Signal when RSI turns up through 40-60 zone (ideally 50-55)
   */
  checkRSIMomentum(rsi, preferredPeriod = 14) {
    if (rsi.length < 3) return false;

    const current = rsi[rsi.length - 1];
    const previous = rsi[rsi.length - 2];
    const beforePrevious = rsi[rsi.length - 3];

    // RSI turning up
    const isTurningUp = current > previous && previous <= beforePrevious;
    
    // In the 40-60 zone, ideally 50-55
    const inOptimalZone = current >= 40 && current <= 60;
    const inIdealZone = current >= 50 && current <= 55;

    return {
      isTurningUp,
      inOptimalZone,
      inIdealZone,
      value: current
    };
  }

  /**
   * Check MACD momentum conditions
   * Signal when MACD line crosses above signal line with histogram expansion
   */
  checkMACDMomentum(macd) {
    if (macd.length < 2) return false;

    const current = macd[macd.length - 1];
    const previous = macd[macd.length - 2];

    const bullishCrossover = current.MACD > current.signal && 
                           previous.MACD <= previous.signal;
    
    const histogramExpanding = current.histogram > previous.histogram;

    return {
      bullishCrossover,
      histogramExpanding,
      macdValue: current.MACD,
      signalValue: current.signal,
      histogram: current.histogram
    };
  }
}

module.exports = TechnicalAnalysis;