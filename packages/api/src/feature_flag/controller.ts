import { Router } from "express";
import type { Request, Response, NextFunction } from "express";

import { logger } from "@stela/logger";
import { featureService } from "./service";
import { createFeatureService } from "./service/create";
import { updateFeatureService } from "./service/update";
import { deleteFeatureService } from "./service/delete";
import {
	extractUserIsAdminFromAuthToken,
	verifyAdminAuthentication,
} from "../middleware";
import { isValidationError } from "../validators/validator_util";
import {
	validateCreateFeatureFlagRequest,
	validateUpdateFeatureFlagRequest,
	validateFeatureFlagParams,
} from "./validators";
import { validateIsAdminFromAuthentication } from "../validators/shared";
import { HTTP_STATUS } from "@pdc/http-status-codes";

export const featureController = Router();

featureController.get(
	"/",
	extractUserIsAdminFromAuthToken,
	async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			validateIsAdminFromAuthentication(req.body);
			const featureFlags = await featureService.getFeatureFlags(req.body.admin);
			res.json({ items: featureFlags });
		} catch (err) {
			if (isValidationError(err)) {
				res
					.status(HTTP_STATUS.CLIENT_ERROR.BAD_REQUEST)
					.json({ error: err.message });
				return;
			}
			logger.error(err);
			next(err);
		}
	},
);

featureController.post(
	"/",
	verifyAdminAuthentication,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			validateCreateFeatureFlagRequest(req.body);
			const insertedFeatureFlag = await createFeatureService.createFeatureFlag(
				req.body,
			);
			res.status(HTTP_STATUS.SUCCESSFUL.OK).send({ data: insertedFeatureFlag });
		} catch (err) {
			if (isValidationError(err)) {
				res
					.status(HTTP_STATUS.CLIENT_ERROR.BAD_REQUEST)
					.json({ error: err.message });
				return;
			}
			next(err);
		}
	},
);

featureController.put(
	"/:featureId",
	verifyAdminAuthentication,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			validateUpdateFeatureFlagRequest(req.body);
			validateFeatureFlagParams(req.params);
			const featureFlag = await updateFeatureService.updateFeatureFlag(
				req.params.featureId,
				req.body,
			);
			res.status(HTTP_STATUS.SUCCESSFUL.OK).send({ data: featureFlag });
		} catch (err) {
			if (isValidationError(err)) {
				res
					.status(HTTP_STATUS.CLIENT_ERROR.BAD_REQUEST)
					.json({ error: err.message });
				return;
			}
			next(err);
		}
	},
);

featureController.delete(
	"/:featureId",
	verifyAdminAuthentication,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			validateFeatureFlagParams(req.params);
			await deleteFeatureService.deleteFeatureFlag(req.params.featureId);
			res.status(HTTP_STATUS.SUCCESSFUL.NO_CONTENT).send();
		} catch (err) {
			if (isValidationError(err)) {
				res
					.status(HTTP_STATUS.CLIENT_ERROR.BAD_REQUEST)
					.json({ error: err.message });
				return;
			}
			next(err);
		}
	},
);
