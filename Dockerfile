FROM ollama/ollama:latest
RUN apt-get update && apt-get install -y netcat-openbsd && rm -rf /var/lib/apt/lists/*

RUN printf '#!/bin/sh\nset -e\nollama serve &\nSERVE_PID=$!\nRETRIES=30\nuntil nc -z localhost 11434 || [ $RETRIES -le 0 ]; do\n  sleep 1\n  RETRIES=$((RETRIES-1))\ndone\nwait $SERVE_PID\n' > /usr/local/bin/docker-entrypoint.sh && chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]