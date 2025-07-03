import Joi from "joi";
import type { CreateEventRequest } from "./models";
import { fieldsFromUserOrAdminAuthentication } from "../validators";

export function validateCreateEventRequest(
	data: unknown,
): asserts data is CreateEventRequest {
	const validation = fieldsFromUserOrAdminAuthentication
		.append({
			entity: Joi.string().required(),
			action: Joi.string().required(),
			version: Joi.number().required(),
			entityId: Joi.string().required(),
			ip: Joi.string().ip().required(),
			userAgent: Joi.string(),
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
}
