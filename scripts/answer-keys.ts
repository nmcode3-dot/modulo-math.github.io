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