import { describe, expect, it } from "vitest";
import { normalizeKeyAnswer, parseAnswerKey, preservedAnswer } from "../../scripts/answer-keys";
import amc8 from "../data/amc8.json";
import amc10 from "../data/amc10.json";
import amc12 from "../data/amc12.json";
import aime from "../data/aime.json";

describe("Answer key integrity during solution backfill", () => {
  it("restores the screenshot problem's official D answer and keeps its solution", () => {
    const problem = amc8.find(p => p.id === "amc8-2017-8");
    expect(problem?.answer).toBe("D");
    expect(problem?.solutionLatex).toContain("98");
  });
  it("keeps every saved AMC answer A–E", () => {
    for (const problem of [...amc8, ...amc10, ...amc12]) expect(problem.answer, problem.id).toMatch(/^[A-E]$/);
  });
  it("keeps every saved AIME answer a three-digit integer", () => {
    for (const problem of aime) expect(problem.answer, problem.id).toMatch(/^\d{3}$/);
  });
  it("preserves the AMC letter when the answer key is missing", () => {
    expect(preservedAnswer("", "D", false)).toBe("D");
  });
  it("preserves AIME integer answers without producing NaN", () => {
    expect(preservedAnswer("", "007", true)).toBe("007");
    expect(preservedAnswer("", "", true)).toBe("");
  });
  it("extracts the letter before official key annotations", () => {
    expect(normalizeKeyAnswer("B (NOTE: all contestants received credit)", false)).toBe("B");
  });
  it("uses the answer list rather than unrelated nested list entries", () => {
    expect(parseAnswerKey('<div class="mw-parser-output"><ol><li>Contents</li></ol><ol><li>A</li><li>D</li><li>B (note)</li></ol></div>', false)).toEqual(["A", "D", "B"]);
  });
});