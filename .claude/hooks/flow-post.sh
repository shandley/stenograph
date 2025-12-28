#!/bin/bash
# flow-post.sh - Fires after each tool execution completes
# Sends completion event to steno-flow WebSocket server

# Read JSON from stdin
input=$(cat)

# Extract fields
tool=$(echo "$input" | jq -r '.tool_name // "unknown"')
session_id=$(echo "$input" | jq -r '.session_id // ""')

# Extract target based on tool type
case "$tool" in
  Read)
    target=$(echo "$input" | jq -r '.tool_input.file_path // ""')
    ;;
  Write)
    target=$(echo "$input" | jq -r '.tool_input.file_path // ""')
    ;;
  Edit)
    target=$(echo "$input" | jq -r '.tool_input.file_path // ""')
    ;;
  Glob)
    target=$(echo "$input" | jq -r '.tool_input.pattern // ""')
    ;;
  Grep)
    target=$(echo "$input" | jq -r '.tool_input.pattern // ""')
    ;;
  Bash)
    target=$(echo "$input" | jq -r '.tool_input.command // ""' | head -c 50)
    ;;
  Task)
    target=$(echo "$input" | jq -r '.tool_input.description // ""')
    ;;
  *)
    target=$(echo "$input" | jq -r '.tool_input | keys[0] // ""')
    ;;
esac

# Check if tool succeeded (response exists and isn't an error)
success="true"
if echo "$input" | jq -e '.tool_response | type == "object" and .error' >/dev/null 2>&1; then
  success="false"
fi

# Send to flow server (silent, non-blocking)
curl -s -m 1 -X POST http://localhost:3847/event \
  -H "Content-Type: application/json" \
  -d "{
    \"type\": \"post\",
    \"tool\": \"$tool\",
    \"target\": \"$target\",
    \"success\": $success,
    \"session_id\": \"$session_id\",
    \"ts\": $(date +%s)000
  }" 2>/dev/null &

# Always exit 0 so we don't block Claude
exit 0
