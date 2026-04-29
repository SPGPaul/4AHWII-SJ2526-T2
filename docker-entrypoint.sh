#!/bin/sh
# Start Ollama server in background
ollama serve &
SERVE_PID=$!

# Warten bis Server erreichbar (einfacher Port-Check)
RETRIES=30
until nc -z localhost 11434 || [ $RETRIES -le 0 ]; do
  sleep 1
  RETRIES=$((RETRIES-1))
done

# Pull und start register Modell (ersetzt ggf. mit korrektem ollama CLI-Befehl)
#ollama pull qwen3:0.6b || true

# optional: ensure model is available via API (depends on ollama CLI)
ollama run minicpm-v &

wait $SERVE_PID