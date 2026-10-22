import Joi from "joi";
import type { CreateEventRequestBody } from "./models.js";

export const validateCreateEventRequest: (
	data: unknown,
) => asserts data is CreateEventRequestBody = (
	data: unknown,
): asserts data is CreateEventRequestBody => {
	const validation = Joi.object()
		.keys({
			entity: Joi.string().required(),
			action: Joi.string().required(),
			version: Joi.number().required(),
			entityId: Joi.string().required(),
			userAgent: Joi.string().empty(""),
			body: Joi.object()
				.keys({
					analytics: Joi.object().keys({
						event: Joi.string().required(),
						distinctId: Joi.string().required(),
						data: Joi.object().unknown(true).required(),
					}),
				})
				.unknown(true)
				.required(),
		})
		.validate(data);
	if (validation.error !== undefined) {
		throw validation.error;
	}
};
