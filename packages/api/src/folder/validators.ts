import Joi from "joi";
import { parse as parseEDTF } from "@edtf-ts/core";
import type { PatchFolderRequest } from "./models";
import { fieldsFromUserAuthentication } from "../validators";
import { paginationFields } from "../validators/shared";
import { locationInputSchema } from "../location/validators";
import { EDTF_LEVEL_2 } from "../constants";

export const validateFolderRequest: (
	data: unknown,
) => asserts data is { folderId: string } = (
	data: unknown,
): asserts data is { folderId: string } => {
	const validation = Joi.object()
		.keys({
			folderId: Joi.string().required(),
		})
		.validate(data);
	if (validation.error !== undefined) {
		throw validation.error;
	}
};

export const validatePatchFolderRequest: (
	data: unknown,
) => asserts data is PatchFolderRequest = (
	data: unknown,
): asserts data is PatchFolderRequest => {
	const validation = Joi.object()
		.keys({
			...fieldsFromUserAuthentication,
			displayDate: Joi.string().optional().allow(null),
			displayEndDate: Joi.string().optional().allow(null),
			displayTime: Joi.string()
				.custom((value: string) => {
					const result = parseEDTF(value, EDTF_LEVEL_2);
					if (result.success) {
						return value;
					}
					const detail = result.errors.map((e) => e.message).join("; ");
					throw new Error(`${value} is not valid Level 2 EDTF: ${detail}`);
				})
				.optional()
				.allow(null),
			location: locationInputSchema.optional(),
		})
		.or("displayDate", "displayEndDate", "displayTime", "location")
		.validate(data);

	if (validation.error !== undefined) {
		throw validation.error;
	}
};

export const validateGetFoldersQuery: (
	data: unknown,
) => asserts data is { folderIds: string[] } = (
	data: unknown,
): asserts data is { folderIds: string[] } => {
	const validation = Joi.object()
		.keys({
			folderIds: Joi.array().items(Joi.string().required()).required(),
		})
		.validate(data);
	if (validation.error !== undefined) {
		throw validation.error;
	}
};

export const validateGetFoldersPageQuery: (data: unknown) => asserts data is {
	folderIds: string[];
	cursor?: string;
	pageSize: number;
} = (
	data: unknown,
): asserts data is {
	folderIds: string[];
	cursor?: string;
	pageSize: number;
} => {
	const validation = Joi.object()
		.keys({
			folderIds: Joi.array().items(Joi.string().required()).required(),
			...paginationFields,
		})
		.validate(data);
	if (validation.error !== undefined) {
		throw validation.error;
	}
};
