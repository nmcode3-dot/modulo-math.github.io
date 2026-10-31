import * as cheerio from "cheerio";
import katex from "katex";
import { addSolution } from "./solution-only";

export type RandomMathProblem = {
  id: string; contest: string; year: number; version: string; number: number;
  answer: string; solutionUrl: string; solutionLatex?: string;
};

// Derive identity from the original source URL: older saved version fields can be incomplete.
export function randomMathTarget(row: RandomMathProblem): { url: string; title: string } | null {
  const match = row.solutionUrl.match(/\/(\d{4})_(AMC_(8|10|12)([AB])?|AIME(?:_(I|II))?)_Problems\/Problem_(\d+)$/);
  if (!match) return null;
  const [, year, identity, amc, amcVersion, aimeVersion, number] = match;
  const contest = amc ? `AMC ${amc}` : "AIME";
  if (row.contest !== contest) return null;
  const version = amcVersion ?? aimeVersion;
  const path = amc ? `amc${amc}` : "aime";
  const titleContest = amc === "8" ? "AMC8" : amc ? `AMC ${amc}${version ?? ""}` : `AIME${version ? ` ${version}` : ""}`;
  if (!identity) return null;
  return {
    url: `https://wiki.randommath.com/${path}/${year}${version ? `/part-${version.toLowerCase()}` : ""}/problem-${number}`,
    title: `${year} ${titleContest} Problem ${number}`,
  };
}

export function parseRandomMathSolution(html: string, expectedTitle: string, importDiagram?: (source: string) => string): string {
  const $ = cheerio.load(html);
  const heading = $("h1").filter((_, el) => $(el).text().replace(/¶/g, "").replace(/\s+/g, " ").trim() === expectedTitle).first();
  if (!heading.length) throw new Error("problem identity not confirmed");
  const container = heading.parent();
  const marker = container.find("strong, h2, h3").filter((_, el) => /^Solution(?:\s+\d+)?\s*:?$/i.test($(el).text().trim())).first();
  if (!marker.length) throw new Error("no worked solution section");
  let block = marker;
  while (block.parent().length && block.parent().get(0) !== container.get(0)) block = block.parent();
  const parts: string[] = [];
  let started = false;
  for (const el of container.children().toArray()) {
    if (el === block.get(0)) started = true;
    if (!started) continue;
    const node = $(el);
    if (node.is("hr") || /The problems and solutions on this page are the property/i.test(node.text())) break;
    const copy = node.clone();
    copy.find("script, style, .toc-anchor").remove();
    copy.find(".katex").each((_, mathNode) => {
      const math = $(mathNode);
      const annotation = math.find('annotation[encoding="application/x-tex"]').first().text();
      // Random Math stores original TeX as direct text children after the MathML mrow.
      const raw = math.find("math").first().contents().toArray()
        .filter(child => child.type === "text").map(child => $(child).text()).join("").trim();
      const tex = annotation.trim() || raw;
      if (!tex) throw new Error("equation lacks original TeX");
      katex.renderToString(tex, { throwOnError: true, strict: "ignore" });
      const display = math.parent().hasClass("katex-display");
      // Insert as a text node, never interpret source TeX as HTML.
      const replacement = $("<span></span>").text(display ? `\n$$${tex}$$\n` : `$${tex}$`);
      math.replaceWith(replacement);
    });
    if (copy.find("math, svg, mjx-container").length) throw new Error("unconverted math or vector diagram");
    copy.find("img").each((_, img) => {
      const alt = $(img).attr("alt") ?? "";
      if (/^\$[\s\S]+\$$/.test(alt)) { $(img).replaceWith($("<span></span>").text(alt)); return; }
      const src = $(img).attr("src");
      if (!src || !importDiagram) throw new Error("solution contains an image needing a separate asset import");
      const url = new URL(src, "https://wiki.randommath.com");
      if (url.protocol !== "https:" || url.username || url.password) throw new Error("unsafe diagram URL");
      const asset = importDiagram(url.href);
      if (!/^\/__l5e\/assets-v1\/[\w/-]+\.png$/.test(asset)) throw new Error("diagram asset import incomplete");
      $(img).replaceWith($("<span></span>").text(`\n[[img:${asset}]]\n`));
    });
    copy.find("strong").filter((_, el) => /^Solution(?:\s+\d+)?\s*:?$/i.test($(el).text().trim())).remove();
    copy.find("br").replaceWith("\n");
    copy.find("li").prepend("\n• ");
    parts.push(copy.text().replace(/[ \t]+/g, " ").trim());
  }
  const solution = parts.filter(Boolean).join("\n\n").trim();
  if (solution.length < 80 || /^(?:view solution|coming soon|solution unavailable)/i.test(solution)) {
    throw new Error("worked solution is missing or too short for automatic acceptance");
  }
  return solution;
}

export function mergeRandomMathSolution<T extends RandomMathProblem>(row: T, solution: string): T {
  if (row.solutionLatex?.trim()) return row;
  return addSolution(row, solution);
}