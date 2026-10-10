import { createFileRoute, notFound } from "@tanstack/react-router";
import { TopicWorkspace } from "@/components/TopicWorkspace";
import { topicFromSlug } from "@/lib/problems";

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
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  notFoundComponent: () => <p>Topic not found.</p>,
  component: TopicPage,
});

function TopicPage() {
  const { topic } = Route.useLoaderData();
  return <TopicWorkspace key={topic} topic={topic} />;
}
