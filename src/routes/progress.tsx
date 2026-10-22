import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Download, Shuffle, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CONTESTS, PROBLEMS, TOPICS, type Problem } from "@/lib/problems";
import { exportProgress, importProgress, resetProblem, useProgress, type ProgressMap } from "@/lib/progress";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "My Progress — Modulo" },
      { name: "description", content: "Your solved count, accuracy and first-try rate, plus export and import." },
      { property: "og:title", content: "My Progress — Modulo" },
      { property: "og:description", content: "Track your competition math progress." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProgressPage,
});

function stats(ps: Problem[], pr: ProgressMap) {
  const done = ps.filter((p) => pr[p.id] && pr[p.id]?.status !== "in-progress");
  const solved = done.filter((p) => pr[p.id]?.status === "solved");
  const first = solved.filter((p) => pr[p.id]?.attempts.length === 1);
  return { total: ps.length, done: done.length, solved: solved.length, first: first.length };
}
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "—");

function ProgressPage() {
  const pr = useProgress();
  const fileRef = useRef<HTMLInputElement>(null);
  const s = stats(PROBLEMS, pr);
  const failed = PROBLEMS.filter((p) => pr[p.id]?.status === "failed");

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-4xl">My Progress</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportProgress}><Download className="size-4" /> Export Progress</Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()}><Upload className="size-4" /> Import Progress</Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              try {
                await importProgress(f);
                toast.success("Progress imported");
              } catch {
                toast.error("That file isn't a valid Modulo progress file");
              }
              e.target.value = "";
            }}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Problems solved" value={`${s.solved}`} sub={`of ${s.total}`} />
        <Stat label="Accuracy" value={pct(s.solved, s.done)} sub={`${s.done} completed`} />
        <Stat label="First-try rate" value={pct(s.first, s.done)} sub={`${s.first} on attempt 1`} />
      </div>

      <Breakdown title="By contest" rows={CONTESTS.map((c) => [c, stats(PROBLEMS.filter((p) => p.contest === c), pr)])} />

      <RetrySection failed={failed} />
    </div>
  );
}

function RetrySection({ failed }: { failed: Problem[] }) {
  const navigate = useNavigate();
  const [contest, setContest] = useState("all");
  const [topic, setTopic] = useState("all");
  const topics = TOPICS.filter((t) => failed.some((p) => p.topics.includes(t)));
  const pool = failed.filter(
    (p) => (contest === "all" || p.contest === contest) && (topic === "all" || p.topics.includes(topic)),
  );
  const draw = () => {
    const p = pool[Math.floor(Math.random() * pool.length)];
    if (!p) return;
    resetProblem(p.id);
    navigate({ to: "/problem/$id", params: { id: p.id } });
  };

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-display text-2xl">Problems to retry</h2>
        <p className="text-sm text-muted-foreground">
          {failed.length} failed so far. Filter them, then get a random one to try again with 3 fresh attempts.
        </p>
      </div>
      <div className="space-y-2">
        <p className="section-label">Contest</p>
        <div className="flex flex-wrap gap-2">
          {["all", ...CONTESTS].map((c) => (
            <button key={c} onClick={() => setContest(c)} className={`chip ${contest === c ? "chip-active" : ""}`}>
              {c === "all" ? "Any" : c}{" "}
              <span className={contest === c ? "" : "text-muted-foreground"}>
                · {c === "all" ? failed.length : failed.filter((p) => p.contest === c).length}
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <p className="section-label">Topic</p>
        <select
          aria-label="Filter retry problems by topic"
          className="topic-contest-select"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        >
          <option value="all">All topics</option>
          {topics.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button size="lg" disabled={pool.length === 0} onClick={draw}>
          <Shuffle className="size-4" /> Random problem to retry
        </Button>
        <span className="text-sm text-muted-foreground">
          {pool.length === 0 ? "No failed problems match these filters." : `${pool.length} match`}
        </span>
      </div>
    </section>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <p className="section-label">{label}</p>
      <p className="font-display text-4xl">{value}</p>
      <p className="text-sm text-muted-foreground">{sub}</p>
    </div>
  );
}

function Breakdown({ title, rows }: { title: string; rows: readonly (readonly [string, ReturnType<typeof stats>])[] }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-2xl">{title}</h2>
      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground">
            <tr><th className="p-3">Name</th><th className="p-3">Solved</th><th className="p-3">Accuracy</th><th className="p-3">First try</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map(([n, x]) => (
              <tr key={n}><td className="p-3 font-medium">{n}</td><td className="p-3">{x.solved}/{x.total}</td><td className="p-3">{pct(x.solved, x.done)}</td><td className="p-3">{pct(x.first, x.done)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
