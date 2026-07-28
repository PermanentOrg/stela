import { Md5 } from "ts-md5";
import createError from "http-errors";
import { HTTP_STATUS } from "@pdc/http-status-codes";
import { logger } from "@stela/logger";
import type { ErrorResponse } from "@mailchimp/mailchimp_marketing";

import { db } from "../database.js";
import { MailchimpMarketing } from "../mailchimp.js";
import { ACCESS_ROLE, EVENT_ACTION, EVENT_ENTITY, GB } from "../constants.js";
import { createEvent } from "../event/service.js";
import type { CreateEventRequest } from "../event/models.js";

import {
	type UpdateTagsRequest,
	type GetMarketingTagsResponse,
	type SignupDetails,
	type GetAccountArchiveResult,
	type LeaveArchiveRequest,
	type CreateStorageAdjustmentRequest,
	type StorageAdjustment,
	type Account,
	type AccountRow,
	type GetAccountsQuery,
	type GetAccountsResponse,
	AccountType,
	PrettyAccountType,
	AccountStatus,
	PrettyAccountStatus,
} from "./models.js";

const prettifyAccountType = (accountType: AccountType): PrettyAccountType => {
	switch (accountType) {
		case AccountType.Standard:
			return PrettyAccountType.Standard;
		case AccountType.Test:
			return PrettyAccountType.Test;
	}
};

const prettifyAccountStatus = (
	accountStatus: AccountStatus,
): PrettyAccountStatus => {
	switch (accountStatus) {
		case AccountStatus.Ok:
			return PrettyAccountStatus.Ok;
		case AccountStatus.Invited:
			return PrettyAccountStatus.Invited;
	}
};

const accountRowToAccount = (row: AccountRow): Account => ({
	id: row.id,
	primaryEmail: {
		address: row.primaryEmailAddress,
		verified: row.emailStatus === "status.auth.ok",
	},
	...(row.primaryPhoneNumber !== null && {
		primaryPhone: {
			number: row.primaryPhoneNumber,
			verified: row.phoneStatus === "status.auth.ok",
		},
	}),
	fullName: row.fullName,
	...(row.defaultArchiveId !== null && {
		defaultArchiveId: row.defaultArchiveId,
	}),
	address: {
		lineOne: row.addressLineOne,
		lineTwo: row.addressLineTwo,
		city: row.city,
		state: row.state,
		zip: row.zip,
		country: row.country,
	},
	settings: {
		hideChecklist: row.hideChecklist,
		allowSftpDeletion: row.allowSftpDeletion,
		notificationsEnabled: {
			sms: row.notificationPreferences.textPreference,
			email: row.notificationPreferences.emailPreference,
			inApp: row.notificationPreferences.inAppPreference,
		},
	},
	status: prettifyAccountStatus(row.status),
	type: prettifyAccountType(row.type),
});

export const getAccounts = async (
	query: GetAccountsQuery,
): Promise<GetAccountsResponse> => {
	const filterByIds = query.accountIds !== undefined;
	const accountIds = Array.isArray(query.accountIds)
		? query.accountIds
		: query.accountIds === undefined
			? []
			: [query.accountIds];
	const accountEmails = Array.isArray(query.accountEmails)
		? query.accountEmails.map((e) => e.toLowerCase())
		: query.accountEmails === undefined
			? []
			: [query.accountEmails.toLowerCase()];

	const result = await db
		.sql<AccountRow & { totalPages: number }>("account.queries.get_accounts", {
			filterByIds,
			accountIds,
			accountEmails,
			cursor: query.cursor,
			pageSize: query.pageSize,
		})
		.catch((err: unknown) => {
			logger.error(err);
			throw new createError.InternalServerError("Failed to retrieve accounts");
		});

	const accounts = result.rows.map(accountRowToAccount);
	const nextCursor = accounts[accounts.length - 1]?.id;
	return {
		items: accounts,
		pagination: {
			nextCursor,
			nextPage:
				nextCursor === undefined
					? undefined
					: `https://${process.env["SITE_URL"] ?? ""}/api/v2/accounts?pageSize=${query.pageSize}&cursor=${nextCursor}`,
			totalPages: result.rows[0] === undefined ? 0 : result.rows[0].totalPages,
		},
	};
};

const updateTags = async (requestBody: UpdateTagsRequest): Promise<void> => {
	const tags = (requestBody.addTags ?? [])
		.map((tag): { name: string; status: "active" | "inactive" } => ({
			name: tag,
			status: "active",
		}))
		.concat(
			(requestBody.removeTags ?? []).map(
				(tag): { name: string; status: "active" | "inactive" } => ({
					name: tag,
					status: "inactive",
				}),
			),
		);

	const response = await MailchimpMarketing.lists.updateListMemberTags(
		process.env["MAILCHIMP_COMMUNITY_LIST_ID"] ?? "",
		Md5.hashStr(requestBody.emailFromAuthToken),
		{ tags },
	);

	if (response !== null) {
		throw createError(response.status, response.detail);
	}
};

interface MailchimpApiError {
	status: number;
	response?: {
		body: ErrorResponse;
	};
}

const isMailchimpApiError = (err: unknown): err is MailchimpApiError =>
	err instanceof Object &&
	"status" in err &&
	typeof (err as { status: unknown }).status === "number";

const getMarketingTags = async (requestBody: {
	emailFromAuthToken: string;
	userSubjectFromAuthToken: string;
}): Promise<GetMarketingTagsResponse> => {
	try {
		const response = await MailchimpMarketing.lists.getListMemberTags(
			process.env["MAILCHIMP_COMMUNITY_LIST_ID"] ?? "",
			Md5.hashStr(requestBody.emailFromAuthToken),
		);
		return { items: response.tags.map((tag) => tag.name) };
	} catch (err) {
		if (isMailchimpApiError(err)) {
			if (err.status === HTTP_STATUS.CLIENT_ERROR.NOT_FOUND.valueOf()) {
				return { items: [] };
			}
			throw err.response === undefined
				? createError(err.status)
				: createError(err.status, err.response.body.detail);
		}
		throw err;
	}
};

const getSignupDetails = async (
	accountEmail: string,
): Promise<SignupDetails> => {
	const signupDetailResult = await db
		.sql<SignupDetails>("account.queries.get_signup", {
			email: accountEmail,
		})
		.catch((err: unknown) => {
			logger.error(err);
			throw new createError.InternalServerError(
				"Failed to retrieve signup details",
			);
		});
	if (signupDetailResult.rows[0] === undefined) {
		throw new createError.NotFound("Signup details not found");
	}
	return signupDetailResult.rows[0];
};

const leaveArchive = async ({
	emailFromAuthToken,
	userSubjectFromAuthToken,
	archiveId,
	ip,
}: LeaveArchiveRequest): Promise<{
	accountArchiveId: string;
}> =>
	await db.transaction(async (transactionDb) => {
		const accountArchiveResult =
			await transactionDb.sql<GetAccountArchiveResult>(
				"account.queries.get_account_archive",
				{
					archiveId,
					email: emailFromAuthToken,
				},
			);

		const {
			rows: [accountArchive],
		} = accountArchiveResult;

		if (accountArchive === undefined) {
			throw new createError.NotFound(
				`Unable to find relationship with archiveId ${archiveId}`,
			);
		}

		if (accountArchive.accessRole === ACCESS_ROLE.Owner) {
			throw new createError.BadRequest(
				"Cannot leave archive while owning it. Either pass ownership to another account or delete archive.",
			);
		}

		const deleteResult = await db.sql<{ accountArchiveId: string }>(
			"account.queries.delete_account_archive",
			{
				archiveId,
				email: emailFromAuthToken,
			},
		);

		if (deleteResult.rows[0] === undefined) {
			throw new createError.InternalServerError(
				"Unexpected result while performing DELETE on account archive relationship.",
			);
		}

		const eventData: CreateEventRequest = {
			action: EVENT_ACTION.Delete,
			entity: EVENT_ENTITY.AccountArchive,
			entityId: accountArchive.accountArchiveId,
			ip,
			version: 1,
			body: {
				archiveId,
				accountId: accountArchive.accountId,
				accountPrimaryEmail: emailFromAuthToken,
			},
			userSubjectFromAuthToken,
		};

		await createEvent(eventData);

		return deleteResult.rows[0];
	});

const getAccountArchive = async (
	archiveId: string,
	email: string,
): Promise<GetAccountArchiveResult | undefined> => {
	const accountArchiveResult = await db
		.sql<GetAccountArchiveResult>("account.queries.get_account_archive", {
			archiveId,
			email,
		})
		.catch((err: unknown) => {
			logger.error(err);
			throw new createError.InternalServerError(
				"Failed to retrieve account archive",
			);
		});
	return accountArchiveResult.rows[0];
};

export const accountService = {
	getSignupDetails,
	leaveArchive,
	updateTags,
	getMarketingTags,
	getAccountArchive,
};

export const createStorageAdjustment = async (
	accountId: string,
	requestBody: CreateStorageAdjustmentRequest,
): Promise<StorageAdjustment> => {
	const updatedStorage = await db
		.sql<{
			storageTotalInBytes: bigint;
			adjustmentSizeInBytes: bigint;
			createdAt: Date;
		}>("account.queries.adjust_account_storage", {
			accountId,
			storageAmountInBytes: requestBody.storageAmount * GB,
		})
		.catch((err: unknown) => {
			logger.error(err);
			throw new createError.InternalServerError(
				"Failed to update account storage",
			);
		});

	if (updatedStorage.rows[0] === undefined) {
		throw new createError.NotFound("Account not found");
	}

	return {
		newStorageTotal: Number(updatedStorage.rows[0].storageTotalInBytes) / GB,
		adjustmentAmount: Number(updatedStorage.rows[0].adjustmentSizeInBytes) / GB,
		createdAt: updatedStorage.rows[0].createdAt,
	};
};
