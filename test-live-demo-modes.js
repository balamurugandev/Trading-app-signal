#!/usr/bin/env node

const axios = require('axios');
const { spawn } = require('child_process');
const fs = require('fs');

const BASE_URL = 'http://localhost:3001';
const TEST_TIMEOUT = 30000; // 30 seconds timeout

class ModeTestSuite {
    constructor() {
        this.results = {
            liveMode: { passed: 0, failed: 0, tests: [] },
            demoMode: { passed: 0, failed: 0, tests: [] }
        };
        this.serverProcess = null;
    }

    async runAllTests() {
        console.log('🧪 Starting Live Mode vs Demo Mode Test Suite');
        console.log('='.repeat(60));

        try {
            // Test Live Mode
            await this.testLiveMode();

            // Wait between tests
            await this.sleep(2000);

            // Test Demo Mode
            await this.testDemoMode();

            // Generate report
            this.generateReport();

        } catch (error) {
            console.error('❌ Test suite failed:', error.message);
            process.exit(1);
        } finally {
            await this.cleanup();
        }
    }

    async testLiveMode() {
        console.log('\n📊 TESTING LIVE MODE');
        console.log('-'.repeat(40));

        // Start server in live mode
        await this.startServer(true);
        await this.sleep(8000); // Wait for server to fully initialize

        // Test 1: Verify live mode status
        await this.testLiveModeStatus();

        // Test 2: Verify Yahoo Finance provider
        await this.testYahooFinanceProvider();

        // Test 3: Verify realistic pricing
        await this.testRealisticPricing();

        // Test 4: Verify live data updates
        await this.testLiveDataUpdates();

        // Test 5: Verify no demo/test data leakage
        await this.testNoTestDataLeakage();

        // Test 6: Verify signal generation with live data
        await this.testSignalGenerationLive();

        await this.stopServer();
    }

    async testDemoMode() {
        console.log('\n🎭 TESTING DEMO MODE');
        console.log('-'.repeat(40));

        // Start server in demo mode
        await this.startServer(false);
        await this.sleep(5000); // Wait for server to initialize

        // Test 1: Verify demo mode status
        await this.testDemoModeStatus();

        // Test 2: Verify demo data provider
        await this.testDemoDataProvider();

        // Test 3: Verify demo pricing is reasonable
        await this.testDemoPricingReasonable();

        // Test 4: Verify demo data consistency
        await this.testDemoDataConsistency();

        // Test 5: Verify signal generation with demo data
        await this.testSignalGenerationDemo();

        await this.stopServer();
    }

    async startServer(liveMode = true) {
        console.log(`🚀 Starting server in ${liveMode ? 'LIVE' : 'DEMO'} mode...`);

        const env = { ...process.env };
        if (liveMode) {
            env.LIVE_DATA = 'true';
        } else {
            delete env.LIVE_DATA;
        }

        this.serverProcess = spawn('node', ['server/index.js'], {
            env,
            stdio: 'pipe'
        });

        // Wait for server to start
        await this.waitForServer();
    }

    async stopServer() {
        if (this.serverProcess) {
            console.log('🛑 Stopping server...');
            this.serverProcess.kill('SIGTERM');
            this.serverProcess = null;
            await this.sleep(2000);
        }
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

    async testLiveModeStatus() {
        const testName = 'Live Mode Status Check';
        try {
            const response = await axios.get(`${BASE_URL}/api/data/status`);
            const status = response.data.status;

            this.assert(status.isLiveMode === true, 'isLiveMode should be true');
            this.assert(status.isDemoMode === false, 'isDemoMode should be false');
            this.assert(status.providerStatus === 'Yahoo Finance', 'Provider should be Yahoo Finance');

            this.recordTest('liveMode', testName, true);
            console.log('✅', testName);
        } catch (error) {
            this.recordTest('liveMode', testName, false, error.message);
            console.log('❌', testName, ':', error.message);
        }
    }

    async testYahooFinanceProvider() {
        const testName = 'Yahoo Finance Provider Active';
        try {
            const response = await axios.get(`${BASE_URL}/api/data/status`);
            const status = response.data.status;

            this.assert(status.providerStatus === 'Yahoo Finance', 'Provider must be Yahoo Finance');
            this.assert(status.isLiveMode === true, 'Live mode must be active');

            this.recordTest('liveMode', testName, true);
            console.log('✅', testName);
        } catch (error) {
            this.recordTest('liveMode', testName, false, error.message);
            console.log('❌', testName, ':', error.message);
        }
    }

    async testRealisticPricing() {
        const testName = 'Realistic Live Pricing';
        try {
            const niftyResponse = await axios.get(`${BASE_URL}/api/data/current/NIFTY`);
            const bankniftyResponse = await axios.get(`${BASE_URL}/api/data/current/BANKNIFTY`);

            const niftyPrice = niftyResponse.data.data.ltp;
            const bankniftyPrice = bankniftyResponse.data.data.ltp;

            // NIFTY should be in realistic range (20000-30000)
            this.assert(niftyPrice >= 20000 && niftyPrice <= 30000,
                `NIFTY price ${niftyPrice} should be in range 20000-30000`);

            // BANKNIFTY should be in realistic range (45000-65000)
            this.assert(bankniftyPrice >= 45000 && bankniftyPrice <= 65000,
                `BANKNIFTY price ${bankniftyPrice} should be in range 45000-65000`);

            // Verify it's live data (not test data)
            this.assert(niftyResponse.data.isLive === true, 'NIFTY data should be marked as live');
            this.assert(bankniftyResponse.data.isLive === true, 'BANKNIFTY data should be marked as live');

            this.recordTest('liveMode', testName, true);
            console.log('✅', testName, `(NIFTY: ₹${niftyPrice.toFixed(2)}, BANKNIFTY: ₹${bankniftyPrice.toFixed(2)})`);
        } catch (error) {
            this.recordTest('liveMode', testName, false, error.message);
            console.log('❌', testName, ':', error.message);
        }
    }

    async testLiveDataUpdates() {
        const testName = 'Live Data Updates';
        try {
            // Get initial price
            const response1 = await axios.get(`${BASE_URL}/api/data/current/NIFTY`);
            const price1 = response1.data.data.ltp;
            const timestamp1 = new Date(response1.data.data.timestamp);

            // Wait for update
            await this.sleep(3000);

            // Get updated price
            const response2 = await axios.get(`${BASE_URL}/api/data/current/NIFTY`);
            const price2 = response2.data.data.ltp;
            const timestamp2 = new Date(response2.data.data.timestamp);

            // Timestamps should be different (data is updating)
            this.assert(timestamp2 > timestamp1, 'Timestamps should be updating');

            // Prices might be same or different, but should be in valid range
            this.assert(price2 >= 20000 && price2 <= 30000, 'Updated price should be in valid range');

            this.recordTest('liveMode', testName, true);
            console.log('✅', testName, `(${price1.toFixed(2)} → ${price2.toFixed(2)})`);
        } catch (error) {
            this.recordTest('liveMode', testName, false, error.message);
            console.log('❌', testName, ':', error.message);
        }
    }

    async testNoTestDataLeakage() {
        const testName = 'No Test Data Leakage';
        try {
            const response = await axios.get(`${BASE_URL}/api/data/current/NIFTY`);
            const data = response.data.data;

            // Check for test data indicators
            const dataString = JSON.stringify(data).toLowerCase();

            this.assert(!dataString.includes('test'), 'Data should not contain "test"');
            this.assert(!dataString.includes('demo'), 'Data should not contain "demo"');
            this.assert(!dataString.includes('mock'), 'Data should not contain "mock"');
            this.assert(!dataString.includes('fake'), 'Data should not contain "fake"');

            // Verify realistic values
            this.assert(data.ltp > 0, 'LTP should be positive');
            this.assert(data.volume > 0, 'Volume should be positive');
            this.assert(typeof data.changePercent === 'number', 'Change percent should be a number');

            this.recordTest('liveMode', testName, true);
            console.log('✅', testName);
        } catch (error) {
            this.recordTest('liveMode', testName, false, error.message);
            console.log('❌', testName, ':', error.message);
        }
    }

    async testSignalGenerationLive() {
        const testName = 'Signal Generation with Live Data';
        try {
            // Wait for signal generation
            await this.sleep(5000);

            // Check if signals are being generated (this is harder to test directly)
            // We'll check if the signal generation system is working by checking indicators
            const response = await axios.get(`${BASE_URL}/api/indicators/NIFTY/5m`);
            const indicators = response.data.indicators;

            this.assert(indicators.vwap > 0, 'VWAP should be calculated');
            this.assert(indicators.ema9 > 0, 'EMA9 should be calculated');
            this.assert(indicators.rsi >= 0 && indicators.rsi <= 100, 'RSI should be in valid range');

            this.recordTest('liveMode', testName, true);
            console.log('✅', testName);
        } catch (error) {
            this.recordTest('liveMode', testName, false, error.message);
            console.log('❌', testName, ':', error.message);
        }
    }

    async testDemoModeStatus() {
        const testName = 'Demo Mode Status Check';
        try {
            const response = await axios.get(`${BASE_URL}/api/data/status`);
            const status = response.data.status;

            this.assert(status.isLiveMode === false, 'isLiveMode should be false');
            this.assert(status.isDemoMode === true, 'isDemoMode should be true');
            this.assert(status.providerStatus === 'Demo', 'Provider should be Demo');

            this.recordTest('demoMode', testName, true);
            console.log('✅', testName);
        } catch (error) {
            this.recordTest('demoMode', testName, false, error.message);
            console.log('❌', testName, ':', error.message);
        }
    }

    async testDemoDataProvider() {
        const testName = 'Demo Data Provider Active';
        try {
            const response = await axios.get(`${BASE_URL}/api/data/status`);
            const status = response.data.status;

            this.assert(status.providerStatus === 'Demo', 'Provider must be Demo');
            this.assert(status.isDemoMode === true, 'Demo mode must be active');

            this.recordTest('demoMode', testName, true);
            console.log('✅', testName);
        } catch (error) {
            this.recordTest('demoMode', testName, false, error.message);
            console.log('❌', testName, ':', error.message);
        }
    }

    async testDemoPricingReasonable() {
        const testName = 'Demo Pricing Reasonable';
        try {
            const niftyResponse = await axios.get(`${BASE_URL}/api/data/current/NIFTY`);
            const bankniftyResponse = await axios.get(`${BASE_URL}/api/data/current/BANKNIFTY`);

            const niftyPrice = niftyResponse.data.data.ltp;
            const bankniftyPrice = bankniftyResponse.data.data.ltp;

            // Demo prices should still be in reasonable ranges
            this.assert(niftyPrice >= 20000 && niftyPrice <= 30000,
                `Demo NIFTY price ${niftyPrice} should be in range 20000-30000`);

            this.assert(bankniftyPrice >= 45000 && bankniftyPrice <= 65000,
                `Demo BANKNIFTY price ${bankniftyPrice} should be in range 45000-65000`);

            // Verify it's demo data (not live)
            this.assert(niftyResponse.data.isLive === false, 'NIFTY data should be marked as demo');
            this.assert(bankniftyResponse.data.isLive === false, 'BANKNIFTY data should be marked as demo');

            this.recordTest('demoMode', testName, true);
            console.log('✅', testName, `(NIFTY: ₹${niftyPrice.toFixed(2)}, BANKNIFTY: ₹${bankniftyPrice.toFixed(2)})`);
        } catch (error) {
            this.recordTest('demoMode', testName, false, error.message);
            console.log('❌', testName, ':', error.message);
        }
    }

    async testDemoDataConsistency() {
        const testName = 'Demo Data Consistency';
        try {
            // Get data multiple times to check consistency
            const responses = [];
            for (let i = 0; i < 3; i++) {
                const response = await axios.get(`${BASE_URL}/api/data/current/NIFTY`);
                responses.push(response.data.data);
                await this.sleep(1000);
            }

            // All responses should have valid data structure
            responses.forEach((data, index) => {
                this.assert(typeof data.ltp === 'number', `Response ${index + 1} should have numeric LTP`);
                this.assert(typeof data.change === 'number', `Response ${index + 1} should have numeric change`);
                this.assert(typeof data.volume === 'number', `Response ${index + 1} should have numeric volume`);
            });

            this.recordTest('demoMode', testName, true);
            console.log('✅', testName);
        } catch (error) {
            this.recordTest('demoMode', testName, false, error.message);
            console.log('❌', testName, ':', error.message);
        }
    }

    async testSignalGenerationDemo() {
        const testName = 'Signal Generation with Demo Data';
        try {
            // Check if indicators work with demo data
            const response = await axios.get(`${BASE_URL}/api/indicators/NIFTY/5m`);
            const indicators = response.data.indicators;

            this.assert(indicators.vwap > 0, 'VWAP should be calculated with demo data');
            this.assert(indicators.ema9 > 0, 'EMA9 should be calculated with demo data');
            this.assert(indicators.rsi >= 0 && indicators.rsi <= 100, 'RSI should be in valid range with demo data');

            this.recordTest('demoMode', testName, true);
            console.log('✅', testName);
        } catch (error) {
            this.recordTest('demoMode', testName, false, error.message);
            console.log('❌', testName, ':', error.message);
        }
    }

    assert(condition, message) {
        if (!condition) {
            throw new Error(message);
        }
    }

    recordTest(mode, testName, passed, error = null) {
        this.results[mode].tests.push({
            name: testName,
            passed,
            error
        });

        if (passed) {
            this.results[mode].passed++;
        } else {
            this.results[mode].failed++;
        }
    }

    generateReport() {
        console.log('\n' + '='.repeat(60));
        console.log('📋 TEST RESULTS SUMMARY');
        console.log('='.repeat(60));

        // Live Mode Results
        console.log('\n📊 LIVE MODE RESULTS:');
        console.log(`✅ Passed: ${this.results.liveMode.passed}`);
        console.log(`❌ Failed: ${this.results.liveMode.failed}`);

        if (this.results.liveMode.failed > 0) {
            console.log('\nFailed Live Mode Tests:');
            this.results.liveMode.tests
                .filter(test => !test.passed)
                .forEach(test => console.log(`  ❌ ${test.name}: ${test.error}`));
        }

        // Demo Mode Results
        console.log('\n🎭 DEMO MODE RESULTS:');
        console.log(`✅ Passed: ${this.results.demoMode.passed}`);
        console.log(`❌ Failed: ${this.results.demoMode.failed}`);

        if (this.results.demoMode.failed > 0) {
            console.log('\nFailed Demo Mode Tests:');
            this.results.demoMode.tests
                .filter(test => !test.passed)
                .forEach(test => console.log(`  ❌ ${test.name}: ${test.error}`));
        }

        // Overall Results
        const totalPassed = this.results.liveMode.passed + this.results.demoMode.passed;
        const totalFailed = this.results.liveMode.failed + this.results.demoMode.failed;
        const totalTests = totalPassed + totalFailed;

        console.log('\n🏆 OVERALL RESULTS:');
        console.log(`Total Tests: ${totalTests}`);
        console.log(`✅ Passed: ${totalPassed}`);
        console.log(`❌ Failed: ${totalFailed}`);
        console.log(`Success Rate: ${((totalPassed / totalTests) * 100).toFixed(1)}%`);

        if (totalFailed === 0) {
            console.log('\n🎉 ALL TESTS PASSED! Both Live and Demo modes are working correctly.');
        } else {
            console.log('\n⚠️  SOME TESTS FAILED! Please review and fix the issues above.');
            process.exit(1);
        }
    }

    async cleanup() {
        await this.stopServer();
        console.log('\n🧹 Cleanup completed');
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Run the test suite
if (require.main === module) {
    const testSuite = new ModeTestSuite();
    testSuite.runAllTests().catch(error => {
        console.error('❌ Test suite crashed:', error);
        process.exit(1);
    });
}

module.exports = ModeTestSuite;