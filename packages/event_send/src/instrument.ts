import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import "./env";

const env = process.env["ENV"] ?? "";

Sentry.init({
	dsn: process.env["SENTRY_DSN"] ?? "",
	integrations: [nodeProfilingIntegration()],
	tracesSampleRate: 1.0,
	profilesSampleRate: 1.0,
	environment: env === "local" ? `local-${process.env["DEV_NAME"] ?? ""}` : env,
});
