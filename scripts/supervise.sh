#!/bin/bash
cd /dev-server
for c in amc8 amc10 amc12 aime; do
  for i in $(seq 1 60); do
    echo "[$(date -u +%H:%M)] $c attempt $i" >> /tmp/supervise.log
    if bun run scripts/scrape.ts --contest "$c" >> /tmp/scrape.log 2>&1; then break; fi
    sleep 30
  done
  bun run /tmp/r.ts >> /tmp/supervise.log 2>&1
done
echo "[$(date -u +%H:%M)] ALL DONE" >> /tmp/supervise.log
