import createError from "http-errors";
import type { TinyPg } from "tinypg";
import { logger } from "@stela/logger";
import { publisherClient } from "@stela/publisher-utils";
import {
	type EventRow,
	toEventMessage,
	trackMixpanelEvent,
} from "@stela/event_utils";
import { db } from "../database.js";
import { mixpanelClient } from "../mixpanel.js";
import type { CreateEventRequest, ChecklistItem } from "./models.js";
import {
	isInvalidEnumError,
	getInvalidValueFromInvalidEnumMessage,
} from "../database_util.js";

const insertEvent = async (
	data: CreateEventRequest,
	transactionDb: TinyPg,
): Promise<EventRow> => {
	const actorType =
		data.userSubjectFromAuthToken === undefined ? "admin" : "user";
	const event = {
		entity: data.entity,
		action: data.action,
		version: data.version,
		actorType,
		actorId: data.userSubjectFromAuthToken ?? data.adminSubjectFromAuthToken,
		entityId: data.entityId,
		ip: data.ip,
		userAgent: data.userAgent,
		body: data.body,
	};

	const result = await transactionDb
		.sql<{ id: string }>("event.queries.create_event", event)
		.catch((err: unknown) => {
			if (isInvalidEnumError(err)) {
				const badValue = getInvalidValueFromInvalidEnumMessage(err.message);
				const badKey = badValue === data.entity ? "entity" : "action";
				throw new createError.BadRequest(
					`${badValue} is not a valid value for ${badKey}`,
				);
			}
			logger.error(err);
			throw new createError.InternalServerError(`Failed to create event`);
		});

	const {
		rows: [row],
	} = result;
	if (row === undefined) {
		throw new createError.InternalServerError(`Failed to create event`);
	}

	return {
		...event,
		id: row.id,
		actorId: event.actorId ?? "",
		userAgent: event.userAgent ?? null,
	};
};

const sendEvents = async (events: EventRow[]): Promise<void> => {
	for (const event of events) {
		trackMixpanelEvent(event, mixpanelClient);
	}
	const eventIds = events.map((event) => event.id);
	const { failedMessages } = await publisherClient
		.batchPublishMessages(
			process.env["EVENT_TOPIC_ARN"] ?? "",
			events.map(toEventMessage),
		)
		.catch((err: unknown) => {
			logger.error(err);
			return { failedMessages: eventIds };
		});
	await db.sql("event.queries.record_send_attempts", {
		eventIds,
		sentEventIds: eventIds.filter((id) => !failedMessages.includes(id)),
	});
};

export type RecordEvent = (data: CreateEventRequest) => Promise<void>;

export const transactionWithEvents = async <T>(
	work: (transactionDb: TinyPg, recordEvent: RecordEvent) => Promise<T>,
): Promise<T> => {
	const events: EventRow[] = [];
	const result = await db.transaction(
		async (transactionDb) =>
			await work(transactionDb, async (data) => {
				events.push(await insertEvent(data, transactionDb));
			}),
	);

	if (events.length > 0) {
		await sendEvents(events).catch((err: unknown) => {
			logger.error(err);
		});
	}

	return result;
};

export const createEvent = async (data: CreateEventRequest): Promise<void> => {
	await transactionWithEvents(async (_, recordEvent) => {
		await recordEvent(data);
	});
};

const checklistEvents: Record<string, string> = {
	archiveCreated: "Create your first archive",
	storageRedeemed: "Redeem free storage",
	legacyContact: "Assign a Legacy Contact",
	archiveSteward: "Assign an Archive Steward",
	archiveProfile: "Update Archive Profile",
	firstUpload: "Upload first file",
	publishContent: "Publish your archive",
};

export const getChecklistEvents = async (
	email: string,
): Promise<ChecklistItem[]> => {
	const eventResult = await db
		.sql<Record<string, boolean>>("event.queries.get_checklist_events", {
			email,
		})
		.catch((err: unknown) => {
			logger.error(err);
			throw new createError.InternalServerError(
				"Failed to retrieve checklist data",
			);
		});
	if (eventResult.rows[0] === undefined) {
		throw new createError.InternalServerError(
			"Failed to retrieve checklist data",
		);
	}
	const {
		rows: [eventData],
	} = eventResult;
	return Object.keys(checklistEvents).map((key: string) => ({
		id: key,
		title: checklistEvents[key] ?? "",
		completed: eventData[key] ?? false,
	}));
};
