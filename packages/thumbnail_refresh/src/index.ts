import "./instrument";
import * as Sentry from "@sentry/node";
import { logger } from "@stela/logger";
import "./env";
import { refreshThumbnails } from "./service";

refreshThumbnails()
	.then(() => {
		process.exit(0);
	})
	.catch((error: unknown) => {
		logger.error(error);
		Sentry.captureException(error);
		process.exit(1);
	});
