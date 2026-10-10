import katex from "katex";
import { useMemo } from "react";

const RE = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\$[^$]+?\$)/g;

function render(src: string) {
  return src
    .split(RE)
    .map((part) => {
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
