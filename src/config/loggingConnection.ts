import { env } from "../utils/env";
import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

try {
  console.log("Connecting to Sentry with DNS:", env.SENTRY_DSN);

  Sentry.init({
    dsn: env.SENTRY_DSN,
    integrations: [
      nodeProfilingIntegration(),
    ],
    tracesSampleRate: 1.0, // adjust this based on your need for performance monitoring
    profilesSampleRate: 1.0
  });

  console.log("Successful connection to Sentry");
} catch (error: any) {
  console.log("Failed connection to Sentry:", error.message);
}
