import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Bot, Check, ChevronLeft, ChevronRight, ExternalLink, RotateCcw, Search, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Latex } from "@/components/Latex";
import { byDifficulty, CONTESTS, isAime, PROBLEMS, slugify, TOPICS, type Problem } from "@/lib/problems";
import { MAX_ATTEMPTS, resetProblem, submitAnswer, useProgress } from "@/lib/progress";
import { addQuestion, emptyConversation, loadConversation, normalizedAnswer, saveConversation, tileLabel, type TopicConversation } from "@/lib/topic-chat";

const LETTERS = ["A", "B", "C", "D", "E"];

export function TopicWorkspace({ topic }: { topic: string }) {
  const progress = useProgress();
  const [conversation, setConversation] = useState<TopicConversation>(emptyConversation);
  const [ready, setReady] = useState(false);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [contest, setContest] = useState("all");
  const input = useRef<HTMLInputElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const transcript = useRef<HTMLDivElement>(null);
  const questions = useRef(new Map<string, HTMLDivElement>());
  const all = PROBLEMS.filter(p => p.topics.includes(topic) && (isAime(p) ? /^\d{1,3}$/.test(p.answer) : LETTERS.includes(p.answer))).sort(byDifficulty);
  const list = all.filter(p => contest === "all" || p.contest === contest);
  const solved = all.filter(p => progress[p.id]?.status === "solved").length;
  const percent = all.length ? Math.round(solved / all.length * 100) : 0;
  const active = conversation.questions.find(q => q.id === conversation.activeId);
  const entry = active ? progress[active.problem.id] : undefined;
  const done = entry?.status === "solved" || entry?.status === "failed";

  useEffect(() => {
    setConversation(loadConversation(topic));
    setReady(true);
    input.current?.focus();
  }, [topic]);

  function commit(next: TopicConversation) {
    try { saveConversation(topic, next); } catch { setError("This browser could not save your practice history. Free up storage to keep new messages."); }
    setConversation(next);
  }

  useEffect(() => {
    const element = questions.current.get(conversation.activeId ?? "");
    if (element && transcript.current) transcript.current.scrollTo({ top: element.offsetTop, behavior: "instant" });
  }, [conversation.activeId]);

  function railStep(): number {
    const railElement = rail.current;
    const tile = railElement?.firstElementChild as HTMLElement | null;
    if (!railElement || !tile) return 348;
    return (tile.offsetWidth + parseFloat(getComputedStyle(railElement).columnGap)) * 3;
  }

  function scrollQuestion(id: string, bottom = false) {
    const element = questions.current.get(id);
    const container = transcript.current;
    if (!element || !container) return;
    container.scrollTo({ top: bottom ? element.offsetTop + element.offsetHeight - container.clientHeight : element.offsetTop, behavior: "instant" });
  }

  function select(problem: Problem, retry = false) {
    setError("");
    setAnswer("");
    if (retry) resetProblem(problem.id);
    const previous = [...conversation.questions].reverse().find(q => q.problem.id === problem.id);
    if (previous && !retry) {
      commit({ ...conversation, activeId: previous.id });
      scrollQuestion(previous.id);
    } else commit(addQuestion(conversation, problem));
    input.current?.focus();
  }

  function submit(value: string) {
    if (!active || done) return;
    const given = normalizedAnswer(value);
    if (isAime(active.problem) ? !/^\d{1,3}$/.test(value.trim()) : !LETTERS.includes(given)) {
      setError(isAime(active.problem) ? "Enter an integer from 0 to 999." : "Enter A, B, C, D, or E.");
      input.current?.focus();
      return;
    }
    if (entry?.attempts.some(attempt => normalizedAnswer(attempt) === given)) {
      setError("You already tried that answer.");
      input.current?.focus();
      return;
    }
    const result = submitAnswer(active.problem.id, given, active.problem.answer);
    const left = MAX_ATTEMPTS - result.attempts.length;
    const feedback = result.status === "solved" ? `Correct on attempt ${result.attempts.length}!` : result.status === "failed" ? "Out of attempts." : `Incorrect, ${left} attempt${left === 1 ? "" : "s"} left.`;
    commit({ ...conversation, questions: conversation.questions.map(q => q.id === active.id ? { ...q, replies: [...q.replies, { answer: given, feedback, status: result.status }] } : q) });
    setAnswer("");
    setError("");
    requestAnimationFrame(() => { scrollQuestion(active.id, true); input.current?.focus(); });
  }

  const next = list.find(p => !progress[p.id] || progress[p.id]?.status === "in-progress");

  return (
    <div className="topic-workspace">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Continue Learning</h1>
        <div className="relative w-52 max-w-full">
          <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input aria-label="Search topics" placeholder="Search topics" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      </header>

      <nav aria-label="Topics" className="topic-tabs">
        {TOPICS.filter(t => t.toLowerCase().includes(search.toLowerCase())).map(t => (
          <Button key={t} asChild variant={t === topic ? "default" : "secondary"}>
            <Link to="/topics/$slug" params={{ slug: slugify(t) }} aria-current={t === topic ? "page" : undefined}>{t}</Link>
          </Button>
        ))}
        {TOPICS.filter(t => t.toLowerCase().includes(search.toLowerCase())).length === 0 && <p className="text-sm text-muted-foreground">No matching topics.</p>}
      </nav>

      <section className="topic-practice-band" aria-label={`${topic} practice`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold">{topic}</h2>
          <Button size="sm" disabled={!ready || !next} onClick={() => { if (next) select(next); }}>Start next problem <ChevronRight /></Button>
        </div>
        <div className="mt-4 flex items-center gap-3 text-sm">
          <span className="shrink-0 font-medium">Practice Problems</span>
          <Progress value={percent} className="h-2 flex-1" />
          <span className="text-muted-foreground">{percent}%</span>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">{solved}/{all.length} solved</span>
          <select aria-label="Filter problems by contest" className="topic-contest-select" value={contest} onChange={e => setContest(e.target.value)}>
            <option value="all">All contests</option>
            {CONTESTS.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="mt-3 flex min-w-0 items-center gap-2">
          <Button variant="ghost" size="icon" aria-label="Scroll to easier problems" onClick={() => rail.current?.scrollBy({ left: -railStep(), behavior: "smooth" })}><ChevronLeft /></Button>
          <div ref={rail} className="problem-tile-rail" aria-label="Problems ordered easiest to hardest">
            {list.map(p => (
              <Button key={p.id} variant="secondary" disabled={!ready} aria-pressed={active?.problem.id === p.id} onClick={() => select(p)} className={`problem-tile ${active?.problem.id === p.id ? "problem-tile-active" : ""} ${progress[p.id]?.status === "solved" ? "problem-tile-solved" : progress[p.id]?.status === "failed" ? "problem-tile-failed" : ""}`}>
                <span>{p.contest}{p.version ? ` ${p.version}` : ""}</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">#{p.number} · {p.year} {progress[p.id]?.status === "solved" && <Check className="size-3" />}</span>
                <span className="sr-only">{tileLabel(p)}</span>
              </Button>
            ))}
            {list.length === 0 && <p className="py-3 text-sm text-muted-foreground">No problems in this topic for this contest.</p>}
          </div>
          <Button variant="ghost" size="icon" aria-label="Scroll to harder problems" onClick={() => rail.current?.scrollBy({ left: railStep(), behavior: "smooth" })}><ChevronRight /></Button>
        </div>
      </section>

      <section className="practice-chat" aria-label="Saved practice chat">
        <div className="flex items-center gap-2 border-b pb-3 text-sm font-medium"><Bot className="size-5 text-primary" /> Modulo Practice <span className="ml-auto text-xs font-normal text-muted-foreground">{conversation.questions.length} questions</span></div>
        <div ref={transcript} className="practice-transcript" role="log" aria-label="Practice conversation" aria-live="polite">
          {conversation.questions.length === 0 && <div className="py-8"><BotHeading /><p className="mt-2 text-muted-foreground">Ready for your next challenge?</p></div>}
          {conversation.questions.map(q => (
            <div key={q.id} ref={element => { if (element) questions.current.set(q.id, element); else questions.current.delete(q.id); }} className="practice-question">
              <BotHeading time={q.startedAt} />
              <h3 className="mt-2 font-semibold">{tileLabel(q.problem)}</h3>
              <div className="practice-math mt-3"><Latex>{q.problem.statementLatex}</Latex></div>
              {!isAime(q.problem) && q.problem.choices.some(Boolean) && <div className="mt-4 grid gap-2 sm:grid-cols-2">{q.problem.choices.map((choice, i) => <div key={i} className="practice-math flex gap-2 text-sm"><strong>({LETTERS[i]})</strong><Latex>{choice}</Latex></div>)}</div>}
              {q.replies.map((reply, i) => (
                <div key={i} className="mt-5 space-y-3">
                  <div className="flex justify-end"><div className="practice-answer"><span className="mr-3 text-xs opacity-80">You</span>{reply.answer}</div></div>
                  <div className={reply.status === "solved" ? "text-success" : "text-destructive"}><span className="mr-2 text-xs font-semibold">Modulo Practice</span>{reply.feedback}</div>
                  {reply.status !== "in-progress" && <Solution problem={q.problem} />}
                </div>
              ))}
              {q.id === active?.id && done && q.replies.at(-1)?.status !== "solved" && q.replies.at(-1)?.status !== "failed" && <div className="mt-4"><p className="mb-2 text-sm text-muted-foreground">Previously {entry?.status}.</p><Solution problem={q.problem} /></div>}
            </div>
          ))}
        </div>
        <div className="practice-composer">
          {active && <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground"><span>{tileLabel(active.problem)}</span>{done ? <Button size="sm" variant="ghost" onClick={() => select(active.problem, true)}><RotateCcw /> Retry problem</Button> : <span>Attempt {(entry?.attempts.length ?? 0) + 1} of {MAX_ATTEMPTS}</span>}</div>}
          {active && !done && !isAime(active.problem) && <div className="mb-3 flex gap-2">{LETTERS.map(letter => <Button key={letter} variant="outline" aria-label={`Answer ${letter}`} disabled={entry?.attempts.includes(letter)} onClick={() => submit(letter)} className="size-10 p-0">{letter}</Button>)}</div>}
          <form className="flex gap-2" onSubmit={e => { e.preventDefault(); submit(answer); }}>
            <Input ref={input} aria-label="Your answer" placeholder={!active ? "Choose a problem above" : done ? "Problem complete" : isAime(active.problem) ? "Your answer (000–999)" : "Your answer (A–E)"} disabled={!ready || !active || done} inputMode={active && isAime(active.problem) ? "numeric" : "text"} value={answer} onChange={e => setAnswer(e.target.value)} autoComplete="off" className="h-12" />
            <Button type="submit" size="icon" aria-label="Send answer" disabled={!ready || !active || done || !answer.trim()} className="size-12 shrink-0"><Send /></Button>
          </form>
          {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
        </div>
      </section>
    </div>
  );
}

function BotHeading({ time }: { time?: string }) {
  return <div className="flex flex-wrap items-center gap-2 text-sm"><span className="practice-bot-mark"><Bot className="size-4" /></span><span className="font-semibold text-primary">Modulo Practice</span>{time && <time className="text-xs text-muted-foreground" dateTime={time}>{new Date(time).toLocaleString()}</time>}</div>;
}

function Solution({ problem }: { problem: Problem }) {
  return <div className="space-y-2 text-sm"><p>Correct answer: <strong>{isAime(problem) ? problem.answer.padStart(3, "0") : problem.answer}</strong></p><Button asChild size="sm"><a href={problem.solutionUrl} target="_blank" rel="noopener noreferrer">View Solution on AoPS <ExternalLink /></a></Button></div>;
}