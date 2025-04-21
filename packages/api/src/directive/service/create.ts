import createError from "http-errors";
import { logger } from "@stela/logger";
import type {
	CreateDirectiveRequest,
	Directive,
	DirectiveTrigger,
} from "../model";
import { db } from "../../database";
import {
	isInvalidEnumError,
	isMissingStewardAccountError,
	getInvalidValueFromInvalidEnumMessage,
} from "../../database_util";
import { sendArchiveStewardNotification } from "../../email";
import { confirmArchiveOwnership } from "./utils";

export const createDirective = async (
	requestBody: CreateDirectiveRequest,
): Promise<Directive> => {
	await confirmArchiveOwnership(
		requestBody.archiveId,
		requestBody.emailFromAuthToken,
	);

	const directiveToReturn = await db.transaction(async (transactionDb) => {
		const directive = await (async (): Promise<Directive> => {
			try {
				const directiveResult = await transactionDb.sql<Directive>(
					"directive.queries.create_directive",
					{
						archiveId: requestBody.archiveId,
						type: requestBody.type,
						stewardEmail: requestBody.stewardEmail ?? null,
						note: requestBody.note ?? null,
					},
				);
				if (directiveResult.rows[0] === undefined) {
					throw new Error();
				}
				return directiveResult.rows[0];
			} catch (err) {
				if (isInvalidEnumError(err)) {
					throw new createError.BadRequest(
						`${getInvalidValueFromInvalidEnumMessage(
							err.message,
						)} is not a valid value for "type"`,
					);
				} else if (isMissingStewardAccountError(err)) {
					throw new createError.BadRequest(
						"Steward email must have an account",
					);
				}
				logger.error(err);
				throw new createError.InternalServerError("Failed to create directive");
			}
		})();

		const trigger = await (async (): Promise<DirectiveTrigger> => {
			try {
				const triggerResult = await transactionDb.sql<DirectiveTrigger>(
					"directive.queries.create_directive_trigger",
					{
						directiveId: directive.directiveId,
						type: requestBody.trigger.type,
					},
				);
				if (triggerResult.rows[0] === undefined) {
					throw new Error();
				}
				return triggerResult.rows[0];
			} catch (err) {
				if (isInvalidEnumError(err)) {
					throw new createError.BadRequest(
						`${getInvalidValueFromInvalidEnumMessage(
							err.message,
						)} is not a valid value for "trigger.type"`,
					);
				}
				logger.error(err);
				throw new createError.InternalServerError("Failed to create directive");
			}
		})();
		directive.trigger = trigger;
		return directive;
	});

	await sendArchiveStewardNotification(directiveToReturn.directiveId).catch(
		(err) => {
			logger.error(err);
		},
	);

	return directiveToReturn;
};
