import katex from "katex";
import { useMemo } from "react";
import { prepareMath } from "@/lib/math-format";

// Image tokens look like [[img:https://...]] (diagrams/figures from AoPS).
const RE = /(\[\[img:[^\]]+\]\]|\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\$[^$]+?\$)/g;

function render(src: string, wrap = false) {
  return src
    .split(RE)
    .map((part) => {
      if (part.startsWith("[[img:")) {
        const url = part.slice(6, -2);
        if (!/^https:\/\//.test(url) && !/^\/__l5e\/assets-v1\/[\w/-]+\.png$/.test(url)) return "";
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
      const math = prepareMath(tex, display);
      let html: string;
      try {
        html = katex.renderToString(math.tex, {
          displayMode: math.displayMode, throwOnError: true, strict: "ignore", trust: false,
        });
      } catch {
        // Preserve unsupported source notation without KaTeX's red error text
        // or ParseError tooltip. Never hide an equation or change its values.
        return `<code class="math-source-fallback">${escape(tex)}</code>`;
      }
      // KaTeX emits non-breaking spaces inside \text{...}, which prevents
      // prose from ever wrapping. For wrapped contexts (answer choices),
      // turn them back into regular spaces so lines can break there.
      if (wrap) html = html.replace(/\u00a0/g, " ");
      return html;
    })
    .join("");
}
const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>");

export function Latex({ children, className, wrap }: { children: string; className?: string; wrap?: boolean }) {
  const html = useMemo(() => render(children, wrap), [children, wrap]);
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
