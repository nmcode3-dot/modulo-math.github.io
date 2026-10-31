import { describe, expect, it } from "vitest";
import { randomMathTarget, parseRandomMathSolution, mergeRandomMathSolution } from "../../scripts/randommath";

const row = {
  id: "amc10b-2013-7", contest: "AMC 10", year: 2013, version: "B", number: 7, answer: "B",
  solutionUrl: "https://artofproblemsolving.com/wiki/index.php/2013_AMC_10B_Problems/Problem_7",
  statementLatex: "Original question", choices: ["A", "B", "C", "D", "E"], topics: ["Geometry"],
};
const html = `<div><h1>¶ 2013 AMC 10B Problem 7</h1><p><strong>Problem:</strong> Do not include this.</p>
<p><strong>Solution:</strong></p><p>The triangle has distinct angles and therefore is a right triangle. Its two legs have lengths
<span class="katex"><span class="katex-mathml"><math><mrow><msqrt><mn>3</mn></msqrt></mrow>\\sqrt{3}</math></span><span class="katex-html">duplicate</span></span>
and one, so its area is half the product of those lengths.</p><hr><p>Copyright notice</p></div>`;

describe("Random Math solutions", () => {
  it("matches the saved contest identity to the precise source URL", () => {
    expect(randomMathTarget(row)).toEqual({ url: "https://wiki.randommath.com/amc10/2013/part-b/problem-7", title: "2013 AMC 10B Problem 7" });
    expect(randomMathTarget({ ...row, contest: "AIME" })).toBeNull();
  });
  it.each([
    ["AMC 8", "2024_AMC_8", "amc8/2024/problem-1", "2024 AMC8 Problem 1"],
    ["AMC 12", "2024_AMC_12A", "amc12/2024/part-a/problem-1", "2024 AMC 12A Problem 1"],
    ["AIME", "2012_AIME_II", "aime/2012/part-ii/problem-1", "2012 AIME II Problem 1"],
    ["AIME", "2015_AIME_I", "aime/2015/part-i/problem-1", "2015 AIME I Problem 1"],
    ["AIME", "1999_AIME", "aime/1999/problem-1", "1999 AIME Problem 1"],
  ])("maps %s identity %s without changing saved grading data", (contest, identity, path, title) => {
    expect(randomMathTarget({ ...row, contest, solutionUrl: `https://artofproblemsolving.com/wiki/index.php/${identity}_Problems/Problem_1` })).toEqual({ url: `https://wiki.randommath.com/${path}`, title });
  });
  it("preserves the original TeX without duplicate math renderings", () => {
    const solution = parseRandomMathSolution(html, "2013 AMC 10B Problem 7");
    expect(solution).toContain("$\\sqrt{3}$");
    expect(solution).not.toContain("duplicate");
    expect(solution).not.toContain("Do not include");
  });
  it("rejects a different problem instead of attaching its solution", () => {
    expect(() => parseRandomMathSolution(html, "2013 AMC 10B Problem 8")).toThrow("identity");
  });
  it("refuses missing equations and diagram-dependent partial solutions", () => {
    expect(() => parseRandomMathSolution(html.replace('\\sqrt{3}</math>', '</math>'), "2013 AMC 10B Problem 7")).toThrow("original TeX");
    expect(() => parseRandomMathSolution(html.replace("</p><hr>", '<img src="/diagram.png"></p><hr>'), "2013 AMC 10B Problem 7")).toThrow("asset import");
  });
  it("adds only the solution and never changes answers, statements, choices, or topics", () => {
    expect(mergeRandomMathSolution(row, "Worked solution")).toEqual({ ...row, solutionLatex: "Worked solution" });
  });
  it("preserves diagram position using imported assets, not source hotlinks", () => {
    const diagramHtml = html.replace("</p><hr>", '<img src="/diagram.png"></p><hr>');
    const sources: string[] = [];
    const solution = parseRandomMathSolution(diagramHtml, "2013 AMC 10B Problem 7", source => {
      sources.push(source);
      return "/__l5e/assets-v1/test/diagram.png";
    });
    expect(sources).toEqual(["https://wiki.randommath.com/diagram.png"]);
    expect(solution).toContain("[[img:/__l5e/assets-v1/test/diagram.png]]");
    expect(solution.indexOf("[[img:")).toBeGreaterThan(solution.indexOf("half the product"));
    expect(solution).not.toContain("https://wiki.randommath.com/diagram.png");
    expect(mergeRandomMathSolution(row, solution)).toEqual({ ...row, solutionLatex: solution });
  });
  it("does not save incomplete or unsafe diagrams", () => {
    const diagramHtml = html.replace("</p><hr>", '<img src="/diagram.png"></p><hr>');
    expect(() => parseRandomMathSolution(diagramHtml, "2013 AMC 10B Problem 7", () => "https://other.example/image.png")).toThrow("incomplete");
    expect(() => parseRandomMathSolution(diagramHtml.replace('/diagram.png', 'javascript:alert(1)'), "2013 AMC 10B Problem 7", () => "/__l5e/assets-v1/test/diagram.png")).toThrow("unsafe");
  });
  it("never overwrites an existing solution or saves a blank one", () => {
    const complete = { ...row, solutionLatex: "Original solution" };
    expect(mergeRandomMathSolution(complete, "Replacement")).toBe(complete);
    expect(mergeRandomMathSolution(row, "  ")).toBe(row);
  });
});