import createError from "http-errors";
import { logger } from "@stela/logger";
import { db } from "../database";
import type { GiftStorageRequest, GiftStorageResponse } from "./models";
import { GB } from "../constants";
import { sendInvitationNotification, sendGiftNotification } from "../email";

const INVITE_TOKEN_LENGTH = 10;

const getRandomAlphanumericString = (length: number): string => {
	const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
	let result = "";
	for (let i = 0; i < length; i += 1) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
};

export const issueGift = async (
	requestBody: GiftStorageRequest,
): Promise<GiftStorageResponse> => {
	const existingAccountEmailResult = await db
		.sql<{ email: string }>("billing.queries.get_existing_account_emails", {
			emails: requestBody.recipientEmails,
		})
		.catch((err: unknown) => {
			logger.error(err);
			throw new createError.InternalServerError(
				"Failed to check for existing recipient accounts",
			);
		});
	const existingAccountEmails = existingAccountEmailResult.rows.map(
		(row) => row.email,
	);
	const newEmails = requestBody.recipientEmails.filter(
		(email) => !existingAccountEmails.includes(email),
	);

	const alreadyInvitedEmailResult = await db
		.sql<{ email: string }>("billing.queries.get_invited_emails", {
			emails: newEmails,
		})
		.catch((err: unknown) => {
			logger.error(err);
			throw new createError.InternalServerError(
				"Failed to check for existing invites",
			);
		});

	const alreadyInvitedEmails = alreadyInvitedEmailResult.rows.map(
		(row) => row.email,
	);
	const emailsToInvite = newEmails.filter(
		(email) => !alreadyInvitedEmails.includes(email),
	);

	const inviteTokens = emailsToInvite.map((_) =>
		getRandomAlphanumericString(INVITE_TOKEN_LENGTH),
	);

	await db.transaction(async (transactionDb) => {
		const senderStorage = await transactionDb
			.sql<{ spaceLeft: string }>(
				"billing.queries.get_account_space_for_update",
				{
					email: requestBody.emailFromAuthToken,
				},
			)
			.catch((err: unknown) => {
				logger.error(err);
				throw new createError.InternalServerError(
					"Failed to look up sender account space",
				);
			});

		if (senderStorage.rows[0] === undefined) {
			logger.error("Empty response from account_space query");
			throw new createError.InternalServerError(
				"Failed to look up sender account space",
			);
		} else if (
			+senderStorage.rows[0].spaceLeft <
			requestBody.storageAmount *
				GB *
				(existingAccountEmails.length + emailsToInvite.length)
		) {
			throw new createError.BadRequest("Not enough storage to issue gift(s)");
		}

		await transactionDb
			.sql("billing.queries.record_gift", {
				fromEmail: requestBody.emailFromAuthToken,
				toEmails: existingAccountEmails,
				storageAmountInBytes: requestBody.storageAmount * GB,
				recipientCount: existingAccountEmails.length,
			})
			.catch((err: unknown) => {
				logger.error(err);
				throw new createError.InternalServerError("Failed to issue gift");
			});

		await transactionDb
			.sql("billing.queries.create_invites", {
				emails: emailsToInvite,
				storageAmountInBytes: requestBody.storageAmount * GB,
				tokens: inviteTokens,
				byAccountEmail: requestBody.emailFromAuthToken,
				recipientCount: emailsToInvite.length,
			})
			.catch((err: unknown) => {
				logger.error(err);
				throw new createError.InternalServerError("Failed to create invites");
			});
	});

	await Promise.all(
		existingAccountEmails.map(async (email) => {
			await sendGiftNotification(
				requestBody.emailFromAuthToken,
				email,
				requestBody.note,
				requestBody.storageAmount,
			);
		}),
	);

	await Promise.all(
		emailsToInvite.map(async (email, idx) => {
			await sendInvitationNotification({
				fromEmail: requestBody.emailFromAuthToken,
				toEmail: email,
				message: requestBody.note,
				giftAmount: requestBody.storageAmount,
				// inviteTokens should always be the same length as emailsToInvite, so this will always be defined, but
				// TypeScript doesn't know that
				token: inviteTokens[idx] ?? "",
			});
		}),
	);

	return {
		storageGifted:
			requestBody.storageAmount *
			(existingAccountEmails.length + emailsToInvite.length),
		giftDelivered: existingAccountEmails,
		invitationSent: emailsToInvite,
		alreadyInvited: alreadyInvitedEmails,
	};
};
