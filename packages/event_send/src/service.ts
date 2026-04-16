import { logger } from "@stela/logger";
import { UAParser } from "ua-parser-js";
import { publisherClient } from "@stela/publisher-utils";
import { mixpanelClient } from "./mixpanel";
import { db } from "./database";

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

export const sendEvents = async (): Promise<void> => {
	const events = await db
		.sql<EventRow>("queries.get_unsent_events")
		.catch((err: unknown) => {
			logger.error(err);
			throw err;
		});

	if (events.rows.length === 0) {
		return;
	}

	const messages = events.rows.map((event) => ({
		id: event.id,
		body: JSON.stringify({
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

	const { failedMessages } = await publisherClient
		.batchPublishMessages(process.env["EVENT_TOPIC_ARN"] ?? "", messages)
		.catch((err: unknown) => {
			logger.error(err);
			throw err;
		});

	const sentEventIds = events.rows
		.map((event) => event.id)
		.filter((id) => !failedMessages.includes(id));

	if (sentEventIds.length === 0) {
		return;
	}

	await db
		.sql("queries.mark_events_sent", { eventIds: sentEventIds })
		.catch((err: unknown) => {
			logger.error(err);
			throw err;
		});
};
