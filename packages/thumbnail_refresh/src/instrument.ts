import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import "./env.js";

const env = process.env["ENV"] ?? "";

Sentry.init({
	dsn: process.env["SENTRY_DSN"] ?? "",
	integrations: [nodeProfilingIntegration()],
	tracesSampleRate: 1.0,
	profileSessionSampleRate: 1.0,
	profileLifecycle: "trace",
	environment: env === "local" ? `local-${process.env["DEV_NAME"] ?? ""}` : env,
});
