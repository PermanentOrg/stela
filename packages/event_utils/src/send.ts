import { UAParser } from "ua-parser-js";
import { logger } from "@stela/logger";

interface Analytics {
	event: string;
	distinctId: string;
	data: Record<string, unknown>;
}

export interface EventRow {
	id: string;
	entity: string;
	action: string;
	version: number;
	actorType: string;
	actorId: string;
	entityId: string;
	ip: string | null;
	userAgent: string | null;
	body: { analytics?: Analytics; [key: string]: unknown };
}

export interface AnalyticsClient {
	track: (event: string, data: Record<string, unknown>) => void;
}

export const toEventMessage = (
	event: EventRow,
): { id: string; body: string; attributes: Record<string, string> } => ({
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
});

export const trackMixpanelEvent = (
	event: EventRow,
	mixpanelClient: AnalyticsClient,
): void => {
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
