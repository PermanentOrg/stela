import { logger } from "@stela/logger";
import { publisherClient } from "@stela/publisher-utils";
import {
	type EventRow,
	toEventMessage,
	trackMixpanelEvent,
} from "@stela/event_utils";
import { mixpanelClient } from "./mixpanel.js";
import { db } from "./database.js";

const EVENT_BATCH_SIZE = 100;
const MAX_SEND_ATTEMPTS = 3;

const recordSendAttempts = async (
	allEventIds: string[],
	sentEventIds: string[],
): Promise<void> => {
	await db
		.sql("queries.record_send_attempts", {
			eventIds: allEventIds,
			sentEventIds,
		})
		.catch((err: unknown) => {
			logger.error(err);
			throw err;
		});
};

const sendEventBatch = async (
	batchSize: number,
	excludedEventIds: string[],
): Promise<{ fetchedCount: number; failedEventIds: string[] }> => {
	const events = await db
		.sql<EventRow>("queries.get_unsent_events", {
			batchSize,
			excludedEventIds,
			maxSendAttempts: MAX_SEND_ATTEMPTS,
		})
		.catch((err: unknown) => {
			logger.error(err);
			throw err;
		});

	if (events.rows.length === 0) {
		return { fetchedCount: 0, failedEventIds: [] };
	}

	const messages = events.rows.map(toEventMessage);

	for (const event of events.rows) {
		trackMixpanelEvent(event, mixpanelClient);
	}

	const eventIds = events.rows.map((event) => event.id);

	const { failedMessages } = await publisherClient
		.batchPublishMessages(process.env["EVENT_TOPIC_ARN"] ?? "", messages)
		.catch(async (err: unknown) => {
			logger.error(err);
			await recordSendAttempts(eventIds, []);
			throw err;
		});

	if (failedMessages.length > 0) {
		logger.warn(`Failed to publish events: ${failedMessages.join(", ")}`);
	}

	await recordSendAttempts(
		eventIds,
		eventIds.filter((id) => !failedMessages.includes(id)),
	);

	return { fetchedCount: events.rows.length, failedEventIds: failedMessages };
};

const sendRemainingEvents = async (
	batchSize: number,
	failedEventIds: string[],
): Promise<void> => {
	const result = await sendEventBatch(batchSize, failedEventIds);
	if (result.fetchedCount < batchSize) {
		return;
	}
	await sendRemainingEvents(batchSize, [
		...failedEventIds,
		...result.failedEventIds,
	]);
};

export const sendEvents = async (
	batchSize: number = EVENT_BATCH_SIZE,
): Promise<void> => {
	await sendRemainingEvents(batchSize, []);
};
