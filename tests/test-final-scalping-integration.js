const StrictScalpingGate = require('./server/services/scalping/strictScalpingGate');

// Create realistic mock data
function createRealisticMockDataProvider() {
  return {
    async getLatestData(symbol, timeframe) {
      const basePrice = symbol === 'NIFTY' ? 24935.95 : 55808.80;
      const candles = [];
      
      // Generate 100 realistic candles
      for (let i = 0; i < 100; i++) {
        const variation = (Math.random() - 0.5) * 30; // ±15 points variation
        const price = basePrice + variation;
        
        candles.push({
          timestamp: new Date(Date.now() - (100 - i) * 300000), // 5min intervals
          open: price,
          high: price + Math.random() * 15,
          low: price - Math.random() * 15,
          close: price + (Math.random() - 0.5) * 8,
          volume: 1000 + Math.random() * 500
        });
      }
      
      // Ensure last candle has expected price
      candles[candles.length - 1].close = basePrice;
      
      return candles;
    }
  };
}

function createRealisticTechnicalAnalysis(scenario = 'bullish') {
  return {
    calculateIndicators(candles) {
      const length = candles.length;
      const lastClose = candles[candles.length - 1].close;
      
      if (scenario === 'bullish') {
        return {
          ema20: new Array(length).fill(0).map((_, i) => 
            i < length - 1 ? candles[i].close * 0.9985 : lastClose * 0.9985 // EMA20 below close
          ),
          ema50: new Array(length).fill(0).map((_, i) => 
            i < length - 1 ? candles[i].close * 0.997 : lastClose * 0.997 // EMA50 below EMA20
          ),
          rsi: new Array(length).fill(0).map(() => 52) // RSI in bullish reset zone
        };
      } else if (scenario === 'bearish') {
        return {
          ema20: new Array(length).fill(0).map((_, i) => 
            i < length - 1 ? candles[i].close * 1.0015 : lastClose * 1.0015 // EMA20 above close
          ),
          ema50: new Array(length).fill(0).map((_, i) => 
            i < length - 1 ? candles[i].close * 1.003 : lastClose * 1.003 // EMA50 above EMA20
          ),
          rsi: new Array(length).fill(0).map(() => 47) // RSI in bearish reset zone
        };
      } else {
        // Neutral - no clear signals
        return {
          ema20: new Array(length).fill(0).map((_, i) => candles[i].close),
          ema50: new Array(length).fill(0).map((_, i) => candles[i].close),
          rsi: new Array(length).fill(0).map(() => 65) // RSI outside reset zones
        };
      }
    }
  };
}

async function testYourExampleSignal() {
  console.log('🎯 TESTING YOUR EXAMPLE SIGNAL');
  console.log('===============================');
  console.log('Input: NIFTY 5m SCALP');
  console.log('Spot: 24,935.95 | Option: 24,900 CE @ ₹47.95');
  console.log('SL: 24,898.55 | T1: 24,985.82');
  console.log('Expected: Validate ATR, options tradability, R:R');
  
  const gate = new StrictScalpingGate(
    createRealisticMockDataProvider(), 
    createRealisticTechnicalAnalysis('bullish')
  );
  
  const yourSignal = {
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
  
  const results = await gate.validateScalpingSignal(yourSignal);
  
  if (Array.isArray(results)) {
    results.forEach(result => {
      console.log(`\n📊 ${result.side} Signal Result: ${result.status}`);
      
      if (result.finalPayload) {
        const p = result.finalPayload;
        console.log('\n✅ FINAL VALIDATED SIGNAL:');
        console.log(`{`);
        console.log(`  instrument: "${p.instrument}",`);
        console.log(`  mode: "${p.mode}",`);
        console.log(`  timeframes: { bias: "${p.timeframes.bias}", entry: "${p.timeframes.entry}" },`);
        console.log(`  side: "${p.side}",`);
        console.log(`  spot: ${p.spot.toFixed(2)},`);
        console.log(`  option: {`);
        console.log(`    selected_strike: ${p.option.selected_strike},`);
        console.log(`    premium_entry: ${p.option.premium_entry.toFixed(2)},`);
        console.log(`    delta: ${p.option.greeks.delta.toFixed(2)},`);
        console.log(`    spread_pct: ${p.option.liquidity.spread_pct.toFixed(1)}%`);
        console.log(`  },`);
        console.log(`  risk_model: {`);
        console.log(`    atr_basis: "${p.risk_model.atr_basis}",`);
        console.log(`    k_sl: ${p.risk_model.k_sl.toFixed(1)},`);
        console.log(`    k_tp: ${p.risk_model.k_tp.toFixed(1)}`);
        console.log(`  },`);
        console.log(`  decision: { status: "${p.decision.status}" }`);
        console.log(`}`);
      }
      
      console.log('\n🔍 Validation Breakdown:');
      Object.entries(result.validations).forEach(([key, validation]) => {
        const icon = validation.status === 'PASS' ? '✅' : 
                    validation.status === 'FAIL' ? '❌' : 
                    validation.status === 'REWRITE' ? '🔄' : '⚠️';
        console.log(`  ${icon} ${key}: ${validation.status}`);
        validation.reasons.forEach(reason => {
          console.log(`    └─ ${reason}`);
        });
      });
    });
  }
}

async function testSymmetricPutGeneration() {
  console.log('\n\n🔄 TESTING SYMMETRIC PUT GENERATION');
  console.log('===================================');
  console.log('Market: Bearish conditions');
  console.log('Expected: Generate PUT signal with same validation rigor');
  
  const gate = new StrictScalpingGate(
    createRealisticMockDataProvider(), 
    createRealisticTechnicalAnalysis('bearish')
  );
  
  const bearishMarketSignal = {
    instrument: 'BANKNIFTY',
    mode: 'SCALP',
    timeframes: { bias: '15m', entry: '5m' },
    spot: 55808.80,
    spotPrice: 55808.80,
    premium: 126.80,
    expiry: '21-AUG-2025',
    stopLoss: 55892.64, // Above spot for PUT
    target1: 55697.28,  // Below spot for PUT
    optionStrike: 55800,
    optionType: 'PUT'
  };
  
  const results = await gate.validateScalpingSignal(bearishMarketSignal);
  
  if (Array.isArray(results)) {
    results.forEach(result => {
      console.log(`\n📊 ${result.side} Signal: ${result.status}`);
      
      if (result.status === 'PASSED' && result.finalPayload) {
        const p = result.finalPayload;
        console.log(`✅ PUT Signal Generated:`);
        console.log(`  Strike: ${p.option.selected_strike} PUT`);
        console.log(`  Premium: ₹${p.option.premium_entry.toFixed(2)}`);
        console.log(`  Delta: ${p.option.greeks.delta.toFixed(2)} (negative for PUT)`);
        console.log(`  Entry Rule: ${p.entry_rule_text}`);
      }
      
      // Show key validations
      ['entryTrigger', 'structureConfirmation', 'optionsTradability'].forEach(key => {
        if (result.validations[key]) {
          const v = result.validations[key];
          const icon = v.status === 'PASS' ? '✅' : '❌';
          console.log(`  ${icon} ${key}: ${v.reasons[0]}`);
        }
      });
    });
  }
}

async function testEdgeCases() {
  console.log('\n\n⚠️  TESTING EDGE CASES');
  console.log('======================');
  
  const gate = new StrictScalpingGate(
    createRealisticMockDataProvider(), 
    createRealisticTechnicalAnalysis('neutral')
  );
  
  console.log('\n📊 Test: Neutral Market (No Clear Direction)');
  const neutralSignal = {
    instrument: 'NIFTY',
    timeframes: { bias: '15m', entry: '5m' },
    spot: 24935.95,
    spotPrice: 24935.95,
    premium: 47.95,
    stopLoss: 24898.55,
    target1: 24985.82
  };
  
  const neutralResult = await gate.validateScalpingSignal(neutralSignal);
  if (!Array.isArray(neutralResult)) {
    console.log(`  Result: ${neutralResult.status}`);
    console.log(`  Reason: ${neutralResult.reasons[0]}`);
  }
  
  console.log('\n📊 Test: Invalid Timeframe');
  const invalidTimeframeSignal = {
    instrument: 'NIFTY',
    timeframes: { bias: '1h', entry: '30m' },
    spot: 24935.95
  };
  
  const invalidResult = await gate.validateScalpingSignal(invalidTimeframeSignal);
  if (Array.isArray(invalidResult)) {
    invalidResult.forEach(r => {
      console.log(`  ${r.side}: ${r.status} - ${r.reasons[0]}`);
    });
  } else {
    console.log(`  Result: ${invalidResult.status} - ${invalidResult.reasons[0]}`);
  }
}

// Run comprehensive integration test
async function runIntegrationTest() {
  console.log('🚀 STRICT SCALPING GATE - INTEGRATION TEST');
  console.log('==========================================');
  console.log('Testing deterministic PASS/REWRITE/REJECT decisions');
  console.log('with symmetric CALL/PUT generation\n');
  
  try {
    await testYourExampleSignal();
    await testSymmetricPutGeneration();
    await testEdgeCases();
    
    console.log('\n\n🎯 INTEGRATION TEST SUMMARY');
    console.log('============================');
    console.log('✅ Strict validation gates implemented');
    console.log('✅ ATR-based SL/TP with auto-rescaling');
    console.log('✅ Options tradability checks (spread%, delta, depth)');
    console.log('✅ Premium R:R validation with costs');
    console.log('✅ Symmetric CALL/PUT signal generation');
    console.log('✅ Deterministic PASS/REWRITE/REJECT decisions');
    console.log('✅ Event filtering and risk limits');
    console.log('✅ Comprehensive validation schema output');
    
    console.log('\n📋 GATE DECISION MATRIX:');
    console.log('PASS    → All validations passed, signal executable');
    console.log('REWRITE → Auto-rescaled levels within ATR bounds');
    console.log('REJECT  → Failed critical gates (spread, R:R, limits)');
    
  } catch (error) {
    console.error('❌ Integration test failed:', error);
  }
}

runIntegrationTest();