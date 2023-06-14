import express from "express";
import cors from "cors";
import expressWinston from "express-winston";
import bodyParser from "body-parser";
import { apiRoutes } from "./routes";
import { logger } from "./log";
import { handleErrorWithStatus } from "./middleware/handleErrorWithStatus";

const env = process.env["ENV"] ?? "";

const app = express();
app.use(
  cors({
    origin: `https://${env === "production" ? "www" : `${env}`}.permanent.org`,
  })
);
app.use(expressWinston.logger({ level: "http", winstonInstance: logger }));
app.use(bodyParser.json());
app.use("/api/v2", apiRoutes);
app.use(handleErrorWithStatus);

export { app };
