import type { Entry } from "@/lib/progress";

export function StatusBadge({ entry }: { entry?: Entry | undefined }) {
  if (!entry || entry.attempts.length === 0)
    return <span className="status-pill status-none">Unattempted</span>;
  if (entry.status === "solved")
    return <span className="status-pill status-solved">Solved · try {entry.attempts.length}</span>;
  if (entry.status === "failed") return <span className="status-pill status-failed">Failed</span>;
  return <span className="status-pill status-progress">{entry.attempts.length}/3 used</span>;
}
