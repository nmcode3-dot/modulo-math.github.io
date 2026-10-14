import topicTags from "@/data/topic-tags.json";
import { tagProblem, FALLBACK_TOPICS, type TagMap } from "@/lib/tagger";

export type Problem = {
  id: string;
  contest: string;
  year: number;
  version: string;
  number: number;
  statementLatex: string;
  solutionLatex?: string;
  choices: string[];
  answer: string;
  solutionUrl: string;
  topics: string[];
};

// Loads whichever contest files exist in src/data (missing files are simply skipped).
const files = import.meta.glob<{ default: Problem[] }>(
  ["/src/data/amc8.json", "/src/data/amc10.json", "/src/data/amc12.json", "/src/data/aime.json"],
  { eager: true },
);

export const CONTESTS = ["AMC 8", "AMC 10", "AMC 12", "AIME"] as const;
const contestRank = (c: string) => {
  const i = (CONTESTS as readonly string[]).indexOf(c);
  return i < 0 ? 99 : i;
};

export const TOPICS: string[] = [...Object.keys(topicTags as Record<string, string[]>), ...FALLBACK_TOPICS].sort();

function withTags(p: Problem): Problem {
  const map = topicTags as TagMap;
  // Scraped tags (which also used solution text) + fresh statement tags, so manual keyword edits apply.
  const set = new Set((p.topics ?? []).filter((t) => t in map || FALLBACK_TOPICS.includes(t)));
  for (const t of tagProblem(map, p.statementLatex)) {
    if (set.size === 0 || !FALLBACK_TOPICS.includes(t)) set.add(t);
  }
  return { ...p, topics: [...set] };
}

export const PROBLEMS: Problem[] = Object.values(files)
  .flatMap((m) => m.default ?? [])
  .map(withTags)
  .sort(
    (a, b) =>
      contestRank(a.contest) - contestRank(b.contest) ||
      a.year - b.year ||
      a.version.localeCompare(b.version) ||
      a.number - b.number,
  );

export const byDifficulty = (a: Problem, b: Problem) =>
  contestRank(a.contest) - contestRank(b.contest) || a.number - b.number || a.year - b.year;

export const getProblem = (id: string) => PROBLEMS.find((p) => p.id === id);

export const isAime = (p: Problem) => p.contest === "AIME";

export const label = (p: Problem) =>
  `${p.year} ${p.contest}${p.version ? (p.contest === "AIME" ? " " : "") + p.version : ""} #${p.number}`;

export const slugify = (t: string) =>
  t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
export const topicFromSlug = (s: string) => TOPICS.find((t) => slugify(t) === s);
