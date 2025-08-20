const StrictScalpingGate = require('./server/services/scalping/strictScalpingGate');

// Mock dependencies
const mockDataProvider = {
  async getLatestData(symbol, timeframe) {
    // Mock OHLC data
    const basePrice = symbol === 'NIFTY' ? 24935 : 55800;
    const candles = [];
    
    for (let i = 0; i < 100; i++) {
      const price = basePrice + (Math.random() - 0.5) * 100;
      candles.push({
        timestamp: new Date(Date.now() - (100 - i) * 60000),
        open: price,
        high: price + Math.random() * 20,
        low: price - Math.random() * 20,
        close: price + (Math.random() - 0.5) * 10,
        volume: 1000
      });
    }
    
    // Ensure last candle has the expected price
    candles[candles.length - 1].close = basePrice;
    
    return candles;
  }
};

const mockTechnicalAnalysis = {
  calculateIndicators(candles) {
    const length = candles.length;
    const lastClose = candles[candles.length - 1].close;
    
    return {
      ema20: new Array(length).fill(0).map((_, i) => {
        // For bullish: EMA20 below close, for bearish: EMA20 above close
        return i < length - 1 ? candles[i].close * 0.998 : lastClose * 1.002; // EMA20 above current close
      }),
      ema50: new Array(length).fill(0).map((_, i) => {
        // For bearish: EMA50 above EMA20
        return i < length - 1 ? candles[i].close * 0.995 : lastClose * 1.005; // EMA50 above EMA20
      }),
      rsi: new Array(length).fill(0).map((_, i) => {
        // For bearish PUT: RSI in 40-55 range
        return i < length - 1 ? 52 : 47; // In bearish reset zone
      })
    };
  }
};

async function testStrictScalpingGate() {
  console.log('🔧 STRICT SCALPING GATE TEST');
  console.log('=============================');
  
  const gate = new StrictScalpingGate(mockDataProvider, mockTechnicalAnalysis);
  
  // Test signal from your example
  const testSignal = {
    instrument: 'NIFTY',
    mode: 'SCALP',
    timeframes: { bias: '15m', entry: '5m' },
    spot: 24935.95,
    spotPrice: 24935.95,
    premium: 47.95,
    expiry: '21-AUG-2025',
    stopLoss: 24898.55,
    target1: 24985.82,
    target2: 25023.23,
    optionStrike: 24900,
    optionType: 'CALL'
  };
  
  console.log('\n📊 Input Signal:');
  console.log(`Instrument: ${testSignal.instrument}`);
  console.log(`Spot: ₹${testSignal.spot}`);
  console.log(`Option: ${testSignal.optionStrike} CE @ ₹${testSignal.premium}`);
  console.log(`Stop Loss: ₹${testSignal.stopLoss}`);
  console.log(`Target 1: ₹${testSignal.target1}`);
  
  console.log('\n🔍 VALIDATION PROCESS:');
  console.log('======================');
  
  try {
    const results = await gate.validateScalpingSignal(testSignal);
    
    if (Array.isArray(results)) {
      console.log(`\n✅ Generated ${results.length} signal(s):`);
      
      results.forEach((result, index) => {
        console.log(`\n--- Signal ${index + 1} (${result.side}) ---`);
        console.log(`Status: ${result.status}`);
        console.log(`Reasons: ${result.reasons.join(', ')}`);
        
        if (result.finalPayload) {
          const payload = result.finalPayload;
          console.log(`\n📋 Final Payload:`);
          console.log(`  Instrument: ${payload.instrument}`);
          console.log(`  Side: ${payload.side}`);
          console.log(`  Spot: ₹${payload.spot.toFixed(2)}`);
          console.log(`  Strike: ${payload.option.selected_strike} ${payload.side}`);
          console.log(`  Premium: ₹${payload.option.premium_entry.toFixed(2)}`);
          console.log(`  Delta: ${payload.option.greeks.delta.toFixed(2)}`);
          console.log(`  Spread: ${payload.option.liquidity.spread_pct.toFixed(1)}%`);
          console.log(`  ATR SL: ${payload.risk_model.k_sl.toFixed(1)}×ATR`);
          console.log(`  ATR TP: ${payload.risk_model.k_tp.toFixed(1)}×ATR`);
          
          console.log(`\n🔍 Validation Results:`);
          Object.entries(payload.validations).forEach(([key, status]) => {
            const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
            console.log(`  ${icon} ${key}: ${status}`);
          });
        }
        
        console.log(`\n📊 Individual Validations:`);
        Object.entries(result.validations).forEach(([key, validation]) => {
          const icon = validation.status === 'PASS' ? '✅' : 
                      validation.status === 'FAIL' ? '❌' : 
                      validation.status === 'REWRITE' ? '🔄' : '⚠️';
          console.log(`  ${icon} ${key}: ${validation.status}`);
          validation.reasons.forEach(reason => {
            console.log(`    - ${reason}`);
          });
        });
      });
    } else {
      console.log(`\n❌ Validation Result:`);
      console.log(`Status: ${results.status}`);
      console.log(`Reasons: ${results.reasons.join(', ')}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  console.log('\n✅ Strict scalping gate test completed');
}

// Test with different market conditions
async function testSymmetricSignals() {
  console.log('\n🔄 TESTING SYMMETRIC CALL/PUT GENERATION');
  console.log('=========================================');
  
  const gate = new StrictScalpingGate(mockDataProvider, mockTechnicalAnalysis);
  
  // Test bearish conditions for PUT signal
  const bearishSignal = {
    instrument: 'NIFTY',
    mode: 'SCALP',
    timeframes: { bias: '15m', entry: '5m' },
    spot: 24935.95,
    spotPrice: 24935.95,
    premium: 47.95,
    expiry: '21-AUG-2025',
    stopLoss: 24973.35, // Above spot for PUT
    target1: 24886.08,  // Below spot for PUT
    optionStrike: 24950,
    optionType: 'PUT'
  };
  
  console.log('\n📊 Testing Bearish Signal for PUT Generation:');
  
  try {
    const results = await gate.validateScalpingSignal(bearishSignal);
    
    if (Array.isArray(results)) {
      console.log(`Generated ${results.length} signal(s) from bearish conditions`);
      results.forEach(result => {
        console.log(`- ${result.side} signal: ${result.status}`);
      });
    } else {
      console.log(`Single result: ${results.status} - ${results.reasons.join(', ')}`);
    }
    
  } catch (error) {
    console.error('❌ Symmetric test failed:', error);
  }
}

// Run tests
testStrictScalpingGate().then(() => {
  return testSymmetricSignals();
}).then(() => {
  console.log('\n🎯 All tests completed');
});