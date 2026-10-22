import { beforeEach, describe, expect, it } from "vitest";
import { addQuestion, emptyConversation, loadConversation, normalizedAnswer, saveConversation, tileLabel } from "@/lib/topic-chat";
import { byDifficulty, type Problem } from "@/lib/problems";

const problem: Problem = { id: "amc8-2016-21", contest: "AMC 8", year: 2016, version: "", number: 21, statementLatex: "What is $1+1$?", choices: ["1", "2", "3", "4", "5"], answer: "B", solutionUrl: "https://artofproblemsolving.com/wiki/", topics: ["Algebra"] };

describe("Saved topic practice", () => {
  beforeEach(() => localStorage.clear());
  it("preserves questions and replies and isolates topics", () => {
    const conversation = addQuestion(emptyConversation(), problem);
    const question = conversation.questions[0];
    if (!question) throw new Error("Missing question");
    question.replies.push({ answer: "B", feedback: "Correct on attempt 1!", status: "solved" });
    saveConversation("Algebra", conversation);
    const restored = loadConversation("Algebra");
    expect(restored.questions).toHaveLength(1);
    expect(restored.questions[0]?.problem.id).toBe(problem.id);
    expect(restored.questions[0]?.replies).toEqual(question.replies);
    expect(loadConversation("Geometry")).toEqual(emptyConversation());
  });
  it("keeps old questions when another is posted", () => {
    const first = addQuestion(emptyConversation(), problem);
    const second = addQuestion(first, { ...problem, id: "another", number: 22 });
    expect(second.questions).toHaveLength(2);
    expect(second.activeId).toBe(second.questions[1]?.id);
  });
  it("normalizes typed answers and labels tiles", () => {
    expect(normalizedAnswer(" b ")).toBe("B");
    expect(normalizedAnswer("007")).toBe("7");
    expect(tileLabel(problem)).toBe("AMC 8 #21 2016");
  });
  it("orders contests then problem numbers by difficulty", () => {
    const sorted = [{ ...problem, contest: "AIME", number: 1 }, problem, { ...problem, number: 2 }].sort(byDifficulty);
    expect(sorted.map(p => `${p.contest}:${p.number}`)).toEqual(["AMC 8:2", "AMC 8:21", "AIME:1"]);
  });
  it("recovers from malformed browser history", () => {
    localStorage.setItem("modulo-topic-chat-v1:Algebra", "bad json");
    expect(loadConversation("Algebra")).toEqual(emptyConversation());
  });
  it("refreshes erased answers in saved questions without losing replies", () => {
    const conversation = addQuestion(emptyConversation(), { ...problem, id: "amc8-2017-8", answer: "" });
    saveConversation("Algebra", conversation);
    const restored = loadConversation("Algebra");
    expect(restored.questions[0]?.problem.answer).toBe("D");
    expect(restored.questions[0]?.replies).toEqual([]);
  });
  it("refreshes solutions in saved questions so finished ones show them", () => {
    const conversation = addQuestion(emptyConversation(), { ...problem, id: "amc8-2017-8" });
    saveConversation("Algebra", conversation);
    const restored = loadConversation("Algebra");
    expect(restored.questions[0]?.problem.solutionLatex).toBeTruthy();
  });
});