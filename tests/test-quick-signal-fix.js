const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testSignalGeneration() {
  console.log('🚀 Testing FIXED Signal Generation...\n');
  
  try {
    // Test signal generation for different instruments and timeframes
    const testCases = [
      { symbol: 'NIFTY', timeframe: '1m' },
      { symbol: 'NIFTY', timeframe: '5m' },
      { symbol: 'BANKNIFTY', timeframe: '1m' },
      { symbol: 'BANKNIFTY', timeframe: '5m' }
    ];

    let signalsGenerated = 0;

    for (const testCase of testCases) {
      console.log(`\n📊 Testing ${testCase.symbol} ${testCase.timeframe}...`);
      
      try {
        const response = await axios.get(`${BASE_URL}/api/signals/generate/${testCase.symbol}/${testCase.timeframe}`);
        
        if (response.data && response.data.signal) {
          console.log(`✅ SUCCESS: Signal generated for ${testCase.symbol} ${testCase.timeframe}`);
          console.log(`   Signal: ${response.data.signal.signal} ${response.data.signal.option_strike}`);
          console.log(`   Setup: ${response.data.signal.setup}`);
          console.log(`   Confidence: ${response.data.signal.confidence}`);
          signalsGenerated++;
        } else {
          console.log(`❌ FAILED: No signal generated for ${testCase.symbol} ${testCase.timeframe}`);
          if (response.data && response.data.error) {
            console.log(`   Error: ${response.data.error}`);
          }
        }
      } catch (error) {
        console.log(`❌ ERROR: ${testCase.symbol} ${testCase.timeframe} - ${error.message}`);
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`\n🏁 Test Results:`);
    console.log(`   Signals Generated: ${signalsGenerated}/${testCases.length}`);
    
    if (signalsGenerated > 0) {
      console.log(`✅ SUCCESS: Signal generation is working!`);
    } else {
      console.log(`❌ CRITICAL: Signal generation is still broken!`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSignalGeneration();