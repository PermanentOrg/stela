import "./instrument.js";
import * as Sentry from "@sentry/node";
import { logger } from "@stela/logger";
import "./env.js";
import { refreshFileUrls } from "./service.js";

const EXIT_CODE_SUCCESS = 0;
const EXIT_CODE_ERROR = 1;

refreshFileUrls()
	.then(() => {
		process.exit(EXIT_CODE_SUCCESS);
	})
	.catch((error: unknown) => {
		logger.error(error);
		Sentry.captureException(error);
		process.exit(EXIT_CODE_ERROR);
	});
