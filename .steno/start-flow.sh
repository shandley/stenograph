#!/bin/bash
# Start the steno-flow server
# Usage: .steno/start-flow.sh

cd "$(dirname "$0")/.."

PORT=3847

echo "Starting steno-flow server..."
echo ""

# Check if node is available
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is required but not installed."
    echo "Install it with: brew install node"
    exit 1
fi

# Check if ws module is available (needed for WebSocket server)
if ! node -e "require('ws')" 2>/dev/null; then
    echo "Installing ws module..."
    npm install --no-save ws
fi

# Kill any existing process on the port
if lsof -ti:$PORT > /dev/null 2>&1; then
    echo "Stopping existing server on port $PORT..."
    lsof -ti:$PORT | xargs kill -9 2>/dev/null
    sleep 0.5
fi

# Start the server
node .steno/flow-server.cjs
