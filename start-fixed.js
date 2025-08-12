#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const path = require('path');

console.log('🚀 NSE Trading App - Fixed Startup');
console.log('==================================\n');

// Clean up first
console.log('🧹 Cleaning up processes...');
exec('pkill -f "node server" 2>/dev/null; pkill -f "vite" 2>/dev/null; lsof -ti:3001 | xargs kill -9 2>/dev/null; lsof -ti:5173 | xargs kill -9 2>/dev/null', () => {
    setTimeout(startApp, 3000);
});

function startApp() {
    console.log('🖥️  Starting server...');
    
    // Start server
    const server = spawn('node', ['server/index.js'], {
        env: { ...process.env, LIVE_DATA: 'true', PORT: '3001' },
        stdio: 'inherit'
    });

    // Wait for server to start, then start client
    setTimeout(() => {
        console.log('🌐 Starting client...');
        
        const client = spawn('npm', ['start'], {
            cwd: path.join(__dirname, 'client'),
            stdio: 'inherit'
        });

        // Open browser after client starts
        setTimeout(() => {
            console.log('\n🎉 APPLICATION READY!');
            console.log('📊 Server: http://localhost:3001');
            console.log('🌐 Client: http://localhost:5173');
            console.log('\n🌐 Opening browser...');
            
            const openCmd = process.platform === 'darwin' ? 'open' : 
                           process.platform === 'win32' ? 'start' : 'xdg-open';
            exec(`${openCmd} http://localhost:5173`);
            
            console.log('\n✅ Ready to test live data toggle!');
            console.log('⏹️  Press Ctrl+C to stop\n');
        }, 15000);

    }, 8000);

    // Handle shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down...');
        server.kill();
        exec('pkill -f "vite"');
        process.exit(0);
    });
}