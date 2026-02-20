import Stripe from "stripe";
import createError from "http-errors";
import { logger } from "@stela/logger";
import { db } from "../database";
import { GB } from "../constants";
import type {
	PaymentSheetRequest,
	PaymentSheetResponse,
	DonationProgressResponse,
	DonationRecord,
	WebhookPaymentIntentData,
} from "./models";

const DOLLARS_PER_GB = 10;
const STRIPE_API_VERSION = "2024-12-18.acacia" as const;
const EPHEMERAL_KEY_API_VERSION = "2020-08-27";

let stripeClient: Stripe | null = null;

const getStripe = (): Stripe => {
	if (!stripeClient) {
		const secretKey = process.env["STRIPE_SECRET_KEY"];
		if (!secretKey) {
			throw new Error("STRIPE_SECRET_KEY environment variable is not set");
		}
		stripeClient = new Stripe(secretKey, {
			apiVersion: STRIPE_API_VERSION,
		});
	}
	return stripeClient;
};

const getPublishableKey = (): string => {
	const publishableKey = process.env["STRIPE_PUBLISHABLE_KEY"];
	if (!publishableKey) {
		throw new Error("STRIPE_PUBLISHABLE_KEY environment variable is not set");
	}
	return publishableKey;
};

const getWebhookSecret = (): string => {
	const secret = process.env["STRIPE_WEBHOOK_SECRET"];
	if (!secret) {
		throw new Error("STRIPE_WEBHOOK_SECRET environment variable is not set");
	}
	return secret;
};

const getSlackWebhookUrl = (): string | null => {
	return process.env["SLACK_DONATION_WEBHOOK_URL"] ?? null;
};

const dollarsToGigabytes = (dollars: number): number => {
	return Math.floor(dollars / DOLLARS_PER_GB);
};

const getOrCreateStripeCustomer = async (
	email: string,
	name: string,
	accountId: number,
	anonymous: boolean,
): Promise<Stripe.Customer> => {
	const stripe = getStripe();

	const existingCustomers = await stripe.customers.list({
		email,
		limit: 1,
	});

	if (existingCustomers.data.length > 0) {
		const customer = existingCustomers.data[0];
		if (customer) {
			await stripe.customers.update(customer.id, {
				name,
				metadata: {
					anonymous: anonymous.toString(),
					permAccountId: accountId.toString(),
				},
			});
			return customer;
		}
	}

	return await stripe.customers.create({
		email,
		name,
		metadata: {
			anonymous: anonymous.toString(),
			permAccountId: accountId.toString(),
		},
	});
};

export const createPaymentSheet = async (
	requestBody: PaymentSheetRequest,
): Promise<PaymentSheetResponse> => {
	const stripe = getStripe();

	const accountResult = await db
		.sql<{ accountId: number; primaryEmail: string }>(
			"donation.queries.get_account_by_id",
			{ accountId: requestBody.accountId },
		)
		.catch((err: unknown) => {
			logger.error(err);
			throw new createError.InternalServerError("Failed to verify account");
		});

	if (accountResult.rows.length === 0) {
		throw new createError.NotFound("Account not found");
	}

	const customer = await getOrCreateStripeCustomer(
		requestBody.email,
		requestBody.name,
		requestBody.accountId,
		requestBody.anonymous,
	).catch((err: unknown) => {
		logger.error(err);
		throw new createError.InternalServerError(
			"Failed to create Stripe customer",
		);
	});

	const ephemeralKey = await stripe.ephemeralKeys.create(
		{ customer: customer.id },
		{ apiVersion: EPHEMERAL_KEY_API_VERSION },
	);

	const paymentIntent = await stripe.paymentIntents.create({
		amount: requestBody.amount,
		currency: "usd",
		customer: customer.id,
		automatic_payment_methods: {
			enabled: true,
		},
		metadata: {
			accountId: requestBody.accountId.toString(),
			anonymous: requestBody.anonymous.toString(),
			name: requestBody.name,
			email: requestBody.email,
		},
	});

	if (!paymentIntent.client_secret) {
		throw new createError.InternalServerError(
			"Failed to create payment intent - no client secret",
		);
	}

	if (!ephemeralKey.secret) {
		throw new createError.InternalServerError(
			"Failed to create ephemeral key - no secret",
		);
	}

	return {
		paymentIntentClientSecret: paymentIntent.client_secret,
		ephemeralKeySecret: ephemeralKey.secret,
		customerId: customer.id,
		publishableKey: getPublishableKey(),
	};
};

export const verifyWebhookSignature = (
	payload: string | Buffer,
	signature: string,
): Stripe.Event => {
	const stripe = getStripe();
	const webhookSecret = getWebhookSecret();

	return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
};

export const processPaymentIntentSucceeded = async (
	paymentIntent: Stripe.PaymentIntent,
): Promise<void> => {
	const stripe = getStripe();

	const existingDonation = await db
		.sql<{ donationId: number }>(
			"donation.queries.get_donation_by_payment_intent",
			{ paymentIntentId: paymentIntent.id },
		)
		.catch((err: unknown) => {
			logger.error(err);
			throw new createError.InternalServerError(
				"Failed to check existing donation",
			);
		});

	if (existingDonation.rows.length > 0) {
		logger.info(`Donation already exists for payment intent ${paymentIntent.id}`);
		return;
	}

	const accountId = paymentIntent.metadata?.["accountId"];
	const anonymous = paymentIntent.metadata?.["anonymous"] === "true";
	const name = paymentIntent.metadata?.["name"] ?? "Anonymous";
	const email = paymentIntent.metadata?.["email"] ?? "";

	if (!accountId) {
		logger.error(`No accountId in payment intent metadata: ${paymentIntent.id}`);
		throw new createError.BadRequest("Missing accountId in payment metadata");
	}

	let paymentMethodLast4: string | null = null;
	let billingZip: string | null = null;

	if (paymentIntent.payment_method) {
		const paymentMethodId =
			typeof paymentIntent.payment_method === "string"
				? paymentIntent.payment_method
				: paymentIntent.payment_method.id;

		const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
		paymentMethodLast4 = paymentMethod.card?.last4 ?? null;
		billingZip = paymentMethod.billing_details?.address?.postal_code ?? null;
	}

	const customerId =
		typeof paymentIntent.customer === "string"
			? paymentIntent.customer
			: paymentIntent.customer?.id ?? null;

	const amountCents = paymentIntent.amount;
	const amountDollars = amountCents / 100;

	const donationResult = await db
		.sql<{
			donationId: number;
			accountId: number;
			amountCents: number;
			amountDollars: string;
		}>("donation.queries.create_donation", {
			accountId: parseInt(accountId, 10),
			email,
			name,
			amountCents,
			amountDollars,
			stripeCustomerId: customerId,
			stripePaymentIntentId: paymentIntent.id,
			anonymous,
			client: "mobile",
			paymentMethodLast4,
			billingZip,
		})
		.catch((err: unknown) => {
			logger.error(err);
			throw new createError.InternalServerError("Failed to create donation");
		});

	const donation = donationResult.rows[0];
	if (!donation) {
		throw new createError.InternalServerError(
			"Failed to create donation - no result returned",
		);
	}

	await db
		.sql("donation.queries.create_donation_public", {
			donationId: donation.donationId,
			displayName: anonymous ? "Anonymous" : name,
			amountDollars,
		})
		.catch((err: unknown) => {
			logger.error(err);
		});

	const storageGb = dollarsToGigabytes(amountDollars);
	if (storageGb > 0) {
		await claimDonationStorage(donation.donationId, parseInt(accountId, 10));
	}

	await sendSlackNotification(name, amountDollars, anonymous);
};

export const claimDonationStorage = async (
	donationId: number,
	accountId: number,
): Promise<void> => {
	await db.transaction(async (transactionDb) => {
		const donationResult = await transactionDb
			.sql<{
				donationId: number;
				accountId: number;
				amountCents: number;
				amountDollars: string;
				claimed: boolean;
			}>("donation.queries.get_donation_for_update", { donationId })
			.catch((err: unknown) => {
				logger.error(err);
				throw new createError.InternalServerError("Failed to get donation");
			});

		const donation = donationResult.rows[0];
		if (!donation) {
			throw new createError.NotFound("Donation not found");
		}

		if (donation.accountId !== accountId) {
			throw new createError.Unauthorized(
				"Account does not match donation account",
			);
		}

		if (donation.claimed) {
			logger.info(`Donation ${donationId} already claimed`);
			return;
		}

		const amountDollars = parseFloat(donation.amountDollars);
		const storageGb = dollarsToGigabytes(amountDollars);
		const storageAmountInBytes = storageGb * GB;

		if (storageGb <= 0) {
			await transactionDb.sql("donation.queries.update_donation_claimed", {
				donationId,
			});
			return;
		}

		await transactionDb
			.sql("donation.queries.credit_account_storage", {
				accountId,
				storageAmountInBytes,
			})
			.catch((err: unknown) => {
				logger.error(err);
				throw new createError.InternalServerError(
					"Failed to credit account storage",
				);
			});

		await transactionDb
			.sql("donation.queries.record_donation_ledger", {
				accountId,
				storageAmountInBytes,
				donationAmountDollars: amountDollars,
			})
			.catch((err: unknown) => {
				logger.error(err);
				throw new createError.InternalServerError(
					"Failed to record donation in ledger",
				);
			});

		await transactionDb
			.sql("donation.queries.update_donation_claimed", { donationId })
			.catch((err: unknown) => {
				logger.error(err);
				throw new createError.InternalServerError(
					"Failed to mark donation as claimed",
				);
			});
	});
};

export const getDonationClaimStatus = async (
	donationId: number,
	accountId: number,
): Promise<{ canClaim: boolean; reason?: string }> => {
	const donationResult = await db
		.sql<{
			donationId: number;
			accountId: number;
			claimed: boolean;
		}>("donation.queries.get_donation_by_id", { donationId })
		.catch((err: unknown) => {
			logger.error(err);
			throw new createError.InternalServerError("Failed to get donation");
		});

	const donation = donationResult.rows[0];
	if (!donation) {
		return { canClaim: false, reason: "Donation not found" };
	}

	if (donation.accountId !== accountId) {
		return { canClaim: false, reason: "Account mismatch" };
	}

	if (donation.claimed) {
		return { canClaim: false, reason: "Already claimed" };
	}

	return { canClaim: true };
};

export const claimDonation = async (
	donationId: number,
	accountId: number,
): Promise<void> => {
	const status = await getDonationClaimStatus(donationId, accountId);

	if (!status.canClaim) {
		if (status.reason === "Donation not found") {
			throw new createError.NotFound("Donation not found");
		}
		if (status.reason === "Account mismatch") {
			throw new createError.Unauthorized(
				"Account does not match donation account",
			);
		}
		if (status.reason === "Already claimed") {
			throw new createError.Conflict("Donation already claimed");
		}
	}

	await claimDonationStorage(donationId, accountId);
};

export const getDonationProgress = async (): Promise<DonationProgressResponse> => {
	const result = await db
		.sql<{
			totalDollars: string;
			totalDonations: number;
			goalDollars: string;
			campaignName: string | null;
		}>("donation.queries.get_campaign_totals", {})
		.catch((err: unknown) => {
			logger.error(err);
			throw new createError.InternalServerError(
				"Failed to get campaign progress",
			);
		});

	const data = result.rows[0];

	const totalDollars = data ? parseFloat(data.totalDollars) : 0;
	const totalDonations = data?.totalDonations ?? 0;
	const goalDollars = data ? parseFloat(data.goalDollars) : 0;
	const campaignName = data?.campaignName ?? null;

	return {
		totalDollars,
		totalDonations,
		totalStorageGb: dollarsToGigabytes(totalDollars),
		goalDollars,
		campaignName,
	};
};

const sendSlackNotification = async (
	donorName: string,
	amountDollars: number,
	anonymous: boolean,
): Promise<void> => {
	const webhookUrl = getSlackWebhookUrl();
	if (!webhookUrl) {
		return;
	}

	const displayName = anonymous ? "Anonymous" : donorName;
	const storageGb = dollarsToGigabytes(amountDollars);

	const message = {
		text: `New donation: ${displayName} donated $${amountDollars.toFixed(2)} (${storageGb} GB)`,
	};

	try {
		await fetch(webhookUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(message),
		});
	} catch (err) {
		logger.error("Failed to send Slack notification", err);
	}
};
