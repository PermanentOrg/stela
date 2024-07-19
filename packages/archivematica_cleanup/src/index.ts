import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import { logger } from "@stela/logger";
import "./env";

const env = process.env["ENV"] ?? "";
Sentry.init({
  dsn: process.env["SENTRY_DSN"] ?? "",
  integrations: [nodeProfilingIntegration()],
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
  environment: env === "local" ? `local-${process.env["DEV_NAME"] ?? ""}` : env,
});

export const cleanupDashboard = async (): Promise<void> => {
  const transferDeleteResponse = await fetch(
    `${process.env["ARCHIVEMATICA_BASE_URL"] ?? ""}/api/transfer/delete`,
    {
      method: "DELETE",
      headers: {
        Authorization: `ApiKey ${process.env["ARCHIVEMATICA_API_KEY"] ?? ""}`,
      },
    }
  );
  if (!transferDeleteResponse.ok) {
    logger.error(await transferDeleteResponse.text());
    Sentry.captureMessage(await transferDeleteResponse.text());
    return;
  }
  const ingestDeleteResponse = await fetch(
    `${process.env["ARCHIVEMATICA_BASE_URL"] ?? ""}/api/ingest/delete`,
    {
      method: "DELETE",
      headers: {
        Authorization: `ApiKey ${process.env["ARCHIVEMATICA_API_KEY"] ?? ""}`,
      },
    }
  );
  if (!ingestDeleteResponse.ok) {
    logger.error(await ingestDeleteResponse.text());
    Sentry.captureMessage(await ingestDeleteResponse.text());
  }
};

cleanupDashboard()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    logger.error(error);
    Sentry.captureException(error);
    process.exit(1);
  });
