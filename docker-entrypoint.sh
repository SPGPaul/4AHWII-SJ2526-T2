#!/bin/sh
set -e

# Start Ollama server in background
ollama serve &
SERVE_PID=$!

# Wait until server is reachable (30 retries, 1 sec each)
RETRIES=30
until nc -z localhost 11434 || [ $RETRIES -le 0 ]; do
  sleep 1
  RETRIES=$((RETRIES-1))
done

# Optional: pull a default model
# ollama pull qwen3:0.6b || true

# Keep container running
wait $SERVE_PID