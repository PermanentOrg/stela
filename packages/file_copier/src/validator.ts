import Joi from "joi";
import { logger } from "@stela/logger";
import type { FileCopyEvent } from "./models.js";

export const validateFileCopyEvent: (
	data: unknown,
) => asserts data is FileCopyEvent = (
	data: unknown,
): asserts data is FileCopyEvent => {
	const validation = Joi.object({
		id: Joi.string().required(),
		entity: Joi.string().valid("file").required(),
		action: Joi.string().valid("copy").required(),
		body: Joi.object({
			file: Joi.object({
				fileid: Joi.number().integer().required(),
				cloudpath: Joi.string().required(),
			}).unknown(true),
			newFile: Joi.object({
				fileid: Joi.number().integer().required(),
			}).unknown(true),
		}).unknown(true),
	})
		.unknown(true)
		.validate(data);
	if (validation.error !== undefined) {
		logger.error(validation.error);
		throw validation.error;
	}
};
