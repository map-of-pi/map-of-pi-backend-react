import { env } from "../utils/env";
import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import { createLogger, format, transports, Logger } from "winston";

try {
  console.log("Connecting to Sentry with DNS:", env.SENTRY_DSN);

  // initialize Sentry
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

// create a custom Sentry transport for Winston
const sentryTransport = new transports.Stream({
  stream: {
    write: (message: string) => {
      // parse the message to JSON, if possible
      try {
        const logObject = JSON.parse(message);
        if (logObject.level === 'error') {
          Sentry.captureMessage(logObject.message, 'error');
        }
      } catch (error) {
        // If message is not JSON or parsing fails, log it as an error
        Sentry.captureMessage(message, 'error');
      }
    },
  },
});

// set up Winston logger with Sentry integration
const logger: Logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console(),
    sentryTransport
  ],
});

export default logger;
