import * as Sentry from "@sentry/node";
import "./env";

const env = process.env["ENV"] ?? "";
Sentry.init({
  dsn: process.env["SENTRY_DSN"] ?? "",
  tracesSampleRate: 1.0,
  environment: env === "local" ? `local-${process.env["DEV_NAME"] ?? ""}` : env,
});

export const cleanupDashboard = async (): Promise<void> => {
  try {
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
      Sentry.captureMessage(await ingestDeleteResponse.text());
      return;
    }
  } catch (error) {
    Sentry.captureException(error);
  }
};

cleanupDashboard()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    Sentry.captureException(error);
    process.exit(1);
  });
