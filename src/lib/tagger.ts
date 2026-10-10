// Shared topic tagger used by the scraper and at app load.
// Keywords match on word boundaries (so "pie" won't match "piece").
// Statement hits count double; a problem keeps its best-scoring topics (max 4),
// and always gets at least one broad fallback topic.

export type TagMap = Record<string, string[]>;

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
  const scores: [string, number][] = [];
  for (const [topic, kws] of Object.entries(map)) {
    let score = 0;
    for (const k of kws) {
      if (rx(k).test(s)) score += 2;
      score += Math.min(sol.match(rx(k))?.length ?? 0, 2);
    }
    if (score >= 2) scores.push([topic, score]);
  }
  scores.sort((a, b) => b[1] - a[1]);
  const out = scores.slice(0, 4).map(([t]) => t);
  if (out.length === 0) {
    const text = s + " " + sol;
    out.push(FALLBACKS.find(([, r]) => r.test(text))![0]);
  }
  return out;
}
