import "./instrument";
import * as Sentry from "@sentry/node";
import { logger } from "@stela/logger";
import "./env";
import { refreshFileUrls } from "./service";

refreshFileUrls()
	.then(() => {
		process.exit(0);
	})
	.catch((error) => {
		logger.error(error);
		Sentry.captureException(error);
		process.exit(1);
	});
