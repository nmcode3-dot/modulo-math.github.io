import * as cheerio from "cheerio";

export function normalizeKeyAnswer(value: string, aime: boolean): string {
  const text = value.trim();
  if (aime) return /^\d{1,3}$/.test(text) ? text.padStart(3, "0") : "";
  return text.match(/^\(?([A-E])\)?(?:\s|$)/i)?.[1]?.toUpperCase() ?? "";
}

export function parseAnswerKey(html: string, aime: boolean): string[] {
  const $ = cheerio.load(html);
  const lists = $(".mw-parser-output ol").toArray().map(ol =>
    $(ol).children("li").toArray().map(li => normalizeKeyAnswer($(li).text(), aime)),
  );
  return lists.sort((a, b) => b.filter(Boolean).length - a.filter(Boolean).length)[0] ?? [];
}

export function preservedAnswer(incoming: string, previous: string, aime: boolean): string {
  return normalizeKeyAnswer(incoming, aime) || normalizeKeyAnswer(previous, aime);
}

/** Keep incomplete downloads for repair, but never publish an ungradable problem. */
export function partitionGradedProblems<T extends { id: string; answer: string; solutionLatex?: string }>(
  existing: T[], incoming: T[], aime: boolean,
): { ready: T[]; pending: T[] } {
  const byId = new Map(existing.map(p => [p.id, p]));
  for (const p of incoming) {
    const previous = byId.get(p.id);
    byId.set(p.id, {
      ...previous, ...p,
      solutionLatex: p.solutionLatex || previous?.solutionLatex,
      answer: preservedAnswer(p.answer, previous?.answer ?? "", aime),
    });
  }
  const ready: T[] = [], pending: T[] = [];
  for (const p of byId.values()) {
    const answer = normalizeKeyAnswer(p.answer, aime);
    (answer ? ready : pending).push({ ...p, answer });
  }
  return { ready, pending };
}