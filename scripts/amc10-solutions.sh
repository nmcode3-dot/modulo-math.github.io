#!/bin/bash
cd /dev-server
for i in $(seq 1 60); do
  bun run scripts/scrape.ts --contest amc10 --solutions-only >> /tmp/scrape-sol-amc10.log 2>&1 && break
  sleep 30
done
