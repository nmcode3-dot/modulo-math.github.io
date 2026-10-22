import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { BookOpen, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProblemView } from "@/components/ProblemView";
import { getProblem, label, PROBLEMS } from "@/lib/problems";
import { giveUp, useProgress } from "@/lib/progress";

export const Route = createFileRoute("/problem/$id")({
  loader: ({ params }) => {
    const p = getProblem(params.id);
    if (!p) throw notFound();
    return { title: label(p) };
  },
  head: ({ loaderData }) => {
    const t = loaderData ? `${loaderData.title} — Modulo` : "Problem not found — Modulo";
    return {
      meta: [
        { title: t },
        { name: "description", content: `Solve ${loaderData?.title ?? "this problem"} with 3 attempts.` },
        { property: "og:title", content: t },
        { property: "og:description", content: "Competition math practice on Modulo." },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  notFoundComponent: () => <p>Problem not found.</p>,
  component: ProblemPage,
});

function ProblemPage() {
  const { id } = Route.useParams();
  const p = getProblem(id)!;
  const navigate = useNavigate({ from: "/problem/$id" });
  const progress = useProgress();
  const status = progress[id]?.status;
  const done = status === "solved" || status === "failed";

  const drawRandom = () => {
    const pool = PROBLEMS.filter((x) => x.contest === p.contest && x.id !== id);
    const r = pool[Math.floor(Math.random() * pool.length)];
    if (r) navigate({ to: "/problem/$id", params: { id: r.id } });
  };

  return (
    <div className="space-y-6">
      <Link to="/contests" search={{ contest: p.contest }} className="text-sm text-muted-foreground hover:text-foreground">
        ← {p.year} {p.contest} {p.version}
      </Link>
      <ProblemView key={id} problem={p} />
      <div className="flex flex-wrap gap-3 border-t pt-4">
        {!done && (
          <Button variant="outline" onClick={() => giveUp(id)}>
            <BookOpen className="size-4" /> Show solution
          </Button>
        )}
        {done && (
          <Button onClick={drawRandom}>
            <Shuffle className="size-4" /> Random problem
          </Button>
        )}
      </div>
    </div>
  );
}
