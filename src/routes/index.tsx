// ============= Full file contents =============

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CONTESTS, PROBLEMS } from "@/lib/problems";

type Search = { contest?: string | undefined };

export const Route = createFileRoute("/")({
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

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`chip ${active ? "chip-active" : ""}`}>
      {children}
    </button>
  );
}

function ContestPractice() {
  const { contest } = Route.useSearch();
  const navigate = useNavigate({ from: "/" });

  const pool = useMemo(
    () => (contest ? PROBLEMS.filter((p) => p.contest === contest) : PROBLEMS),
    [contest],
  );

  const random = useMemo(
    () => () => {
      const p = pool[Math.floor(Math.random() * pool.length)];
      if (p) navigate({ to: "/problem/$id", params: { id: p.id } });
    },
    [pool, navigate],
  );

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-4xl">Contest Practice</h1>
        <p className="text-muted-foreground">
          {PROBLEMS.length} problems loaded — pick a contest, get a random problem.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="section-label">Contest</h2>
        <div className="flex flex-wrap gap-2">
          <Chip active={!contest} onClick={random}>Any</Chip>
          {CONTESTS.map((c) => {
            const count = PROBLEMS.filter((p) => p.contest === c).length;
            return (
              <Chip
                key={c}
                active={contest === c}
                onClick={() => {
                  if (contest === c) {
                    random();
                  } else {
                    navigate({ search: { contest: c } });
                  }
                }}
              >
                {c} <span className="text-muted-foreground">· {count}</span>
              </Chip>
            );
          })}
        </div>
      </section>

      <div className="flex flex-col items-start gap-4">
        <Button size="lg" onClick={random}>
          <Shuffle className="size-4" /> {contest ? `Random ${contest} problem` : "Random problem"}
        </Button>
        <p className="text-sm text-muted-foreground">Or tap a contest above to dive straight in.</p>
      </div>
    </div>
  );
}
