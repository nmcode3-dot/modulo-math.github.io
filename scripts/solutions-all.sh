#!/bin/bash
# Solution-focused backfill: all four contests in parallel (each writes only its own file),
# retrying on failure. Topics are re-sorted once at the end so no two writers touch the same file.
cd /dev-server
track() {
  for i in $(seq 1 60); do
    echo "[$(date -u +%H:%M)] $1 attempt $i" >> /tmp/scrape-sol.log
    if bun run scripts/scrape.ts --contest "$1" --skip 2025 >> "/tmp/scrape-sol-$1.log" 2>&1; then break; fi
    sleep 30
  done
  echo "[$(date -u +%H:%M)] $1 DONE" >> /tmp/scrape-sol.log
}
for c in amc8 amc10 amc12 aime; do track "$c" & done
wait
bun run scripts/r.ts >> /tmp/scrape-sol.log 2>&1
echo "[$(date -u +%H:%M)] ALL DONE + RETAGGED" >> /tmp/scrape-sol.log
