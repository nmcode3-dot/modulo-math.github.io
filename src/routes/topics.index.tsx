import { createFileRoute, redirect } from "@tanstack/react-router";
import { slugify, TOPICS } from "@/lib/problems";

// Clicking "Topic Drills" lands on a random topic's workspace immediately.
export const Route = createFileRoute("/topics/")({
  beforeLoad: () => {
    const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
    throw redirect({
      to: "/topics/$slug",
      params: { slug: slugify(topic) },
    });
  },
});
