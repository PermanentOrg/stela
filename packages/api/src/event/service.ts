import createError from "http-errors";
import { logger } from "@stela/logger";
import { db } from "../database";
import type { CreateEventRequest, ChecklistItem } from "./models";
import {
	isInvalidEnumError,
	getInvalidValueFromInvalidEnumMessage,
} from "../database_util";

export const createEvent = async (data: CreateEventRequest): Promise<void> => {
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
