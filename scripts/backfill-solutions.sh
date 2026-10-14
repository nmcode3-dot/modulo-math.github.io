#!/bin/bash
cd /dev-server
for c in amc8 amc10 amc12 aime; do
  for i in 1 2 3; do
    bun run scripts/scrape.ts --contest $c --skip 2025 >> "/tmp/scrape-sol-$c.log" 2>&1 && break
    sleep 20
  done
  bun run scripts/r.ts >> /tmp/scrape-sol.log 2>&1
done
echo DONE >> /tmp/scrape-sol.log
