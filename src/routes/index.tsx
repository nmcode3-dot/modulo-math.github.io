import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProblemList } from "@/components/ProblemList";
import { CONTESTS, PROBLEMS } from "@/lib/problems";

type Search = { contest?: string | undefined; year?: number | undefined; version?: string | undefined };

export const Route = createFileRoute("/")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    contest: typeof s["contest"] === "string" ? s["contest"] : undefined,
    year: s["year"] ? Number(s["year"]) : undefined,
    version: typeof s["version"] === "string" ? s["version"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Contest Practice — Modulo" },
      { name: "description", content: "Browse AMC 8, AMC 10, AMC 12 and AIME problems by contest, year and version." },
      { property: "og:title", content: "Contest Practice — Modulo" },
      { property: "og:description", content: "Browse AMC and AIME problems by contest, year and version." },
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
  const { contest, year, version } = Route.useSearch();
  const navigate = useNavigate({ from: "/" });
  const set = (s: Search) => navigate({ search: s });

  const inContest = PROBLEMS.filter((p) => !contest || p.contest === contest);
  const years = [...new Set(inContest.map((p) => p.year))].sort((a, b) => b - a);
  const inYear = inContest.filter((p) => !year || p.year === year);
  const versions = [...new Set(inYear.map((p) => p.version).filter(Boolean))].sort();
  const list = inYear.filter((p) => !version || p.version === version);

  const random = useMemo(
    () => () => {
      const pool = list.length ? list : PROBLEMS;
      const p = pool[Math.floor(Math.random() * pool.length)];
      if (p) navigate({ to: "/problem/$id", params: { id: p.id } });
    },
    [list, navigate],
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">Contest Practice</h1>
          <p className="text-muted-foreground">{PROBLEMS.length} problems loaded</p>
        </div>
        <Button onClick={random}>
          <Shuffle className="size-4" /> Random problem
        </Button>
      </div>

      <section className="space-y-3">
        <h2 className="section-label">Contest</h2>
        <div className="flex flex-wrap gap-2">
          <Chip active={!contest} onClick={() => set({})}>All</Chip>
          {CONTESTS.map((c) => (
            <Chip key={c} active={contest === c} onClick={() => set({ contest: c })}>{c}</Chip>
          ))}
        </div>
        <h2 className="section-label">Year</h2>
        <div className="flex flex-wrap gap-2">
          <Chip active={!year} onClick={() => set({ contest })}>All</Chip>
          {years.map((y) => (
            <Chip key={y} active={year === y} onClick={() => set({ contest, year: y })}>{y}</Chip>
          ))}
        </div>
        {versions.length > 0 && (
          <>
            <h2 className="section-label">Version</h2>
            <div className="flex flex-wrap gap-2">
              <Chip active={!version} onClick={() => set({ contest, year })}>All</Chip>
              {versions.map((v) => (
                <Chip key={v} active={version === v} onClick={() => set({ contest, year, version: v })}>{v}</Chip>
              ))}
            </div>
          </>
        )}
      </section>

      <ProblemList problems={list} />
    </div>
  );
}
