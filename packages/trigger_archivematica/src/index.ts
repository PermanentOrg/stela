import type { SQSHandler, SQSEvent, SQSRecord } from "aws-lambda";
import * as Sentry from "@sentry/aws-serverless";
import { validateSqsMessage } from "@stela/s3-utils";
import { logger } from "@stela/logger";
import { triggerArchivematicaProcessing } from "@stela/archivematica-utils";
import { validateRecordSubmitEvent } from "@stela/event_utils";
import { db } from "./database";
import {
	ARCHIVEMATICA_HOST_URL,
	ARCHIVEMATICA_API_KEY,
	ARCHIVEMATICA_ORIGINAL_LOCATION_ID,
	ARCHIVEMATICA_PROCESSING_WORKFLOW,
} from "./env";

export const extractRecordIdFromNewRecordMessage = (
	message: SQSRecord,
): string => {
	const { body } = message;
	const parsedBody: unknown = JSON.parse(body);
	if (!validateSqsMessage(parsedBody)) {
		logger.error(`Invalid message body: ${body}`);
		throw new Error("Invalid message body");
	}
	const parsedMessage: unknown = JSON.parse(parsedBody.Message);
	if (!validateRecordSubmitEvent(parsedMessage)) {
		logger.error(`Invalid message: ${parsedBody.Message}`);
		throw new Error("Invalid message");
	}
	const { action } = parsedMessage;

	if (action === "create") {
		if (parsedMessage.body.record === undefined) {
			logger.error(
				`record.create event missing record: ${JSON.stringify(
					parsedMessage.body,
				)}`,
			);
			throw new Error("record field missing in body of record.create");
		}
		return parsedMessage.body.record.recordId;
	} else if (action === "copy") {
		if (parsedMessage.body.newRecord === undefined) {
			logger.error(
				`record.copy event missing newRecord: ${JSON.stringify(
					parsedMessage.body,
				)}`,
			);
			throw new Error("newRecord field missing in body of record.copy");
		}
		return parsedMessage.body.newRecord.recordId;
	}
	throw new Error("Unsupported action type");
};

export const handler: SQSHandler = Sentry.wrapHandler(
	async (event: SQSEvent) => {
		await Promise.all(
			event.Records.map(async (message) => {
				try {
					const recordId = extractRecordIdFromNewRecordMessage(message);
					const fileResult = await db.sql<{ fileId: string; filePath: string }>(
						"queries.get_file",
						{ recordId },
					);
					if (fileResult.rows[0] === undefined) {
						const message = `File not found for record ${recordId}`;
						logger.error(message);
						Sentry.captureMessage(message);
						return;
					}
					const response = await triggerArchivematicaProcessing(
						fileResult.rows[0].fileId,
						fileResult.rows[0].filePath,
						{
							archivematicaHostUrl: ARCHIVEMATICA_HOST_URL,
							archivematicaApiKey: ARCHIVEMATICA_API_KEY,
							archivematicaOriginalLocationId:
								ARCHIVEMATICA_ORIGINAL_LOCATION_ID,
							processingWorkflow: ARCHIVEMATICA_PROCESSING_WORKFLOW,
						},
					);
					if (!response.ok) {
						logger.error(response.status);
						throw new Error(
							`Call to Archivematica failed with status ${response.status}`,
						);
					}
				} catch (err: unknown) {
					logger.error(err);
					throw err;
				}
			}),
		);
	},
);
