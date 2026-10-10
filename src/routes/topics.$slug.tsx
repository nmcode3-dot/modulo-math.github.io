import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ProblemList } from "@/components/ProblemList";
import { byDifficulty, CONTESTS, PROBLEMS, topicFromSlug } from "@/lib/problems";
import { useProgress } from "@/lib/progress";

export const Route = createFileRoute("/topics/$slug")({
  loader: ({ params }) => {
    const topic = topicFromSlug(params.slug);
    if (!topic) throw notFound();
    return { topic };
  },
  head: ({ loaderData }) => {
    const t = `${loaderData?.topic ?? "Topic"} Drill — Modulo`;
    return {
      meta: [
        { title: t },
        { name: "description", content: `Practice ${loaderData?.topic ?? ""} problems from AMC and AIME.` },
        { property: "og:title", content: t },
        { property: "og:description", content: `Competition problems tagged ${loaderData?.topic ?? ""}.` },
      ],
    };
  },
  notFoundComponent: () => <p>Topic not found.</p>,
  component: TopicPage,
});

function TopicPage() {
  const { topic } = Route.useLoaderData();
  const progress = useProgress();
  const [contest, setContest] = useState<string | null>(null);
  const all = PROBLEMS.filter((p) => p.topics.includes(topic)).sort(byDifficulty);
  const list = all.filter((p) => !contest || p.contest === contest);
  const solved = all.filter((p) => progress[p.id]?.status === "solved").length;
  return (
    <div className="space-y-6">
      <Link to="/topics" className="text-sm text-muted-foreground hover:text-foreground">← All topics</Link>
      <div>
        <h1 className="font-display text-4xl">{topic}</h1>
        <p className="text-muted-foreground">{solved}/{all.length} solved</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button className={`chip ${!contest ? "chip-active" : ""}`} onClick={() => setContest(null)}>All</button>
        {CONTESTS.map((c) => (
          <button key={c} className={`chip ${contest === c ? "chip-active" : ""}`} onClick={() => setContest(c)}>{c}</button>
        ))}
      </div>
      <ProblemList problems={list} />
    </div>
  );
}
