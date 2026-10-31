import { describe, expect, it } from "vitest";
import katex from "katex";
import { prepareMath } from "@/lib/math-format";

describe("source equation compatibility", () => {
  it("renders the reported AMC 10B 2012 #19 alignment in display mode", () => {
    const math = prepareMath(String.raw`\begin{align*}BFDG&=180-45-\frac{135}{2}\\&=\boxed{\frac{135}{2}}\end{align*}`);
    expect(math.displayMode).toBe(true);
    expect(() => katex.renderToString(math.tex, { displayMode: math.displayMode, throwOnError: true })).not.toThrow();
  });

  it("keeps ordinary fractions inline and unchanged", () => {
    expect(prepareMath(String.raw`\frac{135}{2}`)).toEqual({ tex: String.raw`\frac{135}{2}`, displayMode: false });
  });

  it.each([String.raw`\mbox{Area}`, String.raw`\textdollar 25`, String.raw`\overarc{AB}`, String.raw`\framebox{C}`])("renders compatible source notation: %s", (tex) => {
    const math = prepareMath(tex);
    expect(() => katex.renderToString(math.tex, { throwOnError: true })).not.toThrow();
  });

  it("does not replace longer commands containing an alias", () => {
    expect(prepareMath(String.raw`\mboxExtra{x}`).tex).toBe(String.raw`\mboxExtra{x}`);
  });
});