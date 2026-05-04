import "./instrument";
import * as Sentry from "@sentry/node";
import { logger } from "@stela/logger";
import "./env";
import { sendEvents } from "./service";

const EXIT_CODE_SUCCESS = 0;
const EXIT_CODE_ERROR = 1;

sendEvents()
	.then(() => {
		process.exit(EXIT_CODE_SUCCESS);
	})
	.catch((error: unknown) => {
		logger.error(error);
		Sentry.captureException(error);
		process.exit(EXIT_CODE_ERROR);
	});
