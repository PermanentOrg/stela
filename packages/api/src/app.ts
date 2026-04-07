import "./instrument";
import * as Sentry from "@sentry/node";
import express from "express";
import cors from "cors";
import expressWinston from "express-winston";
import { logger } from "@stela/logger";
import { apiRoutes } from "./routes";
import { handleError } from "./middleware/handleError";
import { handleValidationError } from "./middleware/handleValidationError";

const env = process.env["ENV"] ?? "";

const app = express();

app.set("query parser", "extended");

app.use(
	cors({
		origin: `https://${env === "production" ? "www" : `app.${env}`}.permanent.org`,
	}),
);

app.use(expressWinston.logger({ level: "http", winstonInstance: logger }));
// Must be before express.json() so the raw body is available for Stripe signature verification
app.use(
	"/api/v2/storage-purchases/stripe/webhook",
	express.raw({ type: "application/json" }),
);
app.use(express.json());

// This is a temporary measure; it should be removed when the rest of
// our middleware is updated not to add request metadata to the request body
app.use((req, _res, next) => {
	if (req.body === undefined) {
		req.body = {};
	}
	next();
});

app.use("/api/v2", apiRoutes);
app.use(handleValidationError);
Sentry.setupExpressErrorHandler(app);
app.use(handleError);

export { app };
