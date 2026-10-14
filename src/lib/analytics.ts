import { getGaMeasurementId } from "./analytics.functions";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let started = false;

// Loads gtag.js once, using the measurement ID stored as a project secret.
export async function initAnalytics() {
  if (started || typeof window === "undefined") return;
  started = true;
  const id = await getGaMeasurementId();
  if (!id) return;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = (...args: unknown[]) => {
    window.dataLayer!.push(args);
  };
  window.gtag("js", new Date());
  window.gtag("config", id);
}

// gtag only auto-tracks the initial page load, so client-side route changes
// send a page_view manually.
export function trackPageView(path: string) {
  window.gtag?.("event", "page_view", { page_path: path });
}
