import { useSyncExternalStore } from "react";

export type Entry = { attempts: string[]; status: "in-progress" | "solved" | "failed" };
export type ProgressMap = Record<string, Entry>;

const KEY = "modulo-progress-v1";
export const MAX_ATTEMPTS = 3;
const EMPTY: ProgressMap = {};
let cache: ProgressMap | null = null;
const listeners = new Set<() => void>();

function read(): ProgressMap {
  if (cache) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    cache = {};
  }
  return cache!;
}
function write(next: ProgressMap) {
  cache = next;
  localStorage.setItem(KEY, JSON.stringify(next));
  listeners.forEach((l) => l());
}

export function useProgress(): ProgressMap {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    read,
    () => EMPTY,
  );
}

export function submitAnswer(id: string, given: string, correct: string): Entry {
  const all = read();
  const cur = all[id] ?? { attempts: [], status: "in-progress" as const };
  if (cur.status !== "in-progress") return cur;
  const attempts = [...cur.attempts, given];
  const ok = normalize(given) === normalize(correct);
  const status = ok ? "solved" : attempts.length >= MAX_ATTEMPTS ? "failed" : "in-progress";
  const entry: Entry = { attempts, status };
  write({ ...all, [id]: entry });
  return entry;
}

export function giveUp(id: string): Entry {
  const all = read();
  const cur = all[id] ?? { attempts: [], status: "in-progress" as const };
  if (cur.status !== "in-progress") return cur;
  const entry: Entry = { attempts: cur.attempts, status: "failed" };
  write({ ...all, [id]: entry });
  return entry;
}

export function resetProblem(id: string) {
  const { [id]: _, ...rest } = read();
  write(rest);
}

const normalize = (s: string) => (/^\d+$/.test(s.trim()) ? String(parseInt(s, 10)) : s.trim().toUpperCase());

export function exportProgress() {
  const blob = new Blob([JSON.stringify({ app: "modulo", version: 1, progress: read() }, null, 2)], {
    type: "application/json",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `modulo-progress-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export async function importProgress(file: File) {
  const data = JSON.parse(await file.text());
  const progress = data?.progress ?? data;
  if (typeof progress !== "object" || Array.isArray(progress)) throw new Error("Invalid file");
  write(progress as ProgressMap);
}
