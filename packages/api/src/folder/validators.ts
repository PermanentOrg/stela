import Joi from "joi";
import { isValid as isValidEDTF } from "@edtf-ts/core";
import type { PatchFolderRequest } from "./models";
import { fieldsFromUserAuthentication } from "../validators";

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
			displayTimeInEDTF: Joi.string()
				.custom((value: string) => {
					if (isValidEDTF(value, 1)) {
						return value;
					} else {
						throw new Error(`$${value} is not valid Level 1 EDTF`);
					}
				})
				.optional()
				.allow(null),
		})
		.or("displayDate", "displayEndDate", "displayTimeInEDTF")
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
