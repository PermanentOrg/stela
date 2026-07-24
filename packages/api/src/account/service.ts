import { Md5 } from "ts-md5";
import createError from "http-errors";
import { HTTP_STATUS } from "@pdc/http-status-codes";
import type { ErrorResponse } from "@mailchimp/mailchimp_marketing";
import { logger } from "@stela/logger";

import { db } from "../database.js";
import { MailchimpMarketing } from "../mailchimp.js";
import { ACCESS_ROLE, EVENT_ACTION, EVENT_ENTITY, GB } from "../constants.js";
import { createEvent } from "../event/service.js";
import type { CreateEventRequest } from "../event/models.js";

import type {
	UpdateTagsRequest,
	GetMarketingTagsResponse,
	SignupDetails,
	GetAccountArchiveResult,
	LeaveArchiveRequest,
	CreateStorageAdjustmentRequest,
	StorageAdjustment,
	Account,
	AccountRow,
	GetAccountsQuery,
	GetAccountsResponse,
	PostMarketingTagsRequest,
} from "./models.js";

const accountRowToAccount = (row: AccountRow): Account => {
	const { totalPages: _, ...account } = row;
	return account;
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
		.sql<AccountRow>("account.queries.get_accounts", {
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

	try {
		await MailchimpMarketing.lists.updateListMemberTags(
			process.env["MAILCHIMP_COMMUNITY_LIST_ID"] ?? "",
			Md5.hashStr(requestBody.emailFromAuthToken),
			{ tags },
		);
	} catch (err) {
		if (isMailchimpApiError(err)) {
			throw err.response === undefined
				? createError(err.status)
				: createError(err.status, err.response.body.detail);
		}
		throw err;
	}
};

const postMarketingTags = async (
	requestBody: PostMarketingTagsRequest,
): Promise<{ items: string[] }> => {
	const subscriberHash = Md5.hashStr(requestBody.emailFromAuthToken);
	const listId = process.env["MAILCHIMP_COMMUNITY_LIST_ID"] ?? "";

	try {
		await MailchimpMarketing.lists.updateListMemberTags(
			listId,
			subscriberHash,
			{
				tags: requestBody.tags.map((tag) => ({ name: tag, status: "active" })),
			},
		);

		const tagsResponse = await MailchimpMarketing.lists.getListMemberTags(
			listId,
			subscriberHash,
		);

		return { items: tagsResponse.tags.map((tag) => tag.name) };
	} catch (err) {
		if (isMailchimpApiError(err)) {
			throw err.response === undefined
				? createError(err.status)
				: createError(err.status, err.response.body.detail);
		}
		throw err;
	}
};

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

const getMe = async (email: string): Promise<Account> => {
	const result = await db
		.sql<AccountRow>("account.queries.get_accounts", {
			filterByIds: false,
			accountEmails: [email.toLowerCase()],
			accountIds: [],
			pageSize: 1,
			cursor: undefined,
		})
		.catch((err: unknown) => {
			logger.error(err);
			throw new createError.InternalServerError("Failed to retrieve account");
		});

	if (result.rows[0] === undefined) {
		throw new createError.NotFound("Account not found");
	}

	return accountRowToAccount(result.rows[0]);
};

export const accountService = {
	getSignupDetails,
	leaveArchive,
	updateTags,
	getMarketingTags,
	postMarketingTags,
	getAccountArchive,
	getMe,
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
		}>("storage.queries.adjust_account_storage", {
			accountId,
			storageAmountInBytes: requestBody.storageAmount * GB,
			ledgerType: "type.billing.transfer.admin_adjustment",
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
