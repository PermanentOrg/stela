import { v4 as uuidv4 } from "uuid";
import createError from "http-errors";
import { logger } from "@stela/logger";
import type {
	CreateShareLinkRequest,
	UpdateShareLinkRequest,
	ShareLink,
	ShareLinkRow,
	CreateShareLinkDatabaseParams,
	UpdateShareLinkDatabaseParams,
} from "./models";
import { db } from "../database";
import {
	getItemAccessRole,
	accessRoleLessThan,
	isItemPublic,
} from "../access/permission";
import { AccessRole } from "../access/models";

const APPROVAL_NOT_REQUIRED = 1;
const APPROVAL_REQUIRED = 0;

const createShareLinkRequestParamsToDatabaseParams = (
	data: CreateShareLinkRequest,
	itemIsPublic: boolean,
	shareToken: string,
): CreateShareLinkDatabaseParams => ({
	itemId: data.itemId,
	itemType: data.itemType,
	permissionsLevel: `access.role.${data.permissionsLevel ?? "viewer"}`,
	unlisted:
		(data.accessRestrictions === "none" ||
			data.accessRestrictions === undefined) &&
		!itemIsPublic,
	noApproval:
		data.accessRestrictions === "approval"
			? APPROVAL_REQUIRED
			: APPROVAL_NOT_REQUIRED,
	maxUses: data.maxUses ?? 0,
	expirationTimestamp: data.expirationTimestamp,
	urlToken: shareToken,
	shareUrl: `https://${process.env["SITE_URL"] ?? ""}/share/${shareToken}`,
	email: data.emailFromAuthToken,
});

const updateShareLinkRequestParamsToDatabaseParams = (
	data: UpdateShareLinkRequest,
	noApproval: number | null,
	shareLinkId: string,
): UpdateShareLinkDatabaseParams => ({
	permissionsLevel:
		data.permissionsLevel === undefined
			? null
			: `access.role.${data.permissionsLevel}`,
	unlisted:
		data.accessRestrictions === undefined
			? null
			: data.accessRestrictions === "none",
	noApproval,
	maxUses: data.maxUses,
	setMaxUsesToNull: data.maxUses === null,
	expirationTimestamp: data.expirationTimestamp,
	setExpirationTimestampToNull: data.expirationTimestamp === null,
	shareLinkId,
	email: data.emailFromAuthToken,
});

const createShareLink = async (
	data: CreateShareLinkRequest,
): Promise<ShareLink> => {
	const accessRole = await getItemAccessRole(
		data.itemId,
		data.itemType,
		data.emailFromAuthToken,
	);
	if (accessRoleLessThan(accessRole, AccessRole.Manager)) {
		throw new createError.Forbidden(
			"User does not have permission to share item.",
		);
	}

	const itemIsPublic = await isItemPublic(data.itemId, data.itemType);
	if (itemIsPublic && data.accessRestrictions === "none") {
		throw new createError.BadRequest(
			"Unrestricted links cannot be created for public items; use the public link instead",
		);
	}

	const shareToken = uuidv4();
	const result = await db
		.sql<ShareLinkRow>(
			"share_link.queries.create_share_link",
			createShareLinkRequestParamsToDatabaseParams(
				data,
				itemIsPublic,
				shareToken,
			),
		)
		.catch((err: unknown) => {
			logger.error(err);
			throw new Error("Failed to create share link");
		});

	if (result.rows[0] === undefined) {
		const errorMessage = `Could not find a ${data.itemType} with ID: ${data.itemId} to share`;
		logger.error(errorMessage);
		throw createError.NotFound(errorMessage);
	}

	return {
		...result.rows[0],
		maxUses: result.rows[0].maxUses === null ? null : +result.rows[0].maxUses,
		usesExpended:
			result.rows[0].usesExpended === null
				? null
				: +result.rows[0].usesExpended,
	};
};

const updatedShareLinkWouldBeUnlisted = (
	updateRequest: UpdateShareLinkRequest,
	currentShareLink: ShareLink,
): boolean =>
	updateRequest.accessRestrictions === "none" ||
	(currentShareLink.accessRestrictions === "none" &&
		updateRequest.accessRestrictions === undefined);

const postUpdatePermissionsLevel = (
	updateRequest: UpdateShareLinkRequest,
	currentShareLink: ShareLink,
): "contributor" | "editor" | "manager" | "owner" | "viewer" =>
	updateRequest.permissionsLevel ?? currentShareLink.permissionsLevel;

const postUpdateMaxUses = (
	updateRequest: UpdateShareLinkRequest,
	currentShareLink: ShareLink,
): number | null => {
	if (updateRequest.maxUses === undefined) {
		return currentShareLink.maxUses;
	}
	return updateRequest.maxUses;
};

const updateShareLink = async (
	shareLinkId: string,
	data: UpdateShareLinkRequest,
): Promise<ShareLink> => {
	const shareLinkResult = await db
		.sql<ShareLink>("share_link.queries.get_share_links", {
			shareLinkIds: [shareLinkId],
			shareTokens: [],
			email: data.emailFromAuthToken,
		})
		.catch((err: unknown) => {
			logger.error(err);
			throw new Error("Failed to get share link");
		});

	if (shareLinkResult.rows[0] === undefined) {
		throw new createError.NotFound("Share link not found");
	}

	if (
		updatedShareLinkWouldBeUnlisted(data, shareLinkResult.rows[0]) &&
		(postUpdatePermissionsLevel(data, shareLinkResult.rows[0]) !== "viewer" ||
			postUpdateMaxUses(data, shareLinkResult.rows[0]) !== null)
	) {
		throw new createError.BadRequest(
			"Unlisted links cannot have restricted uses or permissions greater than 'viewer'",
		);
	}

	let noApproval = null;
	if (data.accessRestrictions !== undefined) {
		noApproval =
			data.accessRestrictions === "approval"
				? APPROVAL_REQUIRED
				: APPROVAL_NOT_REQUIRED;
	}

	const updateResult = await db
		.sql<ShareLinkRow>(
			"share_link.queries.update_share_link",
			updateShareLinkRequestParamsToDatabaseParams(
				data,
				noApproval,
				shareLinkId,
			),
		)
		.catch((err: unknown) => {
			logger.error(err);
			throw new Error("Failed to update share link");
		});

	if (updateResult.rows[0] === undefined) {
		throw new createError.NotFound("Share link not found");
	}

	return {
		...updateResult.rows[0],
		maxUses:
			updateResult.rows[0].maxUses === null
				? null
				: +updateResult.rows[0].maxUses,
		usesExpended:
			updateResult.rows[0].usesExpended === null
				? null
				: +updateResult.rows[0].usesExpended,
	};
};

const getShareLinks = async (
	email: string | undefined,
	shareTokens: string[] | undefined,
	shareLinkIds: string[] | undefined,
): Promise<ShareLink[]> => {
	const shareLinks = await db
		.sql<ShareLink>("share_link.queries.get_share_links", {
			email,
			shareTokens,
			shareLinkIds,
		})
		.catch((err: unknown) => {
			logger.error(err);
			throw new Error("Failed to get share links");
		});
	return shareLinks.rows;
};

const deleteShareLink = async (
	email: string,
	shareLinkId: string,
): Promise<void> => {
	const response = await db
		.sql<{ id: string }>("share_link.queries.delete_share_link", {
			email,
			shareLinkId,
		})
		.catch((err: unknown) => {
			logger.error(err);
			throw new Error("Failed to delete share link");
		});
	if (response.rows.length === 0)
		throw new createError.NotFound("Share link not found");
};

export const shareLinkService = {
	createShareLink,
	updateShareLink,
	getShareLinks,
	deleteShareLink,
};
