import Joi from "joi";

const LATITUDE_MIN = -90;
const LATITUDE_MAX = 90;
const LONGITUDE_MIN = -180;
const LONGITUDE_MAX = 180;

export const locationInputSchema = Joi.object()
	.keys({
		name: Joi.string().optional().allow(null),
		sublocation: Joi.string().optional().allow(null),
		city: Joi.string().optional().allow(null),
		state: Joi.string().optional().allow(null),
		postalCode: Joi.string().optional().allow(null),
		country: Joi.string().optional().allow(null),
		latitude: Joi.number()
			.min(LATITUDE_MIN)
			.max(LATITUDE_MAX)
			.optional()
			.allow(null),
		longitude: Joi.number()
			.min(LONGITUDE_MIN)
			.max(LONGITUDE_MAX)
			.optional()
			.allow(null),
		altitudeMeters: Joi.number().optional().allow(null),
		precision: Joi.string()
			.valid("approximate", "uncertain", "unknown")
			.optional()
			.allow(null),
		timezone: Joi.string().optional().allow(null),
	})
	.min(1);
