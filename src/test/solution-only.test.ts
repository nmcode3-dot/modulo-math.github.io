import { describe, expect, it } from "vitest";
import { addSolution, missingSolutions } from "../../scripts/solution-only";

describe("Solutions-only downloads", () => {
  const row = { id: "amc10a-2014-17", answer: "D", solutionUrl: "https://artofproblemsolving.com/wiki/index.php/2014_AMC_10A_Problems/Problem_17", statementLatex: "Original question", choices: ["A", "B", "C", "D", "E"], topics: ["Geometry"] };
  it("targets only saved problems without solutions", () => {
    expect(missingSolutions([row, { ...row, id: "complete", solutionLatex: "Worked solution" }]).map(p => p.id)).toEqual(["amc10a-2014-17"]);
  });
  it("changes only the solution, preserving answers, questions, and topics", () => {
    expect(addSolution(row, "Worked solution")).toEqual({ ...row, solutionLatex: "Worked solution" });
  });
  it("leaves the saved problem untouched when a solution is blank", () => {
    expect(addSolution(row, " ")).toBe(row);
  });
});