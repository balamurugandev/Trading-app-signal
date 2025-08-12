#!/usr/bin/env node

// Start the server with live data enabled
process.env.LIVE_DATA = 'true';

console.log('🚀 Starting server with LIVE DATA enabled...');
console.log('📊 Yahoo Finance integration: ACTIVE');
console.log('💹 Real-time market data: ENABLED');

// Start the server
require('./server/index.js');