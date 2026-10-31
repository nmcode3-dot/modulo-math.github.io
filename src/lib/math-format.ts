// Source sites use a few LaTeX commands that KaTeX names differently.
const COMMANDS: Record<string, string> = {
  mbox: "text", textdollar: "$", mathdollar: "$", cent: "text{¢}",
  overarc: "overset{\\frown}", hdots: "ldots", textsc: "text",
  framebox: "boxed", ensuremath: "mathord",
};

export function prepareMath(tex: string, displayMode = false) {
  const source = tex.replace(/\\([a-zA-Z]+)\b/g, (command, name: string) => {
    const replacement = COMMANDS[name];
    return replacement === undefined ? command : `\\${replacement}`;
  });
  // These environments are legal only in display math, even when the source
  // incorrectly encloses them in single dollar signs.
  const needsDisplay = /\\begin\s*\{(?:align\*?|alignat\*?|gather\*?|equation\*?|multline\*?|eqnarray\*?)\}/.test(source);
  return {
    tex: source.replace(/\\(begin|end)\{eqnarray\*?\}/g, "\\$1{aligned}"),
    displayMode: displayMode || needsDisplay,
  };
}