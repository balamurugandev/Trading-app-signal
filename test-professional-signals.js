#!/usr/bin/env node

/**
 * Professional Signal Engine Test Script
 * Tests the new professional scalping signal engine with validation gates
 */

const axios = require('axios');

const SERVER_URL = 'http://localhost:3001';

class ProfessionalSignalTester {
  constructor() {
    this.results = {
      api_tests: [],
      validation_tests: [],
      signal_quality_tests: [],
      errors: []
    };
  }

  async runAllTests() {
    console.log('🎯 Testing Professional Signal Engine...\n');
    
    try {
      // Test 1: API Endpoints
      await this.testAPIEndpoints();
      
      // Test 2: Signal Generation
      await this.testSignalGeneration();
      
      // Test 3: Validation Rules
      await this.testValidationRules();
      
      // Test 4: Signal Quality
      await this.testSignalQuality();
      
      // Generate Report
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      this.results.errors.push(`Test suite error: ${error.message}`);
      this.generateReport();
    }
  }

  async testAPIEndpoints() {
    console.log('🔌 Test 1: API Endpoints');
    console.log('========================');
    
    const endpoints = [
      { path: '/api/professional/validation-rules', method: 'GET' },
      { path: '/api/professional/backtest-stats/NIFTY/1m', method: 'GET' },
      { path: '/api/professional/backtest-stats/BANKNIFTY/5m', method: 'GET' }
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(`${SERVER_URL}${endpoint.path}`);
        if (response.status === 200) {
          console.log(`✅ ${endpoint.path} - OK`);
          this.results.api_tests.push({ endpoint: endpoint.path, status: 'PASS' });
        } else {
          console.log(`❌ ${endpoint.path} - Status: ${response.status}`);
          this.results.api_tests.push({ endpoint: endpoint.path, status: 'FAIL', reason: `Status ${response.status}` });
        }
      } catch (error) {
        console.log(`❌ ${endpoint.path} - Error: ${error.message}`);
        this.results.api_tests.push({ endpoint: endpoint.path, status: 'FAIL', reason: error.message });
      }
    }
    
    console.log('');
  }

  async testSignalGeneration() {
    console.log('🎯 Test 2: Professional Signal Generation');
    console.log('========================================');
    
    const testCases = [
      { symbol: 'NIFTY', timeframe: '1m' },
      { symbol: 'BANKNIFTY', timeframe: '1m' },
      { symbol: 'NIFTY', timeframe: '5m' },
      { symbol: 'BANKNIFTY', timeframe: '5m' }
    ];
    
    for (const testCase of testCases) {
      try {
        console.log(`Testing ${testCase.symbol} ${testCase.timeframe}...`);
        
        const response = await axios.post(`${SERVER_URL}/api/professional/generate-signal`, {
          symbol: testCase.symbol,
          timeframe: testCase.timeframe
        });
        
        if (response.status === 200 && response.data.signal) {
          const signal = response.data.signal;
          console.log(`✅ ${testCase.symbol} ${testCase.timeframe} - Signal generated`);
          console.log(`   Gate Score: ${signal.validation.gate_score}%`);
          console.log(`   R:R Ratio: ${signal.risk.risk_reward_ratio.toFixed(2)}`);
          console.log(`   ATR SL: ${signal.risk.stop_loss.atr_multiple}x`);
          console.log(`   Execution Prob: ${signal.options.execution.execution_probability}%`);
          
          this.results.signal_quality_tests.push({
            symbol: testCase.symbol,
            timeframe: testCase.timeframe,
            status: 'GENERATED',
            gate_score: signal.validation.gate_score,
            rr_ratio: signal.risk.risk_reward_ratio,
            atr_sl: signal.risk.stop_loss.atr_multiple,
            execution_prob: signal.options.execution.execution_probability
          });
          
        } else if (response.status === 404) {
          console.log(`⚠️  ${testCase.symbol} ${testCase.timeframe} - No signal (conditions not met)`);
          this.results.signal_quality_tests.push({
            symbol: testCase.symbol,
            timeframe: testCase.timeframe,
            status: 'NO_SIGNAL',
            reason: 'Conditions not met'
          });
        }
        
      } catch (error) {
        if (error.response && error.response.status === 404) {
          console.log(`⚠️  ${testCase.symbol} ${testCase.timeframe} - No signal (validation failed)`);
          this.results.signal_quality_tests.push({
            symbol: testCase.symbol,
            timeframe: testCase.timeframe,
            status: 'REJECTED',
            reason: 'Failed validation gates'
          });
        } else {
          console.log(`❌ ${testCase.symbol} ${testCase.timeframe} - Error: ${error.message}`);
          this.results.errors.push(`Signal generation error for ${testCase.symbol} ${testCase.timeframe}: ${error.message}`);
        }
      }
    }
    
    console.log('');
  }

  async testValidationRules() {
    console.log('📋 Test 3: Validation Rules');
    console.log('===========================');
    
    try {
      const response = await axios.get(`${SERVER_URL}/api/professional/validation-rules`);
      const rules = response.data.rules;
      
      // Test timeframe bounds
      const timeframeBounds = rules.TIMEFRAME_RR_BOUNDS;
      console.log('Timeframe R:R Bounds:');
      
      Object.entries(timeframeBounds).forEach(([tf, bounds]) => {
        console.log(`  ${tf}: SL ${bounds.min_sl_atr}-${bounds.max_sl_atr} ATR, Target ${bounds.min_target_atr}-${bounds.max_target_atr} ATR, Min R:R ${bounds.min_rr}`);
        
        // Validate bounds make sense
        if (bounds.min_sl_atr > 0 && bounds.max_sl_atr > bounds.min_sl_atr &&
            bounds.min_target_atr > bounds.min_sl_atr && bounds.min_rr > 1.0) {
          this.results.validation_tests.push({ rule: `${tf}_bounds`, status: 'VALID' });
        } else {
          this.results.validation_tests.push({ rule: `${tf}_bounds`, status: 'INVALID' });
        }
      });
      
      // Test options thresholds
      const optionsThresholds = rules.OPTIONS_THRESHOLDS;
      console.log('\nOptions Execution Thresholds:');
      console.log(`  Max Spread: ${optionsThresholds.max_spread_pct}%`);
      console.log(`  Min Liquidity: ${optionsThresholds.min_liquidity_score}`);
      console.log(`  Min Delta: ${optionsThresholds.min_delta}`);
      console.log(`  Min Execution Prob: ${optionsThresholds.min_execution_probability}%`);
      
      // Test risk limits
      const riskLimits = rules.RISK_LIMITS;
      console.log('\nRisk Control Limits:');
      console.log(`  Max Risk/Trade: ${riskLimits.max_risk_per_trade_pct}%`);
      console.log(`  Max Daily Loss: ${riskLimits.max_daily_loss_pct}%`);
      console.log(`  Max Trades/Day: ${riskLimits.max_trades_per_day}`);
      
      console.log('✅ Validation rules loaded successfully');
      
    } catch (error) {
      console.log(`❌ Failed to load validation rules: ${error.message}`);
      this.results.errors.push(`Validation rules error: ${error.message}`);
    }
    
    console.log('');
  }

  async testSignalQuality() {
    console.log('🏆 Test 4: Signal Quality Assessment');
    console.log('===================================');
    
    const generatedSignals = this.results.signal_quality_tests.filter(t => t.status === 'GENERATED');
    
    if (generatedSignals.length === 0) {
      console.log('⚠️  No signals generated to assess quality');
      return;
    }
    
    console.log(`Analyzing ${generatedSignals.length} generated signals...\n`);
    
    generatedSignals.forEach(signal => {
      console.log(`${signal.symbol} ${signal.timeframe}:`);
      
      // Quality checks
      const qualityChecks = {
        gate_score: signal.gate_score >= 80,
        rr_ratio: signal.rr_ratio >= 1.2,
        atr_sl_reasonable: signal.atr_sl >= 0.5 && signal.atr_sl <= 3.0,
        execution_feasible: signal.execution_prob >= 75
      };
      
      Object.entries(qualityChecks).forEach(([check, passed]) => {
        const status = passed ? '✅' : '❌';
        const value = signal[check.replace('_reasonable', '').replace('_feasible', '_prob')];
        console.log(`  ${status} ${check}: ${value}`);
      });
      
      const qualityScore = Object.values(qualityChecks).filter(Boolean).length;
      console.log(`  Overall Quality: ${qualityScore}/4 checks passed\n`);
    });
  }

  generateReport() {
    console.log('📊 PROFESSIONAL SIGNAL ENGINE TEST REPORT');
    console.log('==========================================');
    
    // API Tests Summary
    const apiPassed = this.results.api_tests.filter(t => t.status === 'PASS').length;
    const apiTotal = this.results.api_tests.length;
    console.log(`\n🔌 API Endpoints: ${apiPassed}/${apiTotal} passed`);
    
    // Signal Generation Summary
    const signalsGenerated = this.results.signal_quality_tests.filter(t => t.status === 'GENERATED').length;
    const signalsRejected = this.results.signal_quality_tests.filter(t => t.status === 'REJECTED').length;
    const signalsNoConditions = this.results.signal_quality_tests.filter(t => t.status === 'NO_SIGNAL').length;
    const signalsTotal = this.results.signal_quality_tests.length;
    
    console.log(`\n🎯 Signal Generation:`);
    console.log(`   Generated: ${signalsGenerated}/${signalsTotal}`);
    console.log(`   Rejected: ${signalsRejected}/${signalsTotal}`);
    console.log(`   No Conditions: ${signalsNoConditions}/${signalsTotal}`);
    
    // Quality Assessment
    if (signalsGenerated > 0) {
      const avgGateScore = this.results.signal_quality_tests
        .filter(t => t.status === 'GENERATED')
        .reduce((sum, t) => sum + t.gate_score, 0) / signalsGenerated;
      
      const avgRR = this.results.signal_quality_tests
        .filter(t => t.status === 'GENERATED')
        .reduce((sum, t) => sum + t.rr_ratio, 0) / signalsGenerated;
      
      console.log(`\n🏆 Signal Quality:`);
      console.log(`   Average Gate Score: ${avgGateScore.toFixed(1)}%`);
      console.log(`   Average R:R Ratio: ${avgRR.toFixed(2)}`);
    }
    
    // Errors
    if (this.results.errors.length > 0) {
      console.log(`\n❌ Errors (${this.results.errors.length}):`);
      this.results.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    // Overall Assessment
    const overallScore = ((apiPassed / apiTotal) * 0.3 + 
                         (signalsGenerated / signalsTotal) * 0.7) * 100;
    
    console.log(`\n🎯 OVERALL SCORE: ${overallScore.toFixed(1)}%`);
    
    if (overallScore >= 80) {
      console.log('✅ PROFESSIONAL SIGNAL ENGINE: READY FOR PRODUCTION');
    } else if (overallScore >= 60) {
      console.log('⚠️  PROFESSIONAL SIGNAL ENGINE: NEEDS IMPROVEMENT');
    } else {
      console.log('❌ PROFESSIONAL SIGNAL ENGINE: NOT READY');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('💡 Next Steps:');
    console.log('1. Review any failed tests above');
    console.log('2. Check server logs for detailed error messages');
    console.log('3. Verify market data is available and live');
    console.log('4. Test during market hours for better signal generation');
    console.log('5. Monitor signal performance in paper trading');
  }
}

// Run the tests
async function main() {
  const tester = new ProfessionalSignalTester();
  await tester.runAllTests();
}

// Handle command line execution
if (require.main === module) {
  main().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = ProfessionalSignalTester;