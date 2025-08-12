#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const path = require('path');

console.log('🚀 Starting NSE Trading App with Live Data...\n');

// Kill any existing processes
console.log('🧹 Cleaning up existing processes...');
exec('pkill -f "node server" && pkill -f "vite"', (error) => {
    if (error && !error.message.includes('No matching processes')) {
        console.log('Note: Some processes may not have been running');
    }
    
    setTimeout(() => {
        startServer();
    }, 2000);
});

function startServer() {
    console.log('🖥️  Starting server with live data...');
    
    const server = spawn('node', ['server/index.js'], {
        env: { ...process.env, LIVE_DATA: 'true', PORT: '3001' },
        stdio: 'pipe'
    });
    
    server.stdout.on('data', (data) => {
        process.stdout.write(`[SERVER] ${data}`);
    });
    
    server.stderr.on('data', (data) => {
        process.stderr.write(`[SERVER ERROR] ${data}`);
    });
    
    // Wait for server to start, then start client
    setTimeout(() => {
        startClient();
    }, 5000);
}

function startClient() {
    console.log('🌐 Starting client...');
    
    const client = spawn('npm', ['start'], {
        cwd: path.join(__dirname, 'client'),
        stdio: 'pipe'
    });
    
    client.stdout.on('data', (data) => {
        process.stdout.write(`[CLIENT] ${data}`);
    });
    
    client.stderr.on('data', (data) => {
        process.stderr.write(`[CLIENT ERROR] ${data}`);
    });
    
    console.log('\n✅ Both server and client are starting...');
    console.log('📊 Server: http://localhost:3001');
    console.log('🌐 Client: http://localhost:5173');
    console.log('\n🎯 Once both are running:');
    console.log('1. Open http://localhost:5173 in your browser');
    console.log('2. Look for green "Connected" indicator');
    console.log('3. Click "Live (Yahoo)" button');
    console.log('\n⏹️  Press Ctrl+C to stop both processes');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down...');
    exec('pkill -f "node server" && pkill -f "vite"', () => {
        process.exit(0);
    });
});