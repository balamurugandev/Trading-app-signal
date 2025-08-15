#!/usr/bin/env node

/**
 * Restart Server with Live Data Script
 * 
 * This script ensures the server is running with live market data enabled
 */

const { spawn } = require('child_process');
const axios = require('axios');

async function checkServerStatus() {
    try {
        const response = await axios.get('http://localhost:3001/api/health');
        return response.status === 200;
    } catch (error) {
        return false;
    }
}

async function waitForServer(maxWait = 30000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWait) {
        if (await checkServerStatus()) {
            return true;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
        process.stdout.write('.');
    }
    
    return false;
}

async function main() {
    console.log('🔄 Restarting server with live market data...\n');
    
    // Set environment variable
    process.env.LIVE_DATA = 'true';
    console.log('✅ Environment variable LIVE_DATA set to true');
    
    // Kill any existing server process (if running)
    console.log('🛑 Stopping any existing server...');
    
    // Start the server
    console.log('🚀 Starting server with live data...');
    
    const serverProcess = spawn('node', ['server/index.js'], {
        env: { ...process.env, LIVE_DATA: 'true' },
        stdio: 'inherit'
    });
    
    // Wait a bit for server to start
    console.log('⏳ Waiting for server to start');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if server is running
    if (await checkServerStatus()) {
        console.log('\n✅ Server is running!');
        
        // Test the data status
        try {
            const response = await axios.get('http://localhost:3001/api/data-status');
            const status = response.data;
            
            console.log('\n📊 Data Provider Status:');
            console.log(`- Live Mode: ${status.isLiveMode ? '✅ ENABLED' : '❌ DISABLED'}`);
            console.log(`- Demo Mode: ${status.isDemoMode ? '⚠️  YES' : '✅ NO'}`);
            console.log(`- Provider: ${status.providerStatus}`);
            
            if (status.isLiveMode && !status.isDemoMode) {
                console.log('\n🎉 SUCCESS: Server is running with LIVE market data!');
                console.log('\n📋 Next steps:');
                console.log('1. Open http://localhost:5173 in your browser');
                console.log('2. Run: node test-market-data.js to validate');
                console.log('3. Check the dashboard for real market prices');
            } else {
                console.log('\n⚠️  WARNING: Server is still in demo mode');
                console.log('Try running: curl -X POST http://localhost:3001/api/enable-live-data');
            }
            
        } catch (error) {
            console.log('\n❌ Could not check data status:', error.message);
        }
        
    } else {
        console.log('\n❌ Server failed to start properly');
        serverProcess.kill();
        process.exit(1);
    }
    
    // Keep the process running
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down server...');
        serverProcess.kill();
        process.exit(0);
    });
}

main().catch(error => {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
});