/**
 * Modulo AoPS scraper.
 *
 * Run locally:   bun install && bun run scripts/scrape.ts
 * Options:       --only "2019 AMC 10A"   (scrape a single contest, for testing)
 *                --contest amc10         (amc8 | amc10 | amc12 | aime)
 *
 * - Throttles to ~1 request/second, caches raw HTML in .scrape-cache/
 * - Logs unparsed problems to scrape-errors.log
 * - Writes src/data/{amc8,amc10,amc12,aime}.json and scripts/coverage-report.md
 */
import * as cheerio from "cheerio";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { join } from "node:path";
import { tagProblem, type TagMap } from "../src/lib/tagger";

const BASE = "https://artofproblemsolving.com";
const CACHE = ".scrape-cache";
const ERR = "scrape-errors.log";
const args = process.argv.slice(2);
const only = args.includes("--only") ? args[args.indexOf("--only") + 1] : null;
const onlyContest = args.includes("--contest") ? args[args.indexOf("--contest") + 1] : null;
const resume = args.includes("--resume");
const skips = args.includes("--skip") ? args[args.indexOf("--skip") + 1].split(",") : [];
mkdirSync(CACHE, { recursive: true });
writeFileSync(ERR, "");

const INDEXES = [
  { key: "amc8", contest: "AMC 8", url: "/wiki/index.php?title=AMC_8_Problems_and_Solutions", expected: 25, re: /^(\d{4}) AMC 8$/ },
  { key: "amc10", contest: "AMC 10", url: "/wiki/index.php?title=AMC_10_Problems_and_Solutions", expected: 25, re: /^(\d{4})(?: Fall)? AMC 10([AB])?$/ },
  { key: "amc12", contest: "AMC 12", url: "/wiki/index.php?title=AMC_12_Problems_and_Solutions", expected: 25, re: /^(\d{4})(?: Fall)? AMC 12([AB])?$/ },
  { key: "aime", contest: "AIME", url: "/wiki/index.php?title=AIME_Problems_and_Solutions", expected: 15, re: /^(\d{4}) AIME( I{1,2})?$/ },
] as const;

let last = 0;
async function get(path: string): Promise<string | null> {
  const url = path.startsWith("http") ? path : BASE + path;
  const file = join(CACHE, createHash("sha1").update(url).digest("hex") + ".html");
  if (existsSync(file)) return readFileSync(file, "utf8");
  const wait = 1000 - (Date.now() - last);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  last = Date.now();
  // Fetch via curl: both AoPS and the Wayback Machine fingerprint/bot-block bun's fetch.
  const curl = (u: string): { status: number; body: string } => {
    const r = Bun.spawnSync([
      "curl", "-sL", "--compressed", "-m", "60",
      "-A", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      "-H", "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "-H", "Accept-Language: en-US,en;q=0.9",
      "-w", "\n%{http_code}", u,
    ]);
    const out = r.stdout.toString();
    const status = Number(out.trimEnd().split("\n").pop());
    return { status, body: out.slice(0, out.lastIndexOf("\n")) };
  };
  for (let tries = 0; tries < 3; tries++) {
    try {
      const { status, body } = curl(url);
      if (status === 404) return null;
      if (status === 403) throw Object.assign(new Error(`HTTP 403`), { fatal: true }); // bot-block: don't retry, go to wayback
      if (status !== 200) throw new Error(`HTTP ${status}`);
      writeFileSync(file, body);
      return body;
    } catch (e) {
      if (tries < 2 && !(e as any).fatal) { await new Promise((r) => setTimeout(r, 3000)); continue; }
      // Direct fetch failed (AoPS often 403s bots) — fall back to the Wayback Machine.
      for (let w = 0; w < 4; w++) {
        await new Promise((r) => setTimeout(r, 3000)); // wayback rate-limits aggressively
        const { status, body } = curl(`https://web.archive.org/web/2026id_/${url}`);
        if (status === 429) { await new Promise((r) => setTimeout(r, 20000)); continue; }
        if (status !== 200) { logErr(url, `direct failed (${e}); wayback HTTP ${status}`); return null; }
        writeFileSync(file, body);
        return body;
      }
      logErr(url, `direct failed (${e}); wayback rate-limited after retries`);
      return null;
    }
  }
  return null;
}
const logErr = (where: string, msg: string) => appendFileSync(ERR, `${where}\t${msg}\n`);

/** Convert a content node to text, replacing AoPS LaTeX images with their alt-text LaTeX. */
function toLatex($: cheerio.CheerioAPI, el: cheerio.Cheerio<any>): string {
  const clone = el.clone();
  clone.find("img").each((_, img) => {
    const alt = ($(img).attr("alt") ?? "").trim();
    const src = $(img).attr("src") ?? "";
    const isFigure = !alt || /\[asy\]/i.test(alt) || !/latex/.test($(img).attr("class") ?? "latex");
    if (isFigure && src) {
      const url = src.startsWith("//") ? "https:" + src : src.startsWith("/") ? "https://web.archive.org" + src : src;
      $(img).replaceWith(`\n[[img:${url.replace(/^http:/, "https:")}]]\n`);
      return;
    }
    $(img).replaceWith(alt.startsWith("$") || alt.startsWith("\\[") ? ` ${alt} ` : alt ? `$${alt}$` : "");
  });
  clone.find("br").replaceWith("\n");
  return clone.text().replace(/[ \t]+/g, " ").replace(/\s+\n/g, "\n").trim();
}

/** Split "$\textbf{(A) }6\qquad\textbf{(B) }7 ..." into an array of 5 choice LaTeX strings. */
function splitChoices(tex: string): string[] | null {
  const body = tex.replace(/^\$+|\$+$/g, "").replace(/\\\[|\\\]/g, "");
  const parts = body.split(/\\(?:textbf|mathrm|text)\s*\{\s*\(([A-E])\)\s*\}|\(([A-E])\)/);
  const out: Record<string, string> = {};
  for (let i = 1; i < parts.length; i += 3) {
    const L = parts[i] ?? parts[i + 1];
    const v = (parts[i + 2] ?? "").replace(/\\q?quad|\\hspace\{[^}]*\}|\\\\|~/g, " ").replace(/\s+/g, " ").trim();
    if (L) out[L] = v;
  }
  const letters = ["A", "B", "C", "D", "E"];
  if (!letters.every((l) => out[l] !== undefined)) return null;
  return letters.map((l) => `$${out[l]}$`);
}

function parseProblem(html: string) {
  const $ = cheerio.load(html);
  const content = $(".mw-parser-output").first();
  const heading = content.find("h2").filter((_, h) => /^Problem/i.test($(h).text().trim())).first();
  if (!heading.length) return null;
  const blocks: string[] = [];
  let node = heading.next();
  while (node.length && !node.is("h2")) {
    if (node.is("p, dl, ul, ol, center, div:not(.toc)")) blocks.push(toLatex($, node));
    node = node.next();
  }
  let statement = blocks.filter(Boolean).join("\n\n");
  let choices: string[] = [];
  const m = statement.match(/(\$[^$]*\\textbf\{\s*\(A\)[\s\S]*?\$|\$[^$]*\(A\)[\s\S]*\(E\)[\s\S]*?\$)\s*$/);
  if (m) {
    const c = splitChoices(m[1]);
    if (c) { choices = c; statement = statement.slice(0, m.index).trim(); }
  }
  // First "Solution" section, converted the same way as the statement.
  const solHeading = content.find("h2").filter((_, h) => /^Solution/i.test($(h).text().trim())).first();
  let solution = "";
  if (solHeading.length) {
    const solBlocks: string[] = [];
    let snode = solHeading.next();
    while (snode.length && !snode.is("h2")) {
      if (snode.is("p, dl, ul, ol, center, div:not(.toc)")) solBlocks.push(toLatex($, snode));
      snode = snode.next();
    }
    solution = solBlocks.filter(Boolean).join("\n\n");
  }
  return { statement, choices, solution, solutionText: content.text() };
}

function parseAnswerKey(html: string): string[] {
  const $ = cheerio.load(html);
  const items = $(".mw-parser-output ol li").map((_, li) => $(li).text().trim()).get();
  return items.map((s) => s.replace(/\s+/g, ""));
}

const topicTags: TagMap = JSON.parse(readFileSync("src/data/topic-tags.json", "utf8"));

type Row = { contest: string; year: number; version: string; found: number; expected: number; answers: number };
const coverage: Row[] = [];
let anyFailure = false;

for (const idx of INDEXES) {
  if (onlyContest && idx.key !== onlyContest) continue;
  const html = await get(idx.url);
  if (!html) { logErr(idx.url, "index fetch failed"); anyFailure = true; continue; }
  const $ = cheerio.load(html);
  const contests = new Map<string, string>();
  $(".mw-parser-output a").each((_, a) => {
    const text = $(a).text().trim();
    const title = ($(a).attr("title") ?? "").trim();
    const href = $(a).attr("href");
    const name = idx.re.test(text) ? text : idx.re.test(title) ? title : null;
    if (href && name) contests.set(name, href);
  });
  if (contests.size === 0) { logErr(idx.url, "no contests found on index page"); anyFailure = true; continue; }

  const problems: any[] = [];
  // Always read the saved file: --resume uses it to skip complete years, and
  // the backfill pass uses it to skip problems that already have a solution.
  const savedProblems = new Map<string, any>();
  const savedYearCount = new Map<string, number>();
  try {
    for (const p of JSON.parse(readFileSync(`src/data/${idx.key}.json`, "utf8"))) {
      savedProblems.set(`${p.year}|${p.version}|${p.number}`, p);
      const k = `${p.year}|${p.version}`;
      savedYearCount.set(k, (savedYearCount.get(k) ?? 0) + 1);
    }
  } catch { /* no file yet */ }
  for (const [name, href] of contests) {
    if (only && name !== only) continue;
    const m = name.match(idx.re)!;
    const year = Number(m[1]);
    const version = (m[2] ?? "").trim() + (name.includes("Fall") ? " Fall" : "");
    if (skips.includes(String(year))) { console.log(`skip ${name} (unavailable year)`); continue; }
    if (resume && (savedYearCount.get(`${year}|${version.trim()}`) ?? 0) >= idx.expected - 8) {
      console.log(`skip ${name} (already saved)`);
      continue;
    }
    const slug = href.replace(/^.*\/wiki\/index\.php\/?(\?title=)?/, "").replace(/_Problems$/, "");
    const keyHtml = await get(`/wiki/index.php/${slug}_Answer_Key`);
    const key = keyHtml ? parseAnswerKey(keyHtml) : [];
    if (!key.length) logErr(name, "answer key missing");
    let found = 0;
    for (let n = 1; n <= idx.expected; n++) {
      const id = `${idx.key}${version.replace(/\s+/g, "").toLowerCase()}-${year}-${n}`;
      // Backfill short-circuit: problem already saved with an on-page solution — reuse it as-is.
      const prev = savedProblems.get(`${year}|${version.trim()}|${n}`);
      if (prev && prev.solutionLatex) {
        found++;
        problems.push(prev);
        process.stdout.write(`\r${name} #${n} (saved)   `);
        continue;
      }
      const url = `${BASE}/wiki/index.php/${slug}_Problems/Problem_${n}`;
      const page = await get(url);
      const parsed = page ? parseProblem(page) : null;
      if (!parsed || !parsed.statement) { logErr(url, "could not parse problem"); continue; }
      if (idx.key !== "aime" && parsed.choices.length !== 5) logErr(url, "could not parse answer choices");
      const answer = key[n - 1] ?? "";
      if (!answer) logErr(url, "no answer in key");
      found++;
      problems.push({
        id: `${idx.key}${version.replace(/\s+/g, "").toLowerCase()}-${year}-${n}`.replace(/^(amc8|amc10|amc12|aime)/, (k) => (idx.key === "amc8" ? k : k)),
        contest: idx.contest,
        year,
        version: version.trim(),
        number: n,
        statementLatex: parsed.statement,
        solutionLatex: parsed.solution,
        choices: idx.key === "aime" ? [] : parsed.choices,
        answer: idx.key === "aime" ? String(parseInt(answer, 10)).padStart(3, "0") : answer.toUpperCase(),
        solutionUrl: url,
        topics: tagProblem(topicTags, parsed.statement, parsed.solutionText),
      });
      process.stdout.write(`\r${name} #${n}   `);
    }
    coverage.push({ contest: idx.contest, year, version: version.trim(), found, expected: idx.expected, answers: key.length });
    // Merge into the existing file so partial runs never lose already-saved problems.
    if (problems.length) {
      const path = `src/data/${idx.key}.json`;
      let existing: any[] = [];
      try { existing = JSON.parse(readFileSync(path, "utf8")); } catch { /* first run */ }
      const byId = new Map<string, any>(existing.map((p) => [p.id, p]));
      for (const p of problems) byId.set(p.id, p);
      writeFileSync(path, JSON.stringify([...byId.values()], null, 2));
    } else {
      anyFailure = true;
    }
  }
  if (problems.length) console.log(`\n${idx.contest}: ${problems.length} problems scraped this run`);
}

const lines = ["# Coverage report", "", "| Contest | Year | Version | Found | Expected | Answer key |", "|---|---|---|---|---|---|"];
for (const r of coverage) lines.push(`| ${r.contest} | ${r.year} | ${r.version || "—"} | ${r.found} | ${r.expected} | ${r.answers} |${r.found < r.expected ? " ⚠️" : ""}`);
const tf = coverage.reduce((a, r) => a + r.found, 0), te = coverage.reduce((a, r) => a + r.expected, 0);
lines.push("", `**Total: ${tf} / ${te}** — see scrape-errors.log for failures.`);
writeFileSync("scripts/coverage-report.md", lines.join("\n"));
console.log(lines.join("\n"));
if (anyFailure) process.exit(1);
