import { logger } from "@stela/logger";
import createError from "http-errors";
import { TinyPgError } from "tinypg";
import type { CreateFeatureFlagRequest, FeatureFlagRow } from "../models";
import { db } from "../../database";

const duplicateFeatureFlagError =
	'duplicate key value violates unique constraint "feature_flag_name_unique"';

export const createFeatureFlag = async (
	featureFlagData: CreateFeatureFlagRequest,
): Promise<FeatureFlagRow> => {
	const result = await db
		.sql<FeatureFlagRow>("feature_flag.queries.create_feature_flag", {
			name: featureFlagData.name,
			description: featureFlagData.description,
			globally_enabled: false,
		})
		.catch((err: unknown) => {
			logger.error(err);
			if (
				err instanceof TinyPgError &&
				err.message === duplicateFeatureFlagError
			) {
				throw new createError.BadRequest("Feature flag already exists");
			}
			throw new createError.InternalServerError(
				"Failed to create feature flag",
			);
		});

	if (result.rows[0] === undefined) {
		throw new createError.InternalServerError("Failed to create feature flag");
	}

	return result.rows[0];
};

export const createFeatureService = {
	createFeatureFlag,
};
