#!/bin/bash
# Quick test script to verify API starts

echo "Testing API startup..."
cd apps/api
timeout 10s pnpm dev &
PID=$!

sleep 5

# Check if process is still running
if ps -p $PID > /dev/null; then
   echo "✅ API started successfully"
   kill $PID
   exit 0
else
   echo "❌ API failed to start"
   exit 1
fi
