#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const path = require('path');

console.log('🚀 NSE Trading App - Reliable Startup');
console.log('=====================================\n');

let serverProcess = null;
let clientProcess = null;

// Kill all existing processes
function cleanup() {
    console.log('🧹 Cleaning up all processes...');
    
    return new Promise((resolve) => {
        exec('pkill -f "node server" && pkill -f "vite" && lsof -ti:3001 | xargs kill -9 && lsof -ti:5173 | xargs kill -9', 
        { timeout: 5000 }, 
        (error) => {
            // Ignore errors - processes might not exist
            console.log('✅ Cleanup completed');
            setTimeout(resolve, 2000); // Wait 2 seconds
        });
    });
}

// Start server
function startServer() {
    console.log('🖥️  Starting server...');
    
    return new Promise((resolve, reject) => {
        serverProcess = spawn('node', ['server/index.js'], {
            env: { ...process.env, LIVE_DATA: 'true', PORT: '3001' },
            stdio: 'inherit'
        });

        serverProcess.on('error', (error) => {
            console.error('❌ Server failed to start:', error.message);
            reject(error);
        });

        // Give server time to start
        setTimeout(() => {
            console.log('✅ Server should be running on http://localhost:3001');
            resolve();
        }, 5000);
    });
}

// Start client
function startClient() {
    console.log('🌐 Starting client...');
    
    return new Promise((resolve, reject) => {
        clientProcess = spawn('npm', ['start'], {
            cwd: path.join(__dirname, 'client'),
            stdio: 'inherit'
        });

        clientProcess.on('error', (error) => {
            console.error('❌ Client failed to start:', error.message);
            reject(error);
        });

        // Give client time to start
        setTimeout(() => {
            console.log('✅ Client should be running on http://localhost:5173');
            resolve();
        }, 10000);
    });
}

// Main function
async function start() {
    try {
        await cleanup();
        await startServer();
        await startClient();
        
        console.log('\n🎉 APPLICATION STARTED!');
        console.log('======================');
        console.log('📊 Server: http://localhost:3001');
        console.log('🌐 Client: http://localhost:5173');
        console.log('\n🎯 Open http://localhost:5173 in your browser');
        console.log('⏹️  Press Ctrl+C to stop\n');
        
        // Keep running
        process.stdin.resume();
        
    } catch (error) {
        console.error('❌ Startup failed:', error.message);
        process.exit(1);
    }
}

// Handle shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down...');
    if (serverProcess) serverProcess.kill();
    if (clientProcess) clientProcess.kill();
    process.exit(0);
});

// Start the app
start();