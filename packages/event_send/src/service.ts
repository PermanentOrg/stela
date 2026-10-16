import { logger } from "@stela/logger";
import { UAParser } from "ua-parser-js";
import { publisherClient } from "@stela/publisher-utils";
import { mixpanelClient } from "./mixpanel.js";
import { db } from "./database.js";

const EVENT_BATCH_SIZE = 100;
const MAX_SEND_ATTEMPTS = 3;

interface Analytics {
	event: string;
	distinctId: string;
	data: Record<string, unknown>;
}

interface EventBody {
	analytics?: Analytics;
	[key: string]: unknown;
}

interface EventRow {
	id: string;
	entity: string;
	action: string;
	version: number;
	actorType: string;
	actorId: string;
	entityId: string;
	ip: string | null;
	userAgent: string | null;
	body: EventBody;
}

const trackMixpanelEvent = (event: EventRow): void => {
	const {
		body: { analytics },
	} = event;
	if (analytics === undefined) {
		return;
	}
	try {
		const { browser, os, device } = UAParser(event.userAgent ?? undefined);
		const analyticsData: { [key: string]: unknown; distinct_id?: string } = {
			...analytics.data,
			distinct_id: analytics.distinctId,
		};
		({ name: analyticsData["$browser"] } = browser);
		({ name: analyticsData["$os"] } = os);
		({ type: analyticsData["$device"] } = device);
		({ ip: analyticsData["ip"] } = event);
		mixpanelClient.track(analytics.event, analyticsData);
	} catch (err: unknown) {
		logger.error(err);
	}
};

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

	const messages = events.rows.map((event) => ({
		id: event.id,
		body: JSON.stringify({
			id: event.id,
			entity: event.entity,
			action: event.action,
			version: event.version,
			actorType: event.actorType,
			actorId: event.actorId,
			entityId: event.entityId,
			ip: event.ip,
			userAgent: event.userAgent,
			body: event.body,
		}),
		attributes: { Entity: event.entity, Action: event.action },
	}));

	for (const event of events.rows) {
		trackMixpanelEvent(event);
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
