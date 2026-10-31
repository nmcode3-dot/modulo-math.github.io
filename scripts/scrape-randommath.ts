/** Local-only AMC 10 solution backfill. No archive, AI, answer keys, or topic changes.
 * bun run scripts/scrape-randommath.ts --limit 5 --dry-run
 * bun run scripts/scrape-randommath.ts
 */
import { chromium } from "playwright";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, renameSync, existsSync } from "node:fs";
import { join } from "node:path";
import { randomMathTarget, parseRandomMathSolution, mergeRandomMathSolution, type RandomMathProblem } from "./randommath";
import { missingSolutions } from "./solution-only";

const args = process.argv.slice(2);
if (args.includes("--help")) {
  console.log("AMC 10 solutions only: --limit N --dry-run --refresh. Installs: bun install; bunx playwright install chromium.");
  process.exit(0);
}
const limitIndex = args.indexOf("--limit");
const limit = limitIndex < 0 ? Infinity : Number(args[limitIndex + 1]);
if (!(limit > 0) || (limit !== Infinity && !Number.isInteger(limit))) throw new Error("--limit must be a positive integer");
const dryRun = args.includes("--dry-run");
const file = "src/data/amc10.json";
const cache = ".scrape-cache/randommath";
const reportFile = "scripts/randommath-report.json";
mkdirSync(cache, { recursive: true });
const baseline = JSON.parse(readFileSync(file, "utf8")) as RandomMathProblem[];
const targets = missingSolutions(baseline).slice(0, limit);
const reports: { id: string; url?: string; status: string; seconds: number; error?: string }[] = [];
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ locale: "en-US" });
const page = await context.newPage();
const started = Date.now();
console.log(`Random Math: ${targets.length} missing AMC 10 solutions to check; ${dryRun ? "dry run (no data changes)" : "save after every accepted solution"}`);
try {
  // Honor the site's published crawler policy before accessing problem pages.
  const robotsResponse = await page.goto("https://wiki.randommath.com/robots.txt", { waitUntil: "domcontentloaded", timeout: 20000 });
  if (robotsResponse?.status() !== 200) throw new Error("cannot verify robots.txt; stopped");
  const robots = await page.locator("body").innerText();
  if (/Disallow:\s*\S/i.test(robots)) throw new Error("robots.txt has restrictions; review them before running");
  for (const target of targets) {
    const t = Date.now();
    const source = randomMathTarget(target);
    if (!source) {
      reports.push({ id: target.id, status: "unsupported identity", seconds: 0 });
      continue;
    }
    try {
      const cacheFile = join(cache, createHash("sha1").update(source.url).digest("hex") + ".html");
      let html: string;
      const cached = existsSync(cacheFile) && !args.includes("--refresh");
      if (cached) html = readFileSync(cacheFile, "utf8");
      else {
        await new Promise(resolve => setTimeout(resolve, 500));
        const response = await page.goto(source.url, { waitUntil: "domcontentloaded", timeout: 20000 });
        const status = response?.status() ?? 0;
        if (status === 429 || status === 403) throw new Error(`HTTP ${status}; stop rather than bypass access restrictions`);
        if (status !== 200) throw new Error(`HTTP ${status}`);
        await page.getByRole("heading", { name: source.title, exact: true }).waitFor({ timeout: 10000 });
        html = await page.content();
      }
      const solution = parseRandomMathSolution(html, source.title);
      if (!cached) writeFileSync(cacheFile, html);
      if (!dryRun) {
        // Re-read before each write to preserve solutions added since this process started.
        const rows = JSON.parse(readFileSync(file, "utf8")) as RandomMathProblem[];
        const index = rows.findIndex(row => row.id === target.id);
        const current = rows[index];
        if (!current || JSON.stringify(current) !== JSON.stringify(target)) throw new Error("saved row changed during download; left untouched");
        rows[index] = mergeRandomMathSolution(current, solution);
        writeFileSync(file + ".randommath.tmp", JSON.stringify(rows, null, 2));
        renameSync(file + ".randommath.tmp", file);
      }
      const seconds = (Date.now() - t) / 1000;
      reports.push({ id: target.id, url: source.url, status: dryRun ? "validated" : "saved", seconds });
      console.log(`${target.id}: ${dryRun ? "validated" : "solution saved"} (${seconds.toFixed(1)}s, ${cached ? "cache" : "direct browser"})`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      reports.push({ id: target.id, url: source.url, status: "skipped", seconds: (Date.now() - t) / 1000, error: message });
      console.log(`${target.id}: skipped — ${message}`);
      if (/HTTP (403|429)/.test(message)) break;
    } finally {
      writeFileSync(reportFile, JSON.stringify({ dryRun, elapsedSeconds: (Date.now() - started) / 1000, results: reports }, null, 2));
    }
  }
} finally {
  await browser.close();
}
const accepted = reports.filter(row => row.status === "saved" || row.status === "validated").length;
console.log(`Finished: ${accepted}/${reports.length} accepted in ${((Date.now() - started) / 1000).toFixed(1)}s. Details: ${reportFile}`);
if (accepted < reports.length) process.exitCode = 1;