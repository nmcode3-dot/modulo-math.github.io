import { createFileRoute, redirect } from "@tanstack/react-router";
import { slugify, TOPICS } from "@/lib/problems";

// Clicking "Topic Drills" lands on a random topic's workspace immediately.
export const Route = createFileRoute("/topics/")({
  head: () => ({
    meta: [
      { title: "Random Topic Practice — Modulo" },
      { name: "description", content: "Start a random AMC or AIME topic practice session in Modulo." },
      { property: "og:title", content: "Random Topic Practice — Modulo" },
      { property: "og:description", content: "Open a random competition math topic and practice with saved solutions." },
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
