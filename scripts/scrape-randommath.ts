/** Local-only solution backfill. No archive, AI, answer keys, or topic changes.
 * bun run scripts/scrape-randommath.ts --limit 5 --dry-run
 * bun run scripts/scrape-randommath.ts
 */
import { chromium } from "playwright";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, renameSync, existsSync } from "node:fs";
import { join } from "node:path";
import { randomMathTarget, parseRandomMathSolution, mergeRandomMathSolution, type RandomMathProblem } from "./randommath";
import { missingSolutions } from "./solution-only";
import { importRandomMathDiagram } from "./randommath-assets";

const args = process.argv.slice(2);
if (args.includes("--help")) {
  console.log("Solutions only: --contest amc8|amc10|amc12|aime|all (default amc10), --limit N --dry-run --refresh. Installs: bun install; bunx playwright install chromium.");
  process.exit(0);
}
const limitIndex = args.indexOf("--limit");
const limit = limitIndex < 0 ? Infinity : Number(args[limitIndex + 1]);
if (!(limit > 0) || (limit !== Infinity && !Number.isInteger(limit))) throw new Error("--limit must be a positive integer");
const dryRun = args.includes("--dry-run");
const contestIndex = args.indexOf("--contest");
const contest = contestIndex < 0 ? "amc10" : args[contestIndex + 1];
const supported = ["amc8", "amc10", "amc12", "aime"];
if (!contest || (contest !== "all" && !supported.includes(contest))) throw new Error("unsupported --contest");
const contests = contest === "all" ? supported : [contest];
const cache = ".scrape-cache/randommath";
const reportFile = "scripts/randommath-report.json";
mkdirSync(cache, { recursive: true });
const targets = contests.flatMap(key => {
  const file = `src/data/${key}.json`;
  const baseline = JSON.parse(readFileSync(file, "utf8")) as RandomMathProblem[];
  return missingSolutions(baseline).map(target => ({ file, target }));
}).slice(0, limit);
const reports: { id: string; url?: string; status: string; seconds: number; error?: string }[] = [];
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ locale: "en-US" });
const page = await context.newPage();
const started = Date.now();
console.log(`Random Math (${contest}): ${targets.length} missing solutions to check; ${dryRun ? "dry run (no data changes)" : "save after every accepted solution"}`);
try {
  // Honor the site's published crawler policy before accessing problem pages.
  const robotsResponse = await page.goto("https://wiki.randommath.com/robots.txt", { waitUntil: "domcontentloaded", timeout: 20000 });
  if (robotsResponse?.status() !== 200) throw new Error("cannot verify robots.txt; stopped");
  const robots = await page.locator("body").innerText();
  if (/^Disallow:[ \t]*\S/im.test(robots)) throw new Error("robots.txt has restrictions; review them before running");
  for (const { file, target } of targets) {
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
        await page.locator("h1").filter({ hasText: "Problem" }).first().waitFor({ state: "visible", timeout: 10000 });
        // React hydrates the heading after navigation; exact identity is validated below.
        await page.waitForFunction(() => Array.from(document.querySelectorAll("h1")).some(h => h.textContent?.includes("Problem")), { timeout: 10000 });
        html = await page.content();
      }
      const diagrams = new Map<string, string>();
      // Validate the whole solution before uploading any media; placeholders never reach app data.
      parseRandomMathSolution(html, source.title, source => {
        diagrams.set(source, "");
        return "/__l5e/assets-v1/pending/diagram.png";
      });
      if (diagrams.size) {
        if (cached) {
          const response = await page.goto(source.url, { waitUntil: "domcontentloaded", timeout: 20000 });
          if (response?.status() !== 200) throw new Error(`HTTP ${response?.status() ?? 0}`);
          await page.locator("h1").filter({ hasText: source.title }).first().waitFor({ timeout: 10000 });
        }
        for (const image of diagrams.keys()) {
          diagrams.set(image, dryRun ? "/__l5e/assets-v1/dry-run/diagram.png" : await importRandomMathDiagram(page, image));
        }
      }
      const solution = parseRandomMathSolution(html, source.title, image => {
        const asset = diagrams.get(image);
        if (!asset) throw new Error("diagram was not imported");
        return asset;
      });
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