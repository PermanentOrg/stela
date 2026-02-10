import type { SQSHandler, SQSEvent, SQSRecord } from "aws-lambda";
import { validateSqsMessage } from "@stela/s3-utils";
import { logger } from "@stela/logger";
import { validateRecordSubmitEvent } from "@stela/event_utils";
import { db } from "./database";

type Action = "create" | "copy" | "delete";

interface ParsedEvent {
	recordId: string;
	action: Action;
}

export const extractRecordEventFromSqsMessage = (
	message: SQSRecord,
): ParsedEvent => {
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

	if (action === "copy") {
		if (parsedMessage.body.newRecord === undefined) {
			logger.error(
				`record.copy event missing newRecord: ${JSON.stringify(
					parsedMessage.body,
				)}`,
			);
			throw new Error("newRecord field missing in body of record.copy");
		}
		return {
			recordId: parsedMessage.body.newRecord.recordId,
			action: "copy",
		};
	}

	if (parsedMessage.body.record === undefined) {
		logger.error(
			`record.${action} event missing record: ${JSON.stringify(
				parsedMessage.body,
			)}`,
		);
		throw new Error(`record field missing in body of record.${action}`);
	}
	return {
		recordId: parsedMessage.body.record.recordId,
		action: action as Action,
	};
};

export const handler: SQSHandler = async (event: SQSEvent) => {
	await Promise.all(
		event.Records.map(async (message) => {
			const { recordId, action } =
				extractRecordEventFromSqsMessage(message);

			const delta = action === "delete" ? -1 : 1;

			await db.sql("queries.update_folder_size", {
				recordId,
				delta,
			});
		}),
	);
};
