import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { verifyUserAuthentication } from "../middleware";
import {
	validatePaymentSheetRequest,
	validateDonationClaimStatusRequest,
	validateClaimDonationRequest,
} from "./validators";
import { isValidationError } from "../validators/validator_util";
import {
	createPaymentSheet,
	verifyWebhookSignature,
	processPaymentIntentSucceeded,
	getDonationClaimStatus,
	claimDonation,
	getDonationProgress,
} from "./service";
import { HTTP_STATUS } from "@pdc/http-status-codes";
import { logger } from "@stela/logger";
import type Stripe from "stripe";

export const donationController = Router();

donationController.post(
	"/payment-sheet",
	verifyUserAuthentication,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			validatePaymentSheetRequest(req.body);
			const result = await createPaymentSheet(req.body);
			res.status(HTTP_STATUS.SUCCESSFUL.OK).json(result);
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

donationController.post(
	"/webhook",
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const signature = req.headers["stripe-signature"];
			if (!signature || typeof signature !== "string") {
				res
					.status(HTTP_STATUS.CLIENT_ERROR.BAD_REQUEST)
					.json({ error: "Missing stripe-signature header" });
				return;
			}

			let event: Stripe.Event;
			try {
				const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
				if (!rawBody) {
					res
						.status(HTTP_STATUS.CLIENT_ERROR.BAD_REQUEST)
						.json({ error: "Missing raw body for signature verification" });
					return;
				}
				event = verifyWebhookSignature(rawBody, signature);
			} catch (err) {
				logger.error("Webhook signature verification failed", err);
				res
					.status(HTTP_STATUS.CLIENT_ERROR.BAD_REQUEST)
					.json({ error: "Invalid webhook signature" });
				return;
			}

			switch (event.type) {
				case "payment_intent.succeeded": {
					const paymentIntent = event.data.object as Stripe.PaymentIntent;
					await processPaymentIntentSucceeded(paymentIntent);
					break;
				}
				case "payment_intent.payment_failed": {
					const paymentIntent = event.data.object as Stripe.PaymentIntent;
					logger.error(
						`Payment failed for intent ${paymentIntent.id}: ${paymentIntent.last_payment_error?.message}`,
					);
					break;
				}
				default:
					logger.info(`Unhandled webhook event type: ${event.type}`);
			}

			res.status(HTTP_STATUS.SUCCESSFUL.OK).json({ received: true });
		} catch (err) {
			next(err);
		}
	},
);

donationController.get(
	"/:donationId/claim-status",
	verifyUserAuthentication,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const donationId = parseInt(req.params["donationId"] ?? "", 10);
			if (isNaN(donationId)) {
				res
					.status(HTTP_STATUS.CLIENT_ERROR.BAD_REQUEST)
					.json({ error: "Invalid donation ID" });
				return;
			}

			validateDonationClaimStatusRequest({
				...req.body,
				donationId,
			});

			const accountId = parseInt(req.body.accountId ?? "0", 10);
			const result = await getDonationClaimStatus(donationId, accountId);

			if (!result.canClaim) {
				if (result.reason === "Donation not found") {
					res.status(HTTP_STATUS.CLIENT_ERROR.NOT_FOUND).json({});
					return;
				}
				if (result.reason === "Account mismatch") {
					res.status(HTTP_STATUS.CLIENT_ERROR.UNAUTHORIZED).json({});
					return;
				}
				if (result.reason === "Already claimed") {
					res.status(HTTP_STATUS.CLIENT_ERROR.CONFLICT).json({});
					return;
				}
			}

			res.status(HTTP_STATUS.SUCCESSFUL.OK).json({});
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

donationController.post(
	"/:donationId/claim",
	verifyUserAuthentication,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const donationId = parseInt(req.params["donationId"] ?? "", 10);
			if (isNaN(donationId)) {
				res
					.status(HTTP_STATUS.CLIENT_ERROR.BAD_REQUEST)
					.json({ error: "Invalid donation ID" });
				return;
			}

			validateClaimDonationRequest({
				...req.body,
				donationId,
			});

			const accountId = parseInt(req.body.accountId ?? "0", 10);
			await claimDonation(donationId, accountId);

			res.status(HTTP_STATUS.SUCCESSFUL.OK).json({});
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

donationController.get(
	"/progress",
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const result = await getDonationProgress();
			res.status(HTTP_STATUS.SUCCESSFUL.OK).json(result);
		} catch (err) {
			next(err);
		}
	},
);
