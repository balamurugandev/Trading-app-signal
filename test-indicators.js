#!/usr/bin/env node

const DataProvider = require('./server/services/dataProvider');
const TechnicalAnalysis = require('./server/services/technicalAnalysis');

async function testIndicators() {
    console.log('🧪 Testing Technical Indicators with Real Data');
    console.log('==============================================\n');

    const dataProvider = new DataProvider();
    const technicalAnalysis = new TechnicalAnalysis();

    try {
        // Initialize live data
        await dataProvider.initializeLiveData();

        console.log('📊 Fetching NIFTY 5m data...');
        const data = await dataProvider.getLatestData('NIFTY', '5m');

        if (!data || data.length === 0) {
            console.log('❌ No data available');
            return;
        }

        console.log(`✅ Got ${data.length} data points`);
        console.log('Latest candle:', {
            timestamp: data[data.length - 1].timestamp,
            close: data[data.length - 1].close,
            volume: data[data.length - 1].volume
        });

        console.log('\n📈 Calculating technical indicators...');
        const indicators = technicalAnalysis.calculateIndicators(data);

        console.log('\n📊 Current Technical Indicators:');
        console.log('================================');

        if (indicators.vwap && indicators.vwap.length > 0) {
            console.log(`VWAP: ${indicators.vwap.slice(-1)[0].toFixed(2)}`);
        }

        if (indicators.ema9 && indicators.ema9.length > 0) {
            console.log(`EMA 9: ${indicators.ema9.slice(-1)[0].toFixed(2)}`);
        }

        if (indicators.ema21 && indicators.ema21.length > 0) {
            console.log(`EMA 21: ${indicators.ema21.slice(-1)[0].toFixed(2)}`);
        }

        if (indicators.rsi && indicators.rsi.length > 0) {
            console.log(`RSI: ${indicators.rsi.slice(-1)[0].toFixed(2)}`);
        }

        if (indicators.macd && indicators.macd.length > 0) {
            const macd = indicators.macd.slice(-1)[0];
            console.log(`MACD: Line=${macd.line?.toFixed(2)}, Signal=${macd.signal?.toFixed(2)}, Histogram=${macd.histogram?.toFixed(2)}`);
        }

        if (indicators.bb && indicators.bb.length > 0) {
            const bb = indicators.bb.slice(-1)[0];
            console.log(`Bollinger Bands: Upper=${bb.upper?.toFixed(2)}, Middle=${bb.middle?.toFixed(2)}, Lower=${bb.lower?.toFixed(2)}`);
        }

        if (indicators.cpr) {
            console.log(`CPR: Pivot=${indicators.cpr.pivot?.toFixed(2)}, R1=${indicators.cpr.r1?.toFixed(2)}, S1=${indicators.cpr.s1?.toFixed(2)}`);
        }

        console.log('\n✅ Technical indicators calculated successfully!');
        console.log('📝 These values should remain static when market is closed');
        console.log('🔴 These values should update during market hours (9:15 AM - 3:30 PM IST)');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await dataProvider.cleanup();
    }
}

testIndicators();