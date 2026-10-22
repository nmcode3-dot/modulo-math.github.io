import { getProblem, type Problem } from "@/lib/problems";

export type PracticeReply = { answer: string; feedback: string; status: "in-progress" | "solved" | "failed" };
export type PracticeQuestion = { id: string; problem: Problem; replies: PracticeReply[]; startedAt: string };
export type TopicConversation = { questions: PracticeQuestion[]; activeId: string | null };
export const emptyConversation = (): TopicConversation => ({ questions: [], activeId: null });
const key = (topic: string) => `modulo-topic-chat-v1:${topic}`;

export function loadConversation(topic: string): TopicConversation {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(key(topic)) ?? "null");
    if (!data || typeof data !== "object" || !("questions" in data) || !Array.isArray(data.questions)) return emptyConversation();
    const questions = data.questions.filter((q): q is PracticeQuestion =>
      q && typeof q.id === "string" && typeof q.problem?.id === "string" &&
      typeof q.problem.statementLatex === "string" && Array.isArray(q.replies),
    ).map(q => {
      const current = getProblem(q.problem.id);
      return current ? { ...q, problem: refreshProblem(q.problem, current) } : q;
    });
    const activeId = "activeId" in data && typeof data.activeId === "string" && questions.some(q => q.id === data.activeId) ? data.activeId : null;
    return { questions, activeId };
  } catch { return emptyConversation(); }
}

function refreshProblem(saved: Problem, current: Problem): Problem {
  const problem: Problem = { ...saved, answer: current.answer, solutionUrl: current.solutionUrl };
  if (current.solutionLatex === undefined) delete problem.solutionLatex;
  else problem.solutionLatex = current.solutionLatex;
  return problem;
}
}

export function saveConversation(topic: string, conversation: TopicConversation) {
  localStorage.setItem(key(topic), JSON.stringify(conversation));
}

export function addQuestion(conversation: TopicConversation, problem: Problem): TopicConversation {
  const question: PracticeQuestion = {
    id: crypto.randomUUID(), problem, replies: [], startedAt: new Date().toISOString(),
  };
  return { questions: [...conversation.questions, question], activeId: question.id };
}

export const tileLabel = (problem: Problem) => `${problem.contest}${problem.version ? ` ${problem.version}` : ""} #${problem.number} ${problem.year}`;
export const normalizedAnswer = (answer: string) => /^\d+$/.test(answer.trim()) ? String(Number(answer.trim())) : answer.trim().toUpperCase();