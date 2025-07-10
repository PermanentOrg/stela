import createError from "http-errors";
import { logger } from "@stela/logger";

import { db } from "../database";

import type { FeatureFlagRow, FeatureFlagNameRow } from "./models";

const getAllFeatureFlags = async (): Promise<FeatureFlagRow[]> => {
	const result = await db
		.sql<FeatureFlagRow>("feature_flag.queries.get_feature_flags")
		.catch((err: unknown) => {
			logger.error(err);
			throw new createError.InternalServerError(
				"Failed to retrieve feature flags",
			);
		});

	return result.rows;
};

const getGlobalFeatureFlagNames = async (): Promise<FeatureFlagNameRow[]> => {
	const result = await db
		.sql<FeatureFlagNameRow>(
			"feature_flag.queries.get_global_feature_flag_names",
		)
		.catch((err: unknown) => {
			logger.error(err);
			throw new createError.InternalServerError(
				"Failed to retrieve feature flag names",
			);
		});

	return result.rows;
};

const getFeatureFlags = async (
	admin: boolean,
): Promise<FeatureFlagNameRow[] | FeatureFlagRow[]> => {
	if (admin) {
		return getAllFeatureFlags();
	}
	return getGlobalFeatureFlagNames();
};

export const featureService = {
	getFeatureFlags,
};
