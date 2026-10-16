import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { verifyUserAuthentication } from "../middleware/index.js";
import {
	validateCreateLegacyContactRequest,
	validateUpdateLegacyContactRequest,
	validateUpdateLegacyContactParams,
} from "./validators.js";
import { validateUserAuthentication } from "../validators/index.js";
import { legacyContactService } from "./service/index.js";

export const legacyContactController = Router();
legacyContactController.post(
	"/",
	verifyUserAuthentication,
	async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			const auth = req.metadata?.auth;
			validateUserAuthentication(auth);
			validateCreateLegacyContactRequest(req.body, auth.email);
			const legacyContact = await legacyContactService.createLegacyContact(
				auth.email,
				req.body,
			);
			res.json(legacyContact);
		} catch (err) {
			next(err);
		}
	},
);

legacyContactController.get(
	"/",
	verifyUserAuthentication,
	async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			const auth = req.metadata?.auth;
			validateUserAuthentication(auth);
			const legacyContacts =
				await legacyContactService.getLegacyContactsByAccountId(auth.email);
			res.json(legacyContacts);
		} catch (err) {
			next(err);
		}
	},
);

legacyContactController.put(
	"/:legacyContactId",
	verifyUserAuthentication,
	async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			const auth = req.metadata?.auth;
			validateUserAuthentication(auth);
			validateUpdateLegacyContactRequest(req.body, auth.email);
			validateUpdateLegacyContactParams(req.params);
			const legacyContact = await legacyContactService.updateLegacyContact(
				req.params.legacyContactId,
				auth.email,
				req.body,
			);
			res.json(legacyContact);
		} catch (err) {
			next(err);
		}
	},
);
