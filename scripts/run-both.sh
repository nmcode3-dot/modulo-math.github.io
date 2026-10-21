#!/bin/bash
# Runs two scraping tracks in parallel:
#   1. amc8 -> amc10 -> amc12: backfill on-page solutions + fill gaps
#   2. aime: finish remaining years + backfill solutions
# Both retry on failure and re-tag topics after each contest.
cd /dev-server
track_main() {
  for c in amc8 amc10 amc12; do
    for i in $(seq 1 60); do
      echo "[$(date -u +%H:%M)] $c attempt $i" >> /tmp/scrape-sol.log
      if bun run scripts/scrape.ts --contest "$c" --skip 2025 >> "/tmp/scrape-sol-$c.log" 2>&1; then break; fi
      sleep 30
    done
    bun run scripts/r.ts >> /tmp/scrape-sol.log 2>&1
  done
  echo "[$(date -u +%H:%M)] MAIN DONE" >> /tmp/scrape-sol.log
}
track_aime() {
  for i in $(seq 1 60); do
    echo "[$(date -u +%H:%M)] aime attempt $i" >> /tmp/scrape-sol.log
    if bun run scripts/scrape.ts --contest aime --skip 2025 >> "/tmp/scrape-sol-aime.log" 2>&1; then break; fi
    sleep 30
  done
  bun run scripts/r.ts >> /tmp/scrape-sol.log 2>&1
  echo "[$(date -u +%H:%M)] AIME DONE" >> /tmp/scrape-sol.log
}
track_main &
P1=$!
track_aime &
P2=$!
wait $P1 $P2
echo "[$(date -u +%H:%M)] ALL DONE" >> /tmp/scrape-sol.log
