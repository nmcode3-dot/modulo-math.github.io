import { createFileRoute } from "@tanstack/react-router";
import { useRef } from "react";
import { Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ProblemList } from "@/components/ProblemList";
import { CONTESTS, PROBLEMS, TOPICS, type Problem } from "@/lib/problems";
import { exportProgress, importProgress, useProgress, type ProgressMap } from "@/lib/progress";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "My Progress — Modulo" },
      { name: "description", content: "Your solved count, accuracy and first-try rate, plus export and import." },
      { property: "og:title", content: "My Progress — Modulo" },
      { property: "og:description", content: "Track your competition math progress." },
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
      <Breakdown
        title="By topic"
        rows={TOPICS.map((t) => [t, stats(PROBLEMS.filter((p) => p.topics.includes(t)), pr)] as const).filter(([, x]) => x.total > 0)}
      />

      <section className="space-y-3">
        <h2 className="font-display text-2xl">Failed problems to retry</h2>
        <ProblemList problems={failed} />
      </section>
    </div>
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
