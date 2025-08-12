#!/usr/bin/env node

const axios = require('axios');

async function testManualSignal() {
  console.log('🧪 Testing Manual Signal Generation');
  console.log('=' .repeat(40));
  
  try {
    // Get current market data
    const niftyResponse = await axios.get('http://localhost:3001/api/data/current/NIFTY');
    const niftyData = niftyResponse.data.data;
    
    console.log(`📊 Current NIFTY: ₹${niftyData.ltp.toFixed(2)} (${niftyData.changePercent >= 0 ? '+' : ''}${niftyData.changePercent.toFixed(2)}%)`);
    
    // Get technical indicators
    const indicatorsResponse = await axios.get('http://localhost:3001/api/indicators/NIFTY/5m');
    const indicators = indicatorsResponse.data.indicators;
    
    console.log(`📈 Technical Indicators:`);
    console.log(`   RSI: ${indicators.rsi.toFixed(1)}`);
    console.log(`   VWAP: ₹${indicators.vwap.toFixed(2)}`);
    console.log(`   EMA9: ₹${indicators.ema9.toFixed(2)}`);
    console.log(`   EMA21: ₹${indicators.ema21.toFixed(2)}`);
    
    // Analyze conditions
    const priceVsVwap = niftyData.ltp > indicators.vwap;
    const emaAlignment = indicators.ema9 > indicators.ema21;
    const rsiCondition = indicators.rsi > 25 && indicators.rsi < 75;
    
    console.log(`\n🔍 Signal Conditions:`);
    console.log(`   Price > VWAP: ${priceVsVwap ? '✅' : '❌'} (${niftyData.ltp.toFixed(2)} vs ${indicators.vwap.toFixed(2)})`);
    console.log(`   EMA9 > EMA21: ${emaAlignment ? '✅' : '❌'} (${indicators.ema9.toFixed(2)} vs ${indicators.ema21.toFixed(2)})`);
    console.log(`   RSI in range: ${rsiCondition ? '✅' : '❌'} (${indicators.rsi.toFixed(1)})`);
    
    const shouldGenerateSignal = rsiCondition; // Only require RSI condition for scalping
    
    console.log(`\n🎯 Signal Decision: ${shouldGenerateSignal ? '✅ SHOULD GENERATE' : '❌ NO SIGNAL'}`);
    
    if (shouldGenerateSignal) {
      console.log(`\n📊 Simulated Signal:`);
      console.log(`   Symbol: NIFTY`);
      console.log(`   Timeframe: 5m`);
      console.log(`   Type: BUY_CALL`);
      console.log(`   Entry: ₹${niftyData.ltp.toFixed(2)}`);
      console.log(`   Strike: ${Math.round(niftyData.ltp / 50) * 50} CE`);
      console.log(`   RSI: ${indicators.rsi.toFixed(1)}`);
      console.log(`   Strength: ${Math.min(100, 50 + indicators.rsi).toFixed(0)}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testManualSignal();