import "./env";
import { app } from "./app";
import { logger } from "./log";

const port = process.env["PORT"] ?? 3000;
app.listen(port, () => {
  logger.info(`stela listening on port ${port}`);
});
