#!/usr/bin/env node

const { exec } = require('child_process');

function killServerOnPort(port = 3001) {
    console.log(`🔍 Checking for processes on port ${port}...`);

    exec(`lsof -i :${port}`, (error, stdout, stderr) => {
        if (error) {
            console.log(`✅ Port ${port} is free`);
            return;
        }

        if (stdout) {
            console.log(`📋 Processes found on port ${port}:`);
            console.log(stdout);

            // Extract PIDs from lsof output
            const lines = stdout.split('\n');
            const pids = [];

            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line) {
                    const parts = line.split(/\s+/);
                    if (parts[1] && !isNaN(parts[1])) {
                        pids.push(parts[1]);
                    }
                }
            }

            if (pids.length > 0) {
                console.log(`🔪 Killing processes: ${pids.join(', ')}`);

                pids.forEach(pid => {
                    exec(`kill -9 ${pid}`, (killError) => {
                        if (killError) {
                            console.log(`❌ Failed to kill process ${pid}: ${killError.message}`);
                        } else {
                            console.log(`✅ Killed process ${pid}`);
                        }
                    });
                });

                setTimeout(() => {
                    console.log(`🎉 Port ${port} should now be free!`);
                    console.log(`🚀 You can now start the server with: npm run dev:live`);
                }, 1000);
            }
        }
    });
}

// Get port from command line argument or use default
const port = process.argv[2] || 3001;
killServerOnPort(port);