import katex from "katex";
import { useMemo } from "react";

// Image tokens look like [[img:https://...]] (diagrams/figures from AoPS).
const RE = /(\[\[img:[^\]]+\]\]|\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\$[^$]+?\$)/g;

function render(src: string) {
  return src
    .split(RE)
    .map((part) => {
      if (part.startsWith("[[img:")) {
        const url = part.slice(6, -2);
        if (!/^https:\/\//.test(url)) return "";
        return `<img src="${url.replace(/"/g, "%22")}" alt="Problem figure" loading="lazy" class="problem-figure" />`;
      }
      let display = false;
      let tex: string | null = null;
      if (part.startsWith("$$") || part.startsWith("\\[")) {
        display = true;
        tex = part.slice(2, -2);
      } else if (part.startsWith("\\(")) tex = part.slice(2, -2);
      else if (part.startsWith("$") && part.endsWith("$") && part.length > 1) tex = part.slice(1, -1);
      if (tex === null) return escape(part);
      return katex.renderToString(tex, { displayMode: display, throwOnError: false });
    })
    .join("");
}
const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>");

export function Latex({ children, className }: { children: string; className?: string }) {
  const html = useMemo(() => render(children), [children]);
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
