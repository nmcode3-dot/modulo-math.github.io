import { createServerFn } from "@tanstack/react-start";

// The GA measurement ID is public (every visitor's browser sees it), so it's
// safe to return to the client — but it lives as a secret so it can be rotated
// without a code change.
export const getGaMeasurementId = createServerFn({ method: "GET" }).handler(
  () => process.env.GOOGLE_ANALYTICS_MEASUREMENT_ID ?? null,
);
