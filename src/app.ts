import express from "express";
import expressWinston from "express-winston";
import bodyParser from "body-parser";
import { apiRoutes } from "./routes";
import { logger } from "./log";
import { handleErrorWithStatus } from "./middleware/handleErrorWithStatus";

const app = express();
app.use(expressWinston.logger({ level: "http", winstonInstance: logger }));
app.use(bodyParser.json());
app.use("/api/v2", apiRoutes);
app.use(handleErrorWithStatus);

export { app };
