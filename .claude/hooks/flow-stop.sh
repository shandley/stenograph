#!/bin/bash
# flow-stop.sh - Fires when Claude finishes responding
# Signals end of command sequence to steno-flow

# Read JSON from stdin
input=$(cat)

# Extract fields
session_id=$(echo "$input" | jq -r '.session_id // ""')

# Send to flow server (silent, non-blocking)
curl -s -m 1 -X POST http://localhost:3847/event \
  -H "Content-Type: application/json" \
  -d "{
    \"type\": \"stop\",
    \"session_id\": \"$session_id\",
    \"ts\": $(date +%s)000
  }" 2>/dev/null &

# Always exit 0
exit 0
