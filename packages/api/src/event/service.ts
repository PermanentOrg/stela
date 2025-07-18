import createError from "http-errors";
import { UAParser } from "ua-parser-js";
import { logger } from "@stela/logger";
import { db } from "../database";
import { publisherClient } from "../publisher_client";
import { mixpanelClient } from "../mixpanel";
import type { CreateEventRequest, ChecklistItem } from "./models";
import {
	isInvalidEnumError,
	getInvalidValueFromInvalidEnumMessage,
} from "../database_util";

export const createEvent = async (data: CreateEventRequest): Promise<void> => {
	if (data.body.analytics !== undefined) {
		const { browser, os, device } = UAParser(data.userAgent);
		try {
			const analyticsData: { [key: string]: unknown; distinct_id?: string } = {
				...data.body.analytics.data,
				distinct_id: data.body.analytics.distinctId,
			};
			({ name: analyticsData["$browser"] } = browser);
			({ name: analyticsData["$os"] } = os);
			({ type: analyticsData["$device"] } = device);
			analyticsData["$email"] =
				data.userEmailFromAuthToken ?? data.adminEmailFromAuthToken;
			({ ip: analyticsData["ip"] } = data);
			mixpanelClient.track(data.body.analytics.event, analyticsData);
		} catch (err: unknown) {
			logger.error(err);
			throw new createError.InternalServerError(
				`Failed to track mixpanel event`,
			);
		}
	}

	const actorType =
		data.userSubjectFromAuthToken !== undefined ? "user" : "admin";
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

	const result = await db
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

	if (result.rows[0] === undefined) {
		throw new createError.InternalServerError(`Failed to create event`);
	}

	try {
		await publisherClient.publishMessage(process.env["EVENT_TOPIC_ARN"] ?? "", {
			id: result.rows[0].id,
			body: JSON.stringify(event),
			attributes: { Entity: event.entity, Action: event.action },
		});
	} catch (err: unknown) {
		logger.error(err);
		throw new createError.InternalServerError(
			`Failed to publish message to topic`,
		);
	}
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
