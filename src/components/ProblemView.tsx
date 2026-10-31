import { useState } from "react";
import { ExternalLink, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Latex } from "./Latex";
import { isAime, label, type Problem } from "@/lib/problems";
import { MAX_ATTEMPTS, resetProblem, submitAnswer, useProgress } from "@/lib/progress";

const LETTERS = ["A", "B", "C", "D", "E"];

export function ProblemView({ problem }: { problem: Problem }) {
  const progress = useProgress();
  const entry = progress[problem.id];
  const used = entry?.attempts.length ?? 0;
  const done = entry?.status === "solved" || entry?.status === "failed";
  const [value, setValue] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  function submit(ans: string) {
    if (done || !ans) return;
    if (isAime(problem) && !/^\d{1,3}$/.test(ans)) {
      setFeedback("Enter an integer from 0 to 999.");
      return;
    }
    if (entry?.attempts.includes(ans)) {
      setFeedback("You already tried that answer.");
      return;
    }
    const r = submitAnswer(problem.id, ans, problem.answer);
    const left = MAX_ATTEMPTS - r.attempts.length;
    if (r.status === "in-progress")
      setFeedback(`Incorrect, ${left} attempt${left === 1 ? "" : "s"} left`);
    else setFeedback(null);
    setValue("");
  }

  const correctDisplay = isAime(problem)
    ? problem.answer.padStart(3, "0")
    : `(${problem.answer}) `;

  return (
    <article className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-display text-3xl">{label(problem)}</h1>
        {!done && (
          <span className="text-sm font-medium text-muted-foreground">
            Attempt {used + 1} of {MAX_ATTEMPTS}
          </span>
        )}
      </div>

      <div className="problem-card">
        <Latex className="text-lg leading-relaxed">{problem.statementLatex}</Latex>
      </div>

      {isAime(problem) ? (
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            submit(value.trim());
          }}
        >
          <Input
            inputMode="numeric"
            maxLength={3}
            placeholder="000–999"
            value={value}
            disabled={done}
            onChange={(e) => setValue(e.target.value.replace(/\D/g, ""))}
            className="max-w-40 text-lg"
          />
          <Button type="submit" disabled={done || !value}>
            Submit
          </Button>
        </form>
      ) : (
        <div className="grid gap-2 sm:grid-cols-5">
          {LETTERS.map((L, i) => {
            const c = problem.choices[i] ?? "";
            const tried = entry?.attempts.includes(L);
            const isAns = done && L === problem.answer;
            return (
              <button
                key={L}
                disabled={done || tried}
                onClick={() => submit(L)}
                className={`choice-btn ${isAns ? "choice-correct" : tried ? "choice-wrong" : ""}`}
              >
                <span className="font-semibold shrink-0">({L})</span>{" "}
                {c && <Latex wrap className="min-w-0">{c}</Latex>}
              </button>
            );
          })}
        </div>
      )}

      {feedback && <p className="feedback-wrong">{feedback}</p>}

      {done && (
        <div className={entry.status === "solved" ? "result-solved" : "result-failed"}>
          <p className="text-lg font-semibold">
            {entry.status === "solved"
              ? `Correct on attempt ${entry.attempts.length}!`
              : "Out of attempts."}
          </p>
          <p className="mt-1">
            Correct answer:{" "}
            <strong>
              {isAime(problem) ? correctDisplay : <>{correctDisplay}<Latex wrap>{problem.choices[LETTERS.indexOf(problem.answer)] ?? ""}</Latex></>}
            </strong>
          </p>
          <a href={problem.solutionUrl} target="_blank" rel="noopener noreferrer" className="solution-link">
            View Solution on AoPS <ExternalLink className="size-4" />
          </a>
          <div>
            <Button variant="ghost" size="sm" onClick={() => { resetProblem(problem.id); setFeedback(null); }}>
              <RotateCcw className="size-4" /> Retry problem
            </Button>
          </div>
        </div>
      )}

      {done && problem.solutionLatex && (
        <div className="problem-card">
          <h2 className="section-label mb-3">Solution</h2>
          <Latex className="leading-relaxed">{problem.solutionLatex}</Latex>
        </div>
      )}

      {problem.topics.length > 0 && (
        <p className="text-sm text-muted-foreground">Topics: {problem.topics.join(" · ")}</p>
      )}
    </article>
  );
}
