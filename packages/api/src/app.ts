import "./instrument";
import * as Sentry from "@sentry/node";
import express from "express";
import cors from "cors";
import expressWinston from "express-winston";
import bodyParser from "body-parser";
import { logger } from "@stela/logger";
import { apiRoutes } from "./routes";
import { handleError } from "./middleware/handleError";

const env = process.env["ENV"] ?? "";

const app = express();

app.set("query parser", "extended");
app.use(
	cors({
		origin: `https://${env === "production" ? "www" : `${env}`}.permanent.org`,
	}),
);
app.use(expressWinston.logger({ level: "http", winstonInstance: logger }));
app.use(bodyParser.json());
app.use("/api/v2", apiRoutes);
Sentry.setupExpressErrorHandler(app);
app.use(handleError);

export { app };
