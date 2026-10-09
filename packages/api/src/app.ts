import "./instrument.js";
import express from "express";
import cors from "cors";
import expressWinston from "express-winston";
import { logger } from "@stela/logger";
import { apiRoutes } from "./routes/index.js";
import { handleError } from "./middleware/handleError.js";
import { handleValidationError } from "./middleware/handleValidationError.js";

const env = process.env["ENV"] ?? "";

const app = express();

app.set("query parser", "extended");

app.use(
	cors({
		origin: `https://${env === "production" ? "app" : `app.${env}`}.permanent.org`,
	}),
);

app.use(expressWinston.logger({ level: "http", winstonInstance: logger }));
// Must be before express.json() so the raw body is available for Stripe signature verification
app.use(
	"/api/v2/storage-purchases/stripe/webhook",
	express.raw({ type: "application/json" }),
);
app.use(express.json());

// Express 5 leaves req.body undefined when there is no parsable body. Many
// handlers validate req.body with Joi schemas that accept undefined and then
// read properties from it, so default it to an empty object.
app.use((req, _res, next) => {
	if (req.body === undefined) {
		req.body = {};
	}
	next();
});

app.use("/api/v2", apiRoutes);
app.use(handleValidationError);
app.use(handleError);

export { app };
