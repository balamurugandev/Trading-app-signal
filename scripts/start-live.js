#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting NSE Scalping Signals with Live Data (Yahoo Finance)');
console.log('📡 Live data mode: ENABLED');
console.log('💰 Cost: FREE (Yahoo Finance)');
console.log('⏱️  Update frequency: 5 seconds');
console.log('📊 Symbols: NIFTY, BANKNIFTY');
console.log('');

// Set environment variables
process.env.LIVE_DATA = 'true';
process.env.NODE_ENV = 'production';

// Start the server
const server = spawn('node', ['server/index.js'], {
  stdio: 'inherit',
  env: { ...process.env }
});

server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
});

server.on('error', (error) => {
  console.error('Failed to start server:', error);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  server.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down gracefully...');
  server.kill('SIGTERM');
  process.exit(0);
});