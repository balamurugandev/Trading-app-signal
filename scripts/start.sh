#!/bin/bash

echo "🚀 NSE Trading App - One-Click Startup"
echo "======================================"

# Make sure we're in the right directory
cd "$(dirname "$0")"

# Kill any existing processes
echo "🧹 Cleaning up existing processes..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
pkill -f "node server" 2>/dev/null || true

# Wait a moment for cleanup
sleep 2

# Start the application
echo "🚀 Starting application..."
node start-app.js