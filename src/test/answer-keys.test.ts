import { describe, expect, it } from "vitest";
import { normalizeKeyAnswer, parseAnswerKey, preservedAnswer } from "../../scripts/answer-keys";

describe("Answer key integrity during solution backfill", () => {
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