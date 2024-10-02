import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import { logger } from "@stela/logger";
import "./env";
import { refreshThumbnails } from "./service";

const env = process.env["ENV"] ?? "";
Sentry.init({
  dsn: process.env["SENTRY_DSN"] ?? "",
  integrations: [nodeProfilingIntegration()],
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
  environment: env === "local" ? `local-${process.env["DEV_NAME"] ?? ""}` : env,
});

refreshThumbnails()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    logger.error(error);
    Sentry.captureException(error);
    process.exit(1);
  });
