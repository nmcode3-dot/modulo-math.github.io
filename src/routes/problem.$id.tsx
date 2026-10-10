import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProblemView } from "@/components/ProblemView";
import { getProblem, label, PROBLEMS } from "@/lib/problems";

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
  const set = PROBLEMS.filter((x) => x.contest === p.contest && x.year === p.year && x.version === p.version);
  const i = set.findIndex((x) => x.id === id);
  const prev = set[i - 1];
  const next = set[i + 1];
  return (
    <div className="space-y-6">
      <Link to="/contests" search={{ contest: p.contest }} className="text-sm text-muted-foreground hover:text-foreground">
        ← {p.year} {p.contest} {p.version}
      </Link>
      <ProblemView key={id} problem={p} />
      <nav className="flex justify-between border-t pt-4 text-sm">
        {prev ? <Link to="/problem/$id" params={{ id: prev.id }} className="flex items-center gap-1"><ChevronLeft className="size-4" />Problem {prev.number}</Link> : <span />}
        {next ? <Link to="/problem/$id" params={{ id: next.id }} className="flex items-center gap-1">Problem {next.number}<ChevronRight className="size-4" /></Link> : <span />}
      </nav>
    </div>
  );
}
