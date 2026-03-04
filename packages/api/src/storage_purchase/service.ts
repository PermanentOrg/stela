import Stripe from "stripe";
import createError from "http-errors";
import { logger } from "@stela/logger";
import { db } from "../database";
import { stripeClient } from "../stripe";
import { legacyClient } from "../legacy_client";
import type { StoragePurchaseRequest, StoragePurchaseResponse } from "./models";

const CENTS_PER_DOLLAR = 100;

// This function should in the future be simplified and renamed to `createStripeCustomer`
// For the moment, it has to be more complex because some clients still use an older version
// of our Stripe integration which does not save the Stripe customer ID to our database. Once
// all clients are using this endpoint to create payment intents, we'll run a script to add customer
// IDs to all accounts that have a corresponding Stripe customer, then update this method to simply
// create new Stripe customers for accounts that don't have them yet.
const determineStripeCustomerId = async (
	email: string,
	accountId: string,
	name: string,
): Promise<string> => {
	const stripeCustomers = await stripeClient.customers
		.list({ limit: 1, email })
		.catch((err: unknown) => {
			logger.error(err);
			throw new createError.InternalServerError(
				"Failed to look up Stripe customer",
			);
		});

	if (stripeCustomers.data[0] !== undefined) {
		await db
			.sql("storage_purchase.queries.set_stripe_customer_id", {
				email,
				stripeCustomerId: stripeCustomers.data[0].id,
			})
			.catch((err: unknown) => {
				logger.error(err);
				throw new createError.InternalServerError(
					"Failed to save Stripe customer ID",
				);
			});
		return stripeCustomers.data[0].id;
	}

	const { id } = await stripeClient.customers
		.create({ email, name, metadata: { permAccountId: accountId } })
		.catch((err: unknown) => {
			logger.error(err);
			throw new createError.InternalServerError(
				"Failed to create Stripe customer",
			);
		});
	await db
		.sql("storage_purchase.queries.set_stripe_customer_id", {
			email,
			stripeCustomerId: id,
		})
		.catch((err: unknown) => {
			logger.error(err);
			throw new createError.InternalServerError(
				"Failed to save Stripe customer ID",
			);
		});
	return id;
};

export const initiateStoragePurchase = async (
	requestBody: StoragePurchaseRequest,
): Promise<StoragePurchaseResponse> => {
	const accountResult = await db
		.sql<{
			stripeCustomerId: string | null;
			name: string;
			accountId: string;
		}>("storage_purchase.queries.get_account_data", {
			email: requestBody.emailFromAuthToken,
		})
		.catch((err: unknown) => {
			logger.error(err);
			throw new createError.InternalServerError("Failed to look up account");
		});

	if (accountResult.rows[0] === undefined) {
		throw new createError.InternalServerError("Failed to look up account");
	}

	const customerId =
		accountResult.rows[0].stripeCustomerId ??
		(await determineStripeCustomerId(
			requestBody.emailFromAuthToken,
			accountResult.rows[0].accountId,
			accountResult.rows[0].name,
		));

	const paymentIntent = await stripeClient.paymentIntents
		.create({
			amount: requestBody.amountInUSD * CENTS_PER_DOLLAR,
			currency: "usd",
			customer: customerId,
			automatic_payment_methods: { enabled: true },
		})
		.catch((err: unknown) => {
			logger.error(err);
			throw new createError.InternalServerError(
				"Failed to create payment intent",
			);
		});

	if (paymentIntent.client_secret === null) {
		logger.error("Stripe payment intent missing client secret");
		throw new createError.InternalServerError(
			"Failed to create payment intent",
		);
	}

	return {
		clientSecret: paymentIntent.client_secret,
	};
};

export const handleStripeWebhook = async (
	rawBody: Buffer,
	signature: string | string[],
): Promise<void> => {
	const {
		env: { STRIPE_WEBHOOK_SECRET: webhookSecret },
	} = process;
	if (webhookSecret === undefined) {
		logger.error("STRIPE_WEBHOOK_SECRET is not configured");
		throw new createError.InternalServerError(
			"Stripe webhook secret is not configured",
		);
	}

	try {
		const event = stripeClient.webhooks.constructEvent(
			rawBody,
			signature,
			webhookSecret,
		);

		switch (event.type) {
			case "payment_intent.succeeded":
				await creditAccountStorage(event.data.object);
				break;
			case "payment_intent.payment_failed":
				logger.info("Stripe payment failed", {
					paymentIntentId: event.data.object.id,
				});
				break;
			default: // This is an event that we don't need to take action upon
		}
	} catch (err) {
		if (err instanceof Stripe.errors.StripeSignatureVerificationError) {
			throw new createError.BadRequest("Invalid Stripe webhook signature");
		}
		throw err;
	}
};

const sendSlackNotification = async (
	name: string,
	amountInDollars: number,
): Promise<void> => {
	const {
		env: { SLACK_WEBHOOK_URL: webhookUrl },
	} = process;
	if (webhookUrl === undefined) {
		return;
	}

	try {
		const response = await fetch(webhookUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				text: `NEW PURCHASE - ${name} just spent $${amountInDollars.toString()} on storage!`,
				icon_url:
					"https://www.permanent.org/app/assets/icon/android-chrome-192x192.png",
			}),
		});
		if (!response.ok) {
			logger.error(response.body);
		}
	} catch (err: unknown) {
		logger.error(err);
	}
};

const creditAccountStorage = async (
	paymentIntent: Stripe.PaymentIntent,
): Promise<void> => {
	if (typeof paymentIntent.customer !== "string") {
		throw new createError.BadRequest("Payment intent missing customer ID");
	}

	const accountResult = await db
		.sql<{
			accountId: string;
			name: string;
		}>("storage_purchase.queries.get_account_by_stripe_customer_id", {
			stripeCustomerId: paymentIntent.customer,
		})
		.catch((err: unknown) => {
			logger.error(err);
			throw new createError.InternalServerError("Failed to look up account");
		});

	if (accountResult.rows[0] === undefined) {
		throw new createError.InternalServerError(
			"No account found for Stripe customer",
		);
	}

	const claimResponse = await legacyClient
		.creditStorage({
			accountId: +accountResult.rows[0].accountId,
			donationAmountInCents: paymentIntent.amount,
			paymentIntentId: paymentIntent.id,
		})
		.catch((err: unknown) => {
			logger.error(err);
			throw new createError.InternalServerError("Failed to claim storage");
		});

	if (!claimResponse.ok) {
		logger.error("Legacy API returned error for claimPledge", {
			status: claimResponse.status,
		});
		throw new createError.InternalServerError("Failed to claim storage");
	}

	await sendSlackNotification(
		accountResult.rows[0].name,
		paymentIntent.amount / CENTS_PER_DOLLAR,
	);
};
