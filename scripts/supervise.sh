#!/bin/bash
# Runs the scraper contest by contest, skipping years already saved (--resume),
# retrying on failure, and re-tagging topics after each contest.
cd /dev-server
CONTESTS="${*:-amc10 amc12 aime}"
for c in $CONTESTS; do
  for i in $(seq 1 60); do
    echo "[$(date -u +%H:%M)] $c attempt $i" >> /tmp/supervise.log
    if bun run scripts/scrape.ts --contest "$c" --resume --skip 2025 >> "/tmp/scrape-$c.log" 2>&1; then break; fi
    sleep 30
  done
  bun run scripts/r.ts >> /tmp/supervise.log 2>&1
done
echo "[$(date -u +%H:%M)] ALL DONE" >> /tmp/supervise.log
