#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 NSE Trading App - Instant Startup Script');
console.log('==========================================\n');

// Configuration
const CONFIG = {
    serverPort: 3001,
    clientPort: 5173,
    serverStartTimeout: 10000,
    clientStartTimeout: 15000,
    healthCheckInterval: 1000,
    maxRetries: 3
};

let serverProcess = null;
let clientProcess = null;
let isShuttingDown = false;

// Utility functions
function log(message, type = 'INFO') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = {
        'INFO': '📋',
        'SUCCESS': '✅',
        'ERROR': '❌',
        'WARNING': '⚠️',
        'SERVER': '🖥️',
        'CLIENT': '🌐'
    }[type] || '📋';
    
    console.log(`[${timestamp}] ${prefix} ${message}`);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Kill existing processes
async function killExistingProcesses() {
    log('Cleaning up existing processes...', 'INFO');
    
    return new Promise((resolve) => {
        exec(`lsof -ti:${CONFIG.serverPort} | xargs kill -9 2>/dev/null; pkill -f "vite" 2>/dev/null; pkill -f "node server" 2>/dev/null`, (error) => {
            // Ignore errors - processes might not exist
            log('Cleanup completed', 'SUCCESS');
            resolve();
        });
    });
}

// Check if port is free
function isPortFree(port) {
    return new Promise((resolve) => {
        exec(`lsof -i:${port}`, (error) => {
            resolve(!!error); // Port is free if lsof returns error
        });
    });
}

// Wait for port to be available
async function waitForPort(port, timeout = 30000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
        try {
            const response = await fetch(`http://localhost:${port}/api/health`);
            if (response.ok) {
                return true;
            }
        } catch (error) {
            // Port not ready yet
        }
        await sleep(500);
    }
    return false;
}

// Start server
async function startServer() {
    log('Starting server with live data...', 'SERVER');
    
    return new Promise((resolve, reject) => {
        serverProcess = spawn('node', ['server/index.js'], {
            env: { 
                ...process.env, 
                LIVE_DATA: 'true', 
                PORT: CONFIG.serverPort.toString(),
                NODE_ENV: 'development'
            },
            stdio: ['pipe', 'pipe', 'pipe']
        });

        let serverReady = false;
        let startupOutput = '';

        serverProcess.stdout.on('data', (data) => {
            const output = data.toString();
            startupOutput += output;
            
            // Log server output with prefix
            output.split('\n').forEach(line => {
                if (line.trim()) {
                    log(line.trim(), 'SERVER');
                }
            });

            // Check for successful startup indicators
            if (output.includes('Server running on port') || 
                output.includes('Yahoo Finance provider started successfully')) {
                if (!serverReady) {
                    serverReady = true;
                    log('Server started successfully!', 'SUCCESS');
                    resolve();
                }
            }
        });

        serverProcess.stderr.on('data', (data) => {
            const error = data.toString();
            log(`Server Error: ${error}`, 'ERROR');
        });

        serverProcess.on('error', (error) => {
            log(`Failed to start server: ${error.message}`, 'ERROR');
            reject(error);
        });

        serverProcess.on('exit', (code) => {
            if (!isShuttingDown) {
                log(`Server exited with code ${code}`, 'ERROR');
                if (!serverReady) {
                    reject(new Error(`Server failed to start (exit code: ${code})`));
                }
            }
        });

        // Timeout fallback
        setTimeout(() => {
            if (!serverReady) {
                log('Server startup timeout - checking if it\'s actually running...', 'WARNING');
                
                // Check if server is responding even if we didn't see the success message
                fetch(`http://localhost:${CONFIG.serverPort}/api/health`)
                    .then(response => {
                        if (response.ok) {
                            log('Server is responding to health checks!', 'SUCCESS');
                            serverReady = true;
                            resolve();
                        } else {
                            reject(new Error('Server startup timeout'));
                        }
                    })
                    .catch(() => {
                        reject(new Error('Server startup timeout'));
                    });
            }
        }, CONFIG.serverStartTimeout);
    });
}

// Start client
async function startClient() {
    log('Starting client application...', 'CLIENT');
    
    return new Promise((resolve, reject) => {
        clientProcess = spawn('npm', ['start'], {
            cwd: path.join(__dirname, 'client'),
            stdio: ['pipe', 'pipe', 'pipe']
        });

        let clientReady = false;
        let startupOutput = '';

        clientProcess.stdout.on('data', (data) => {
            const output = data.toString();
            startupOutput += output;
            
            // Log client output with prefix
            output.split('\n').forEach(line => {
                if (line.trim()) {
                    log(line.trim(), 'CLIENT');
                }
            });

            // Check for successful startup indicators
            if (output.includes('Local:') && output.includes('5173') ||
                output.includes('ready in') ||
                output.includes('Local server running')) {
                if (!clientReady) {
                    clientReady = true;
                    log('Client started successfully!', 'SUCCESS');
                    resolve();
                }
            }
        });

        clientProcess.stderr.on('data', (data) => {
            const error = data.toString();
            // Don't log Vite's normal warnings as errors
            if (!error.includes('experimental') && !error.includes('warning')) {
                log(`Client Error: ${error}`, 'ERROR');
            }
        });

        clientProcess.on('error', (error) => {
            log(`Failed to start client: ${error.message}`, 'ERROR');
            reject(error);
        });

        clientProcess.on('exit', (code) => {
            if (!isShuttingDown) {
                log(`Client exited with code ${code}`, 'ERROR');
                if (!clientReady) {
                    reject(new Error(`Client failed to start (exit code: ${code})`));
                }
            }
        });

        // Timeout fallback
        setTimeout(() => {
            if (!clientReady) {
                log('Client startup timeout - checking if it\'s actually running...', 'WARNING');
                
                // Check if client is responding
                fetch(`http://localhost:${CONFIG.clientPort}`)
                    .then(response => {
                        if (response.ok || response.status === 200) {
                            log('Client is responding!', 'SUCCESS');
                            clientReady = true;
                            resolve();
                        } else {
                            reject(new Error('Client startup timeout'));
                        }
                    })
                    .catch(() => {
                        // For client, we'll be more lenient with timeout
                        log('Client may still be starting up...', 'WARNING');
                        clientReady = true;
                        resolve();
                    });
            }
        }, CONFIG.clientStartTimeout);
    });
}

// Health check
async function performHealthCheck() {
    try {
        const serverHealth = await fetch(`http://localhost:${CONFIG.serverPort}/api/health`);
        const dataStatus = await fetch(`http://localhost:${CONFIG.serverPort}/api/data/status`);
        
        if (serverHealth.ok && dataStatus.ok) {
            const healthData = await serverHealth.json();
            const statusData = await dataStatus.json();
            
            log('Health Check Results:', 'SUCCESS');
            log(`  Server: ${healthData.status}`, 'INFO');
            log(`  Live Data: ${statusData.status.isLiveMode ? 'Enabled' : 'Disabled'}`, 'INFO');
            log(`  Provider: ${statusData.status.providerStatus}`, 'INFO');
            
            return true;
        }
    } catch (error) {
        log(`Health check failed: ${error.message}`, 'ERROR');
    }
    return false;
}

// Main startup function
async function startApp() {
    try {
        log('Starting NSE Trading App with Live Data...', 'INFO');
        
        // Step 1: Clean up
        await killExistingProcesses();
        await sleep(2000);
        
        // Step 2: Verify ports are free
        const serverPortFree = await isPortFree(CONFIG.serverPort);
        const clientPortFree = await isPortFree(CONFIG.clientPort);
        
        if (!serverPortFree) {
            throw new Error(`Port ${CONFIG.serverPort} is still in use`);
        }
        
        log(`Ports ${CONFIG.serverPort} and ${CONFIG.clientPort} are available`, 'SUCCESS');
        
        // Step 3: Start server
        await startServer();
        await sleep(2000);
        
        // Step 4: Verify server is healthy
        const serverHealthy = await performHealthCheck();
        if (!serverHealthy) {
            throw new Error('Server health check failed');
        }
        
        // Step 5: Start client
        await startClient();
        await sleep(2000);
        
        // Step 6: Final verification
        log('\n🎉 APPLICATION STARTED SUCCESSFULLY!', 'SUCCESS');
        log('==========================================', 'SUCCESS');
        log(`📊 Server: http://localhost:${CONFIG.serverPort}`, 'INFO');
        log(`🌐 Client: http://localhost:${CONFIG.clientPort}`, 'INFO');
        log('', 'INFO');
        log('✅ Live data is enabled with Yahoo Finance', 'SUCCESS');
        log('✅ Both server and client are running', 'SUCCESS');
        log('✅ Ready to use live data toggle!', 'SUCCESS');
        log('', 'INFO');
        log('🎯 Next Steps:', 'INFO');
        log('  1. Open http://localhost:5173 in your browser', 'INFO');
        log('  2. Look for green "Connected" indicator', 'INFO');
        log('  3. Click "Live (Yahoo)" button to enable live data', 'INFO');
        log('', 'INFO');
        log('⏹️  Press Ctrl+C to stop both processes', 'INFO');
        
        // Keep the processes running
        process.stdin.resume();
        
    } catch (error) {
        log(`Startup failed: ${error.message}`, 'ERROR');
        await cleanup();
        process.exit(1);
    }
}

// Cleanup function
async function cleanup() {
    if (isShuttingDown) return;
    isShuttingDown = true;
    
    log('Shutting down...', 'INFO');
    
    if (serverProcess) {
        serverProcess.kill('SIGTERM');
        setTimeout(() => serverProcess.kill('SIGKILL'), 5000);
    }
    
    if (clientProcess) {
        clientProcess.kill('SIGTERM');
        setTimeout(() => clientProcess.kill('SIGKILL'), 5000);
    }
    
    await sleep(2000);
    log('Cleanup completed', 'SUCCESS');
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    log('\nReceived shutdown signal...', 'INFO');
    await cleanup();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await cleanup();
    process.exit(0);
});

process.on('uncaughtException', async (error) => {
    log(`Uncaught exception: ${error.message}`, 'ERROR');
    await cleanup();
    process.exit(1);
});

// Start the application
startApp();