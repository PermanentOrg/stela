import _ from "newrelic";
import { logger } from "@stela/logger";
import "./env";
import { app } from "./app";

const DEFAULT_PORT = 8080;
const port = process.env["PORT"] ?? DEFAULT_PORT;
app.listen(port, () => {
	logger.info(`stela listening on port ${port}`);
});
