import "./env";
import { app } from "./app";
import { logger } from "./log";

const port = process.env["PORT"] ?? 8080;
app.listen(port, () => {
  logger.info(`stela listening on port ${port}`);
});
