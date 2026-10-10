import { createFileRoute, Link } from "@tanstack/react-router";
import { Progress } from "@/components/ui/progress";
import { PROBLEMS, slugify, TOPICS } from "@/lib/problems";
import { useProgress } from "@/lib/progress";

export const Route = createFileRoute("/topics/")({
  head: () => ({
    meta: [
      { title: "Topic Drills — Modulo" },
      { name: "description", content: "Drill specific competition math topics like Stars and Bars, Power of a Point and Vieta's Formulas." },
      { property: "og:title", content: "Topic Drills — Modulo" },
      { property: "og:description", content: "Targeted competition math drills by specific topic." },
    ],
  }),
  component: Topics,
});

function Topics() {
  const progress = useProgress();
  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl">Topic Drills</h1>
      <div className="grid gap-3 sm:grid-cols-2">
        {TOPICS.map((t) => {
          const ps = PROBLEMS.filter((p) => p.topics.includes(t));
          const solved = ps.filter((p) => progress[p.id]?.status === "solved").length;
          return (
            <Link key={t} to="/topics/$slug" params={{ slug: slugify(t) }} className="rounded-lg border bg-card p-4 transition-colors hover:bg-accent">
              <div className="flex justify-between gap-2">
                <span className="font-medium">{t}</span>
                <span className="text-sm text-muted-foreground">{solved}/{ps.length} solved</span>
              </div>
              <Progress value={ps.length ? (solved / ps.length) * 100 : 0} className="mt-3 h-1.5" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
