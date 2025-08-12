#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting NSE Trading App...');
console.log('📊 Live Data Mode: Enabled');
console.log('⚡ Real-time Signal Generation: Active');
console.log('=' .repeat(50));

// Start the server with live data
const serverProcess = spawn('node', ['server/index.js'], {
  stdio: 'inherit',
  env: { ...process.env, LIVE_DATA: 'true' }
});

// Start the client
const clientProcess = spawn('npm', ['start'], {
  stdio: 'inherit',
  cwd: path.join(__dirname, 'client')
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down NSE Trading App...');
  serverProcess.kill();
  clientProcess.kill();
  process.exit(0);
});

serverProcess.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
  clientProcess.kill();
});

clientProcess.on('close', (code) => {
  console.log(`Client process exited with code ${code}`);
  serverProcess.kill();
});