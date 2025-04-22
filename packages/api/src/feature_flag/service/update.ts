import { logger } from "@stela/logger";
import createError from "http-errors";
import type { FeatureFlagRow, UpdateFeatureFlagRequest } from "../models";
import { db } from "../../database";

export const updateFeatureFlag = async (
	featureFlagId: string,
	featureFlagData: UpdateFeatureFlagRequest,
): Promise<FeatureFlagRow> => {
	const result = await db
		.sql<FeatureFlagRow>("feature_flag.queries.update_feature_flag", {
			id: featureFlagId,
			description: featureFlagData.description,
			globally_enabled: featureFlagData.globallyEnabled,
		})
		.catch((err) => {
			logger.error(err);
			throw new createError.InternalServerError(
				"Failed to update feature flag",
			);
		});

	if (result.rows[0] === undefined) {
		throw new createError.NotFound("Feature flag not found");
	}

	return result.rows[0];
};

export const updateFeatureService = {
	updateFeatureFlag,
};
