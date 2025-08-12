#!/usr/bin/env node

const axios = require('axios');
const { spawn } = require('child_process');

const BASE_URL = 'http://localhost:3001';

class StandardSignalTest {
  constructor() {
    this.serverProcess = null;
    this.signalCount = 0;
    this.testResults = [];
  }

  async runTest() {
    console.log('🎯 Testing Standard Mode Signal Generation');
    console.log('=' .repeat(50));

    try {
      // Start server in live mode
      await this.startServer();
      await this.sleep(8000); // Wait for server to initialize

      // Test signal generation
      await this.testSignalGeneration();
      
      // Generate report
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Signal test failed:', error.message);
      process.exit(1);
    } finally {
      await this.cleanup();
    }
  }

  async startServer() {
    console.log('🚀 Starting server in LIVE mode for signal testing...');
    
    const env = { ...process.env };
    env.LIVE_DATA = 'true';
    
    this.serverProcess = spawn('node', ['server/index.js'], {
      env,
      stdio: 'pipe'
    });
    
    // Capture server output to monitor signals
    this.serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('🚨 LIVE SIGNAL') || output.includes('🚨 REAL-TIME SIGNAL')) {
        this.signalCount++;
        console.log('📊 Signal detected:', output.trim());
      }
    });
    
    // Wait for server to start
    await this.waitForServer();
  }

  async waitForServer() {
    const maxAttempts = 30;
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        await axios.get(`${BASE_URL}/api/data/status`, { timeout: 1000 });
        console.log('✅ Server is ready');
        return;
      } catch (error) {
        attempts++;
        await this.sleep(1000);
      }
    }
    
    throw new Error('Server failed to start within timeout');
  }

  async testSignalGeneration() {
    console.log('\n📈 Testing Signal Generation...');
    
    // Test 1: Check if market data is flowing
    await this.testMarketDataFlow();
    
    // Test 2: Check technical indicators
    await this.testTechnicalIndicators();
    
    // Test 3: Check signal conditions
    await this.testSignalConditions();
    
    // Test 4: Monitor for actual signals
    await this.monitorSignals();
    
    // Test 5: Force signal generation if possible
    await this.testForceSignalGeneration();
  }

  async testMarketDataFlow() {
    const testName = 'Market Data Flow';
    try {
      const niftyResponse = await axios.get(`${BASE_URL}/api/data/current/NIFTY`);
      const bankniftyResponse = await axios.get(`${BASE_URL}/api/data/current/BANKNIFTY`);
      
      const niftyPrice = niftyResponse.data.data.ltp;
      const bankniftyPrice = bankniftyResponse.data.data.ltp;
      
      this.assert(niftyPrice > 20000, `NIFTY price ${niftyPrice} should be realistic`);
      this.assert(bankniftyPrice > 45000, `BANKNIFTY price ${bankniftyPrice} should be realistic`);
      this.assert(niftyResponse.data.isLive === true, 'Data should be live');
      
      this.recordTest(testName, true);
      console.log('✅', testName, `(NIFTY: ₹${niftyPrice.toFixed(2)}, BANKNIFTY: ₹${bankniftyPrice.toFixed(2)})`);
    } catch (error) {
      this.recordTest(testName, false, error.message);
      console.log('❌', testName, ':', error.message);
    }
  }

  async testTechnicalIndicators() {
    const testName = 'Technical Indicators';
    try {
      const response = await axios.get(`${BASE_URL}/api/indicators/NIFTY/5m`);
      const indicators = response.data.indicators;
      
      this.assert(indicators.vwap > 0, 'VWAP should be calculated');
      this.assert(indicators.ema9 > 0, 'EMA9 should be calculated');
      this.assert(indicators.ema21 > 0, 'EMA21 should be calculated');
      this.assert(indicators.rsi >= 0 && indicators.rsi <= 100, 'RSI should be in valid range');
      
      this.recordTest(testName, true);
      console.log('✅', testName, `(RSI: ${indicators.rsi.toFixed(1)}, VWAP: ${indicators.vwap.toFixed(2)})`);
    } catch (error) {
      this.recordTest(testName, false, error.message);
      console.log('❌', testName, ':', error.message);
    }
  }

  async testSignalConditions() {
    const testName = 'Signal Conditions Analysis';
    try {
      // Get current market data and indicators
      const niftyData = await axios.get(`${BASE_URL}/api/data/current/NIFTY`);
      const indicators = await axios.get(`${BASE_URL}/api/indicators/NIFTY/5m`);
      
      const price = niftyData.data.data.ltp;
      const ind = indicators.data.indicators;
      
      // Analyze conditions
      const trendCondition = price > ind.vwap;
      const momentumCondition = ind.rsi > 30;
      const priceMovement = Math.abs(niftyData.data.data.changePercent) > 0.1;
      
      console.log('📊 Signal Conditions Analysis:');
      console.log(`   Price vs VWAP: ${price.toFixed(2)} vs ${ind.vwap.toFixed(2)} = ${trendCondition ? '✅' : '❌'}`);
      console.log(`   RSI: ${ind.rsi.toFixed(1)} (>30) = ${momentumCondition ? '✅' : '❌'}`);
      console.log(`   Price Movement: ${niftyData.data.data.changePercent.toFixed(2)}% = ${priceMovement ? '✅' : '❌'}`);
      
      this.recordTest(testName, true);
      console.log('✅', testName);
    } catch (error) {
      this.recordTest(testName, false, error.message);
      console.log('❌', testName, ':', error.message);
    }
  }

  async monitorSignals() {
    const testName = 'Signal Monitoring';
    console.log('⏱️  Monitoring for signals (30 seconds)...');
    
    const initialSignalCount = this.signalCount;
    await this.sleep(30000); // Monitor for 30 seconds
    
    const newSignals = this.signalCount - initialSignalCount;
    
    if (newSignals > 0) {
      this.recordTest(testName, true);
      console.log('✅', testName, `(${newSignals} signals detected)`);
    } else {
      this.recordTest(testName, false, 'No signals detected in 30 seconds');
      console.log('❌', testName, ': No signals detected in 30 seconds');
    }
  }

  async testForceSignalGeneration() {
    const testName = 'Force Signal Generation Test';
    try {
      // This is a diagnostic test to see if signal generation logic works at all
      console.log('🔧 Attempting to understand signal generation logic...');
      
      // Check if there are any signal generation endpoints
      try {
        const response = await axios.get(`${BASE_URL}/api/signals/generate/NIFTY/1m`);
        if (response.data && response.data.signal) {
          this.recordTest(testName, true);
          console.log('✅', testName, ': Manual signal generation works');
        } else {
          this.recordTest(testName, false, 'Manual signal generation returned no signal');
          console.log('❌', testName, ': Manual signal generation returned no signal');
        }
      } catch (error) {
        if (error.response && error.response.status === 404) {
          this.recordTest(testName, false, 'No manual signal generation endpoint available');
          console.log('⚠️ ', testName, ': No manual signal generation endpoint available');
        } else {
          throw error;
        }
      }
    } catch (error) {
      this.recordTest(testName, false, error.message);
      console.log('❌', testName, ':', error.message);
    }
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }

  recordTest(testName, passed, error = null) {
    this.testResults.push({
      name: testName,
      passed,
      error
    });
  }

  generateReport() {
    console.log('\n' + '='.repeat(50));
    console.log('📋 STANDARD MODE SIGNAL TEST RESULTS');
    console.log('='.repeat(50));
    
    const passed = this.testResults.filter(t => t.passed).length;
    const failed = this.testResults.filter(t => !t.passed).length;
    
    console.log(`\n📊 Test Results:`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`🎯 Signals Detected: ${this.signalCount}`);
    
    if (failed > 0) {
      console.log('\nFailed Tests:');
      this.testResults
        .filter(test => !test.passed)
        .forEach(test => console.log(`  ❌ ${test.name}: ${test.error}`));
    }
    
    console.log('\n🔍 DIAGNOSIS:');
    if (this.signalCount === 0) {
      console.log('❌ CRITICAL: No signals generated in standard mode');
      console.log('   Possible causes:');
      console.log('   1. Signal conditions too strict');
      console.log('   2. Signal generation not running');
      console.log('   3. Market conditions not met');
      console.log('   4. Technical indicators not calculated properly');
    } else {
      console.log('✅ Signals are being generated successfully');
    }
    
    if (failed === 0 && this.signalCount > 0) {
      console.log('\n🎉 ALL TESTS PASSED! Standard mode signal generation is working.');
    } else {
      console.log('\n⚠️  ISSUES DETECTED! Standard mode signal generation needs fixing.');
      process.exit(1);
    }
  }

  async cleanup() {
    if (this.serverProcess) {
      console.log('\n🛑 Stopping server...');
      this.serverProcess.kill('SIGTERM');
      this.serverProcess = null;
      await this.sleep(2000);
    }
    console.log('🧹 Cleanup completed');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the test
if (require.main === module) {
  const test = new StandardSignalTest();
  test.runTest().catch(error => {
    console.error('❌ Test crashed:', error);
    process.exit(1);
  });
}

module.exports = StandardSignalTest;