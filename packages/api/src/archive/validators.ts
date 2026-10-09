import Joi from "joi";
import { paginationFields } from "../validators/shared.js";
import {
	ArchiveMembershipRole,
	type CreateArchiveRequest,
	type MilestoneSortOrder,
} from "./models.js";

const MAXIMUM_ARCHIVE_NAME_LENGTH = 1000;

export const validateArchiveIdFromParams: (
	data: unknown,
) => asserts data is { archiveId: string } = (
	data: unknown,
): asserts data is { archiveId: string } => {
	const validation = Joi.object()
		.keys({ archiveId: Joi.string().required() })
		.validate(data);
	if (validation.error !== undefined) {
		throw validation.error;
	}
};

const archiveMembershipRoleSchema = Joi.string().valid(
	...Object.values(ArchiveMembershipRole),
);

export const validateSearchQuery: (data: unknown) => asserts data is {
	searchQuery?: string | undefined;
	callerMembershipRole?:
		| ArchiveMembershipRole
		| ArchiveMembershipRole[]
		| undefined;
	pageSize: number;
	cursor?: string | undefined;
} = (
	data: unknown,
): asserts data is {
	searchQuery?: string | undefined;
	callerMembershipRole?:
		| ArchiveMembershipRole
		| ArchiveMembershipRole[]
		| undefined;
	pageSize: number;
	cursor?: string | undefined;
} => {
	const validation = Joi.object()
		.keys({
			searchQuery: Joi.string().optional(),
			callerMembershipRole: Joi.alternatives()
				.try(
					archiveMembershipRoleSchema,
					Joi.array().items(archiveMembershipRoleSchema),
				)
				.optional(),
			pageSize: Joi.number().integer().min(1).required(),
			cursor: Joi.string().optional(),
		})
		.or("searchQuery", "callerMembershipRole")
		.validate(data);
	if (validation.error !== undefined) {
		throw validation.error;
	}
};

export const validateGetSharedFoldersQuery: (data: unknown) => asserts data is {
	pageSize: number;
	cursor?: string;
} = (
	data: unknown,
): asserts data is {
	pageSize: number;
	cursor?: string;
} => {
	const validation = Joi.object().keys(paginationFields).validate(data);
	if (validation.error !== undefined) {
		throw validation.error;
	}
};

export const validatePatchArchiveBody: (data: unknown) => asserts data is {
	milestoneSortOrder: MilestoneSortOrder;
} = (
	data: unknown,
): asserts data is {
	milestoneSortOrder: string;
} => {
	const validation = Joi.object()
		.keys({
			milestoneSortOrder: Joi.string()
				.valid("chronological", "reverse_chronological")
				.required(),
		})
		.validate(data);
	if (validation.error !== undefined) {
		throw validation.error;
	}
};

export const validateCreateArchiveRequest: (
	data: unknown,
) => asserts data is CreateArchiveRequest = (
	data: unknown,
): asserts data is CreateArchiveRequest => {
	const validation = Joi.object()
		.keys({
			name: Joi.string()
				.max(MAXIMUM_ARCHIVE_NAME_LENGTH)
				.trim()
				.min(1)
				.required(),
			type: Joi.string().valid("person", "group", "organization").optional(),
		})
		.validate(data);
	if (validation.error !== undefined) {
		throw validation.error;
	}
};
