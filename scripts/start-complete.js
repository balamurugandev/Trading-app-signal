#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const path = require('path');

console.log('🚀 NSE Trading App - Complete Startup');
console.log('====================================\n');

// Kill all processes first
console.log('🧹 Cleaning up existing processes...');
exec('pkill -f "node server" 2>/dev/null; pkill -f "vite" 2>/dev/null; lsof -ti:3001 | xargs kill -9 2>/dev/null; lsof -ti:5173 | xargs kill -9 2>/dev/null', () => {
    console.log('✅ Cleanup completed\n');
    
    setTimeout(() => {
        startServer();
    }, 2000);
});

function startServer() {
    console.log('🖥️  Starting server with live data...');
    
    const server = spawn('node', ['--no-deprecation', 'server/index.js'], {
        env: { ...process.env, LIVE_DATA: 'true', PORT: '3001' },
        stdio: 'pipe'
    });

    server.stdout.on('data', (data) => {
        const output = data.toString();
        console.log(`[SERVER] ${output.trim()}`);
        
        // When server is ready, start client
        if (output.includes('Server running on port') || output.includes('Yahoo Finance provider started')) {
            setTimeout(() => {
                startClient();
            }, 2000);
        }
    });

    server.stderr.on('data', (data) => {
        console.log(`[SERVER ERROR] ${data.toString().trim()}`);
    });
}

function startClient() {
    console.log('🌐 Starting client...');
    
    const client = spawn('npm', ['start'], {
        cwd: path.join(__dirname, 'client'),
        stdio: 'pipe'
    });

    client.stdout.on('data', (data) => {
        const output = data.toString();
        console.log(`[CLIENT] ${output.trim()}`);
        
        // When client is ready, open browser
        if (output.includes('Local:') && output.includes('5173')) {
            setTimeout(() => {
                openBrowser();
            }, 3000);
        }
    });

    client.stderr.on('data', (data) => {
        const error = data.toString();
        if (!error.includes('experimental') && !error.includes('warning')) {
            console.log(`[CLIENT ERROR] ${error.trim()}`);
        }
    });
}

function openBrowser() {
    console.log('\n🎉 APPLICATION READY!');
    console.log('====================');
    console.log('📊 Server: http://localhost:3001 (API)');
    console.log('🌐 Client: http://localhost:5173 (Web App)');
    console.log('\n🌐 Opening browser...');
    
    // Open the correct URL (client, not server)
    const command = process.platform === 'darwin' ? 'open' : 
                   process.platform === 'win32' ? 'start' : 'xdg-open';
    
    exec(`${command} http://localhost:5173`, (error) => {
        if (error) {
            console.log('❌ Could not open browser automatically');
            console.log('🎯 Please manually open: http://localhost:5173');
        } else {
            console.log('✅ Browser opened successfully!');
        }
    });
    
    console.log('\n✅ Live data is enabled');
    console.log('✅ Both server and client are running');
    console.log('✅ Ready to use live data toggle!');
    console.log('\n⏹️  Press Ctrl+C to stop both processes');
}

// Handle shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down...');
    exec('pkill -f "node server" && pkill -f "vite"', () => {
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    exec('pkill -f "node server" && pkill -f "vite"', () => {
        process.exit(0);
    });
});