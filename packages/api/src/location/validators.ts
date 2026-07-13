import Joi from "joi";

const LATITUDE_MIN = -90;
const LATITUDE_MAX = 90;
const LONGITUDE_MIN = -180;
const LONGITUDE_MAX = 180;

export const locationInputSchema = Joi.object()
	.keys({
		name: Joi.string().optional(),
		sublocation: Joi.string().optional(),
		city: Joi.string().optional(),
		state: Joi.string().optional(),
		postalCode: Joi.string().optional(),
		country: Joi.string().optional(),
		latitude: Joi.number().min(LATITUDE_MIN).max(LATITUDE_MAX).optional(),
		longitude: Joi.number().min(LONGITUDE_MIN).max(LONGITUDE_MAX).optional(),
		altitudeMeters: Joi.number().optional(),
		precision: Joi.string()
			.valid("approximate", "uncertain", "unknown")
			.optional(),
		timezone: Joi.string().optional().allow(null),
	})
	.min(1);
