const { spawn } = require('child_process');
const path = require('path');

console.log('🔄 Restarting server with simple scalping generator...');

// Kill existing server processes
const { exec } = require('child_process');
exec('pkill -f "node.*server" || true', (error) => {
    if (error) {
        console.log('No existing server processes found');
    } else {
        console.log('✅ Killed existing server processes');
    }
    
    // Wait a moment then start new server
    setTimeout(() => {
        console.log('🚀 Starting server...');
        
        const serverProcess = spawn('npm', ['run', 'dev'], {
            cwd: path.join(__dirname, 'server'),
            stdio: 'inherit',
            shell: true
        });
        
        serverProcess.on('error', (error) => {
            console.error('❌ Failed to start server:', error);
        });
        
        console.log('✅ Server restart initiated');
        console.log('📊 Simple scalping generator is now active');
        console.log('🎯 Expected signals: Realistic spot prices, ITM strikes, proper premiums');
        
    }, 2000);
});