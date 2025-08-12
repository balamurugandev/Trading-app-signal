#!/usr/bin/env node

const io = require('socket.io-client');

console.log('🎯 TESTING SIGNAL RECEPTION FROM SERVER');
console.log('Connecting to WebSocket and listening for signals...');
console.log('=' .repeat(60));

const socket = io('http://localhost:3001', {
  transports: ['websocket', 'polling'],
  timeout: 5000
});

socket.on('connect', () => {
  console.log('✅ Connected to server:', socket.id);
  
  // Subscribe to symbols
  socket.emit('subscribeSymbol', 'NIFTY');
  socket.emit('subscribeSymbol', 'BANKNIFTY');
  console.log('📡 Subscribed to NIFTY and BANKNIFTY');
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from server');
});

socket.on('connect_error', (error) => {
  console.log('❌ Connection error:', error.message);
});

// Listen for signals
socket.on('newSignal', (signalData) => {
  console.log('\\n🚨 SIGNAL RECEIVED:');
  console.log('Symbol:', signalData.symbol);
  console.log('Timeframe:', signalData.timeframe);
  console.log('Type:', signalData.signal.type);
  console.log('Entry Price:', signalData.signal.entryPrice);
  console.log('Stop Loss:', signalData.signal.stopLoss);
  console.log('Target 1:', signalData.signal.target1);
  console.log('Strength:', signalData.signal.strength + '%');
  console.log('Timestamp:', signalData.timestamp);
  console.log('Is Live:', signalData.isLive);
  console.log('-'.repeat(50));
});

// Listen for market status
socket.on('marketStatus', (status) => {
  console.log('📊 Market Status Update:');
  console.log('  Open:', status.isOpen);
  console.log('  Liquid Window:', status.isLiquidWindow);
  console.log('  Session:', status.session);
});

// Keep the connection alive and monitor for 60 seconds
console.log('⏱️  Monitoring for signals for 60 seconds...');
setTimeout(() => {
  console.log('\\n⏰ Test completed. Disconnecting...');
  socket.disconnect();
  process.exit(0);
}, 60000);

// Handle process termination
process.on('SIGINT', () => {
  console.log('\\n👋 Terminating test...');
  socket.disconnect();
  process.exit(0);
});