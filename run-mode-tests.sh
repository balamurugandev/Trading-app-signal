#!/bin/bash

echo "🧪 Running Live Mode vs Demo Mode Test Suite"
echo "=============================================="

# Kill any existing server processes
pkill -f "node server/index.js" 2>/dev/null || true
sleep 2

# Run the comprehensive test suite
node test-live-demo-modes.js

echo ""
echo "✅ Mode testing completed!"
echo ""
echo "💡 Usage:"
echo "  - For live mode: LIVE_DATA=true node server/index.js"
echo "  - For demo mode: node server/index.js"
echo "  - Quick live start: node start-live-mode.js"