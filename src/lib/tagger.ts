// Shared topic tagger used by the scraper and at app load.
// Keywords match on word boundaries (so "pie" won't match "piece").
// Statement hits count double; a problem keeps its best-scoring topics (max 4),
// and always gets at least one broad fallback topic.

export type TagMap = Record<string, string[]>;

export const FALLBACK_TOPICS = ["Probability", "Counting", "Geometry", "Number Theory", "Algebra"];
const FALLBACKS: [string, RegExp][] = [
  ["Probability", /\bprobab|\bat random\b|\bdice\b|\bdie\b|\bcoin/i],
  ["Counting", /\bhow many\b|\bnumber of (ways|ordered|arrangements|subsets)/i],
  ["Geometry", /\btriangle|\bcircle|\bsquare\b|\brectangle|\bpolygon|\bhexagon|\barea\b|\bperimeter|\bangle/i],
  ["Number Theory", /\binteger|\bprime|\bdivisib|\bdivisor|\bmultiple of/i],
  ["Algebra", /.*/],
];

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function rx(k: string) {
  const start = /^\w/.test(k) ? "\\b" : "";
  const end = /\w$/.test(k) ? "\\b" : "";
  return new RegExp(start + esc(k.toLowerCase()) + end, "g");
}

export function tagProblem(map: TagMap, statement: string, solution = ""): string[] {
  const s = statement.toLowerCase();
  const sol = solution.toLowerCase();
  const hasSolution = sol.trim().length > 40;
  const scores: [string, number][] = [];
  for (const [topic, kws] of Object.entries(map)) {
    let score = 0;
    let solHits = 0;
    for (const k of kws) {
      // The solution reveals the technique, so it outweighs the statement.
      const n = sol.match(rx(k))?.length ?? 0;
      if (n) { solHits++; score += 3 + Math.min(n - 1, 2); }
      if (rx(k).test(s)) score += 1;
    }
    // With a solution available, a topic needs support from the solution text.
    if (hasSolution ? solHits > 0 : score >= 1) scores.push([topic, score]);
  }
  scores.sort((a, b) => b[1] - a[1]);
  const out = scores.slice(0, 4).map(([t]) => t);
  if (out.length === 0) {
    const text = s + " " + sol;
    out.push(FALLBACKS.find(([, r]) => r.test(text))![0]);
  }
  return out;
}
