import { Link } from "@tanstack/react-router";
import { label, type Problem } from "@/lib/problems";
import { useProgress } from "@/lib/progress";
import { StatusBadge } from "./StatusBadge";

export function ProblemList({ problems }: { problems: Problem[] }) {
  const progress = useProgress();
  if (problems.length === 0)
    return <p className="text-sm text-muted-foreground">No problems match these filters.</p>;
  return (
    <ul className="divide-y divide-border rounded-lg border bg-card">
      {problems.map((p) => (
        <li key={p.id}>
          <Link
            to="/problem/$id"
            params={{ id: p.id }}
            className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-accent"
          >
            <span className="font-medium">{label(p)}</span>
            <StatusBadge entry={progress[p.id]} />
          </Link>
        </li>
      ))}
    </ul>
  );
}
