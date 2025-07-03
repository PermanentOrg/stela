import Joi from "joi";
import { validateBodyFromAuthentication } from "../validators";

export { validateBodyFromAuthentication };

export function validateArchiveIdFromParams(
	data: unknown,
): asserts data is { archiveId: string } {
	const validation = Joi.object()
		.keys({ archiveId: Joi.string().required() })
		.validate(data);
	if (validation.error !== undefined) {
		throw validation.error;
	}
}
