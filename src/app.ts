import * as Sentry from "@sentry/node";
import express from "express";
import cors from "cors";
import expressWinston from "express-winston";
import bodyParser from "body-parser";
import { apiRoutes } from "./routes";
import { logger } from "./log";
import { handleError } from "./middleware/handleError";

const env = process.env["ENV"] ?? "";

const app = express();

Sentry.init({
  dsn: process.env["SENTRY_DSN"] ?? "",
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express({ app }),
    ...Sentry.autoDiscoverNodePerformanceMonitoringIntegrations(),
  ],
  tracesSampleRate: 1.0,
  environment: env === "local" ? `local-${process.env["DEV_NAME"] ?? ""}` : env,
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());
app.use(
  cors({
    origin: `https://${env === "production" ? "www" : `${env}`}.permanent.org`,
  })
);
app.use(expressWinston.logger({ level: "http", winstonInstance: logger }));
app.use(bodyParser.json());
app.use("/api/v2", apiRoutes);
app.use(Sentry.Handlers.errorHandler());
app.use(handleError);

export { app };
