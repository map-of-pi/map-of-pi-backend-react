import { env } from "../utils/env";
import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import { transports } from "winston";

// initialize Sentry only in production environment
if (env.NODE_ENV === 'production') {
  try {
    // initialize Sentry
    Sentry.init({
      dsn: env.SENTRY_DSN,
      integrations: [
        nodeProfilingIntegration(),
      ],
      tracesSampleRate: 1.0, // adjust this based on your need for performance monitoring
      profilesSampleRate: 1.0
    });

  } catch (error: any) {
    throw new Error(`Failed connection to Sentry: ${error}`);
  }
}

// create a custom Sentry transport for Winston in production
class SentryTransport extends transports.Stream {
  log(info: any, callback: () => void) {
    setImmediate(() => this.emit('logged', info));

    if (info.level === 'error') {
      if (info.error instanceof Error) {
        Sentry.captureException(info.error);
      } else {
        // fallback to message if error is not passed properly
        Sentry.captureMessage(info.message || JSON.stringify(info), 'error');
      }
      callback();
      return true;
    }
  }
}

export { SentryTransport };
