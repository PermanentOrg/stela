import { logger } from "@stela/logger";
import createError from "http-errors";
import { db } from "../../database";

export const deleteFeatureFlag = async (
	featureFlagId: string,
): Promise<string> => {
	const result = await db
		.sql("feature_flag.queries.delete_feature_flag", {
			featureFlagId,
		})
		.catch((err) => {
			logger.error(err);
			throw new createError.InternalServerError(
				"Failed to delete feature flag",
			);
		});

	if (result.rows[0] === undefined) {
		throw new createError.NotFound("Feature Flag not found");
	}

	return featureFlagId;
};

export const deleteFeatureService = {
	deleteFeatureFlag,
};
