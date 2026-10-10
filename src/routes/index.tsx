import { createFileRoute, redirect } from "@tanstack/react-router";
import { slugify, TOPICS } from "@/lib/problems";

// The home page is Topic Drills: every visit opens a random topic's practice chat.
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Topic Drills — Modulo" },
      { name: "description", content: "Practice competition math by topic: modular arithmetic, counting, geometry, probability and more." },
      { property: "og:title", content: "Topic Drills — Modulo" },
      { property: "og:description", content: "Practice competition math problems sorted by topic." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  beforeLoad: () => {
    const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)]!;
    throw redirect({
      to: "/topics/$slug",
      params: { slug: slugify(topic) },
    });
  },
});
