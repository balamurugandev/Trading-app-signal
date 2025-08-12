#!/usr/bin/env node

const moment = require('moment-timezone');

function testMarketStatus() {
    console.log('🧪 Testing Market Status Logic');
    console.log('==============================\n');
    
    const now = moment().tz('Asia/Kolkata');
    const day = now.day();
    const time = now.format('HH:mm');
    const hour = now.hour();
    const minute = now.minute();
    
    console.log(`Current IST Time: ${now.format('YYYY-MM-DD HH:mm:ss')}`);
    console.log(`Day of week: ${day} (0=Sunday, 6=Saturday)`);
    console.log(`Time: ${time}`);
    console.log('');
    
    // Market status checks
    const isWeekend = day === 0 || day === 6;
    const isMarketHours = (hour > 9 || (hour === 9 && minute >= 15)) && 
                         (hour < 15 || (hour === 15 && minute <= 30));
    const isLiquidWindow = ((hour > 9 || (hour === 9 && minute >= 25)) && hour < 11) || 
                          ((hour > 13 || (hour === 13 && minute >= 45)) && 
                           (hour < 15 || (hour === 15 && minute <= 5)));
    
    console.log('Market Status:');
    console.log(`  Weekend: ${isWeekend ? '❌' : '✅'}`);
    console.log(`  Market Hours (9:15-15:30): ${isMarketHours ? '✅' : '❌'}`);
    console.log(`  Liquid Window: ${isLiquidWindow ? '✅' : '❌'}`);
    console.log('');
    
    // Data source determination
    const shouldShowLive = !isWeekend && isMarketHours;
    const shouldGenerateSignals = !isWeekend && isMarketHours && isLiquidWindow;
    
    console.log('Expected Behavior:');
    console.log(`  Data Source: ${shouldShowLive ? '🔴 LIVE' : '🟡 LAST CLOSE'}`);
    console.log(`  Signal Generation: ${shouldGenerateSignals ? '✅ ACTIVE' : '❌ DISABLED'}`);
    console.log(`  Ticker Updates: ${shouldShowLive ? '✅ RUNNING' : '❌ STATIC'}`);
    console.log('');
    
    // Next market open calculation
    let nextOpen = moment().tz('Asia/Kolkata');
    if (isWeekend || !isMarketHours) {
        if (hour < 9 || (hour === 9 && minute < 15)) {
            // Same day opening
            nextOpen.hour(9).minute(15).second(0).millisecond(0);
        } else {
            // Next day opening
            nextOpen.add(1, 'day').hour(9).minute(15).second(0).millisecond(0);
            // Skip weekends
            if (nextOpen.day() === 6) nextOpen.add(2, 'days');
            if (nextOpen.day() === 0) nextOpen.add(1, 'day');
        }
        
        const timeUntil = moment.duration(nextOpen.diff(now));
        const days = Math.floor(timeUntil.asDays());
        const hours = timeUntil.hours();
        const minutes = timeUntil.minutes();
        
        console.log('Next Market Open:');
        console.log(`  Date: ${nextOpen.format('YYYY-MM-DD HH:mm:ss')}`);
        if (days > 0) {
            console.log(`  Time Until: ${days}d ${hours}h ${minutes}m`);
        } else if (hours > 0) {
            console.log(`  Time Until: ${hours}h ${minutes}m`);
        } else {
            console.log(`  Time Until: ${minutes}m`);
        }
    } else {
        console.log('Market is currently OPEN! 🎉');
    }
}

testMarketStatus();