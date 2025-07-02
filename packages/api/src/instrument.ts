import * as Sentry from "@sentry/node";

const env = process.env["ENV"] ?? "";
Sentry.init({
	dsn: process.env["SENTRY_DSN"] ?? "",
	tracesSampleRate: 1.0,
	environment: env === "local" ? `local-${process.env["DEV_NAME"] ?? ""}` : env,
});
