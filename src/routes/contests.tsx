import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { ArrowRight, BookOpen, Shuffle, Target, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CONTESTS, PROBLEMS } from "@/lib/problems";
import { useProgress } from "@/lib/progress";

type Search = { contest?: string | undefined };

export const Route = createFileRoute("/contests")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    contest: typeof s["contest"] === "string" ? s["contest"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Contest Practice — Modulo" },
      { name: "description", content: "Practice random AMC 8, AMC 10, AMC 12 and AIME problems." },
      { property: "og:title", content: "Contest Practice — Modulo" },
      { property: "og:description", content: "Practice random AMC and AIME problems." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ContestPractice,
});

const INFO: Record<string, { grade: string; format: string; length: string }> = {
  "AMC 8": { grade: "Middle school", format: "Multiple choice A–E", length: "25 problems · 40 min" },
  "AMC 10": { grade: "Grade 10 & below", format: "Multiple choice A–E", length: "25 problems · 75 min" },
  "AMC 12": { grade: "Grade 12 & below", format: "Multiple choice A–E", length: "25 problems · 75 min" },
  AIME: { grade: "Invitational", format: "Integer answer 000–999", length: "15 problems · 3 hours" },
};

function ContestPractice() {
  const { contest } = Route.useSearch();
  const navigate = useNavigate({ from: "/contests" });
  const progress = useProgress();

  const draw = (c?: string) => {
    const pool = c ? PROBLEMS.filter((p) => p.contest === c) : PROBLEMS;
    const p = pool[Math.floor(Math.random() * pool.length)];
    if (p) navigate({ to: "/problem/$id", params: { id: p.id } });
  };

  const stats = useMemo(() => {
    const byContest: Record<string, { total: number; solved: number }> = {};
    for (const p of PROBLEMS) {
      const s = (byContest[p.contest] ??= { total: 0, solved: 0 });
      s.total++;
      if (progress[p.id]?.status === "solved") s.solved++;
    }
    const entries = Object.values(progress);
    const solved = entries.filter((e) => e.status === "solved").length;
    const done = entries.filter((e) => e.status !== "in-progress").length;
    const firstTry = entries.filter((e) => e.status === "solved" && e.attempts.length === 1).length;
    const failed = entries.filter((e) => e.status === "failed").length;
    return { byContest, solved, done, firstTry, failed };
  }, [progress]);

  const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">Contest Practice</h1>
          <p className="text-muted-foreground">
            {PROBLEMS.length.toLocaleString()} real contest problems — pick a contest, get a random one.
          </p>
        </div>
        <Button size="lg" onClick={() => draw(contest)}>
          <Shuffle className="size-4" /> {contest ? `Random ${contest} problem` : "Random from any contest"}
        </Button>
      </div>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Solved", value: stats.solved.toLocaleString() },
          { label: "Accuracy", value: `${pct(stats.solved, stats.done)}%` },
          { label: "First-try rate", value: `${pct(stats.firstTry, stats.solved)}%` },
          { label: "To retry", value: stats.failed.toLocaleString() },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border bg-card p-4">
            <div className="section-label">{s.label}</div>
            <div className="mt-1 font-display text-3xl">{s.value}</div>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="section-label">Choose a contest</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {CONTESTS.map((c) => {
            const s = stats.byContest[c] ?? { total: 0, solved: 0 };
            const info = INFO[c];
            const active = contest === c;
            return (
              <button
                key={c}
                onClick={() => draw(c)}
                className={`group flex flex-col gap-4 rounded-xl border bg-card p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-md ${active ? "border-primary ring-1 ring-primary" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-display text-2xl">{c}</div>
                    {info && <div className="text-xs text-muted-foreground">{info.grade}</div>}
                  </div>
                  <Trophy className="size-5 text-muted-foreground group-hover:text-primary" />
                </div>
                {info && (
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div>{info.format}</div>
                    <div>{info.length}</div>
                  </div>
                )}
                <div className="mt-auto space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{s.solved} / {s.total.toLocaleString()} solved</span>
                    <span>{pct(s.solved, s.total)}%</span>
                  </div>
                  <Progress value={pct(s.solved, s.total)} className="h-1.5" />
                </div>
                <div className="flex items-center gap-1 text-sm font-medium text-primary">
                  Draw a problem <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { icon: Target, title: "3 attempts per problem", body: "Wrong answers tell you how many tries are left — never the answer itself." },
          { icon: BookOpen, title: "Solutions on the page", body: "Once you finish, the full written solution appears right below the problem." },
          { icon: Shuffle, title: "Always random", body: "Every draw is a fresh problem from decades of official contests." },
        ].map(({ icon: Icon, title, body }) => (
          <div key={title} className="flex gap-3 rounded-lg border border-dashed p-4">
            <Icon className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <div className="font-medium">{title}</div>
              <p className="text-sm text-muted-foreground">{body}</p>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
