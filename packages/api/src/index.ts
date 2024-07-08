import _ from "newrelic";
import { logger } from "@stela/logger";
import "./env";
import { app } from "./app";

const port = process.env["PORT"] ?? 8080;
app.listen(port, () => {
  logger.info(`stela listening on port ${port}`);
});
