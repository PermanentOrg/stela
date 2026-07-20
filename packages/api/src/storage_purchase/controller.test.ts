import request from "supertest";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import Stripe from "stripe";
import { logger } from "@stela/logger";
import { app } from "../app.js";
import { db } from "../database.js";
import { stripeClient } from "../stripe.js";
import { legacyClient } from "../legacy_client.js";
import { verifyUserAuthentication } from "../middleware/index.js";
import { mockVerifyUserAuthentication } from "../../test/middleware_mocks.js";

vi.mock("../database");
vi.mock("../stripe");
vi.mock("../legacy_client");
vi.mock("../middleware");
vi.mock("@stela/logger");

const loadFixtures = async (): Promise<void> => {
	await db.sql("storage_purchase.fixtures.create_test_accounts");
};

const clearDatabase = async (): Promise<void> => {
	await db.query("TRUNCATE account CASCADE");
};

describe("POST /storage-purchases", () => {
	const agent = request(app);

	beforeEach(async () => {
		mockVerifyUserAuthentication(
			"test@permanent.org",
			"5a4b6d8c-2e1f-7a3b-9c0d-4e5f6a7b8c9d",
		);
		vi.spyOn(stripeClient.customers, "list").mockImplementation(
			vi.fn().mockResolvedValue({ data: [{ id: "cus_stripe123" }] }),
		);
		vi.spyOn(stripeClient.customers, "create").mockImplementation(
			vi.fn().mockResolvedValue({ id: "cus_new123" }),
		);
		vi.spyOn(stripeClient.paymentIntents, "create").mockImplementation(
			vi.fn().mockResolvedValue({ client_secret: "test_client_secret" }),
		);
		await clearDatabase();
		await loadFixtures();
	});

	afterEach(async () => {
		await clearDatabase();
		vi.restoreAllMocks();
		vi.clearAllMocks();
	});

	test("should call verifyUserAuthentication", async () => {
		await agent.post("/api/v2/storage-purchases").send({ amountInUSD: 10 });
		expect(verifyUserAuthentication).toHaveBeenCalled();
	});

	test("should return 201 with clientSecret on success", async () => {
		const response = await agent
			.post("/api/v2/storage-purchases")
			.send({ amountInUSD: 10 })
			.expect(201);
		expect(response.body).toEqual({
			data: { clientSecret: "test_client_secret" },
		});
	});

	test("should use the stripe customer ID from the database if present", async () => {
		mockVerifyUserAuthentication(
			"test+1@permanent.org",
			"5a4b6d8c-2e1f-7a3b-9c0d-4e5f6a7b8c9d",
		);
		await agent
			.post("/api/v2/storage-purchases")
			.send({ amountInUSD: 10 })
			.expect(201);
		expect(stripeClient.customers.list).not.toHaveBeenCalled();
		expect(stripeClient.paymentIntents.create).toHaveBeenCalledWith(
			expect.objectContaining({ customer: "cus_existing123" }),
		);
	});

	test("should look up the Stripe customer by email if no database customer ID", async () => {
		await agent
			.post("/api/v2/storage-purchases")
			.send({ amountInUSD: 10 })
			.expect(201);
		expect(stripeClient.customers.list).toHaveBeenCalledWith({
			limit: 1,
			email: "test@permanent.org",
		});
		expect(stripeClient.paymentIntents.create).toHaveBeenCalledWith(
			expect.objectContaining({ customer: "cus_stripe123" }),
		);
	});

	test("should create a new Stripe customer if none exists", async () => {
		vi.spyOn(stripeClient.customers, "list").mockImplementation(
			vi.fn().mockResolvedValue({ data: [] }),
		);
		await agent
			.post("/api/v2/storage-purchases")
			.send({ amountInUSD: 10 })
			.expect(201);
		expect(stripeClient.customers.create).toHaveBeenCalledWith({
			email: "test@permanent.org",
			metadata: {
				permAccountId: "2",
			},
			name: "Test User",
		});
		expect(stripeClient.paymentIntents.create).toHaveBeenCalledWith(
			expect.objectContaining({ customer: "cus_new123" }),
		);
	});

	test("should save the Stripe customer ID to the database", async () => {
		await agent
			.post("/api/v2/storage-purchases")
			.send({ amountInUSD: 10 })
			.expect(201);
		const result = await db.query<{ stripecustomerid: string }>(
			"SELECT stripecustomerid FROM account WHERE primaryemail = 'test@permanent.org'",
		);
		expect(result.rows[0]?.stripecustomerid).toBe("cus_stripe123");
	});

	test("should not update the database if the customer ID was already present", async () => {
		mockVerifyUserAuthentication(
			"test+1@permanent.org",
			"5a4b6d8c-2e1f-7a3b-9c0d-4e5f6a7b8c9d",
		);
		const dbSpy = vi.spyOn(db, "sql");
		await agent
			.post("/api/v2/storage-purchases")
			.send({ amountInUSD: 10 })
			.expect(201);
		expect(dbSpy).not.toHaveBeenCalledWith(
			"storage_purchase.queries.set_stripe_customer_id",
			expect.anything(),
		);
	});

	test("should create a PaymentIntent with the amount converted to cents", async () => {
		await agent
			.post("/api/v2/storage-purchases")
			.send({ amountInUSD: 10 })
			.expect(201);
		expect(stripeClient.paymentIntents.create).toHaveBeenCalledWith(
			expect.objectContaining({ amount: 1000 }),
		);
	});

	test("should return 400 if amountInUSD is missing", async () => {
		await agent.post("/api/v2/storage-purchases").send({}).expect(400);
	});

	test("should return 400 if amountInUSD is not an integer", async () => {
		await agent
			.post("/api/v2/storage-purchases")
			.send({ amountInUSD: 1.5 })
			.expect(400);
	});

	test("should return 400 if amountInUSD is less than 1", async () => {
		await agent
			.post("/api/v2/storage-purchases")
			.send({ amountInUSD: 0 })
			.expect(400);
	});

	test("should return 500 if the account lookup fails", async () => {
		vi.spyOn(db, "sql").mockImplementationOnce(
			vi.fn().mockRejectedValueOnce(new Error("DB error")),
		);
		await agent
			.post("/api/v2/storage-purchases")
			.send({ amountInUSD: 10 })
			.expect(500);
	});

	test("should return 500 if the Stripe customer lookup fails", async () => {
		vi.spyOn(stripeClient.customers, "list").mockImplementationOnce(
			vi.fn().mockRejectedValueOnce(new Error("Stripe error")),
		);
		await agent
			.post("/api/v2/storage-purchases")
			.send({ amountInUSD: 10 })
			.expect(500);
	});

	test("should return 500 if Stripe customer creation fails", async () => {
		vi.spyOn(stripeClient.customers, "list").mockImplementationOnce(
			vi.fn().mockResolvedValueOnce({ data: [] }),
		);
		vi.spyOn(stripeClient.customers, "create").mockImplementationOnce(
			vi.fn().mockRejectedValueOnce(new Error("Stripe error")),
		);
		await agent
			.post("/api/v2/storage-purchases")
			.send({ amountInUSD: 10 })
			.expect(500);
	});

	test("should return 500 if saving the customer ID fails", async () => {
		vi.spyOn(db, "sql")
			.mockImplementationOnce(
				vi.fn().mockResolvedValueOnce({ rows: [{ stripeCustomerId: null }] }),
			)
			.mockImplementationOnce(
				vi.fn().mockRejectedValueOnce(new Error("DB error")),
			);
		await agent
			.post("/api/v2/storage-purchases")
			.send({ amountInUSD: 10 })
			.expect(500);
	});

	test("should return 500 if payment intent creation fails", async () => {
		vi.spyOn(stripeClient.paymentIntents, "create").mockImplementationOnce(
			vi.fn().mockRejectedValueOnce(new Error("Stripe error")),
		);
		await agent
			.post("/api/v2/storage-purchases")
			.send({ amountInUSD: 10 })
			.expect(500);
	});
});

describe("POST /storage-purchases/stripe/webhook", () => {
	const agent = request(app);

	const mockPaymentIntent = {
		id: "pi_test123",
		customer: "cus_existing123",
		amount: 10000,
	};

	const mockSuccessEvent = {
		type: "payment_intent.succeeded",
		data: { object: mockPaymentIntent },
	};

	beforeEach(async () => {
		process.env["STRIPE_WEBHOOK_SECRET"] = "test_webhook_secret";
		vi.spyOn(stripeClient.webhooks, "constructEvent").mockImplementation(
			vi.fn().mockReturnValue(mockSuccessEvent),
		);
		vi.spyOn(legacyClient, "creditStorage").mockImplementation(
			vi.fn().mockResolvedValue({ ok: true }),
		);
		await clearDatabase();
		await loadFixtures();
	});

	afterEach(async () => {
		delete process.env["STRIPE_WEBHOOK_SECRET"];
		delete process.env["SLACK_WEBHOOK_URL"];
		await clearDatabase();
		vi.restoreAllMocks();
		vi.clearAllMocks();
	});

	test("should return 400 if no stripe-signature header", async () => {
		await agent
			.post("/api/v2/storage-purchases/stripe/webhook")
			.set("Content-Type", "application/json")
			.send("{}")
			.expect(400);
	});

	test("should return 400 if the body is not a raw buffer", async () => {
		await agent
			.post("/api/v2/storage-purchases/stripe/webhook")
			.set("stripe-signature", "test_sig")
			.set("Content-Type", "text/plain")
			.send("not a buffer")
			.expect(400);
	});

	test("should return 400 if Stripe signature verification fails", async () => {
		const signatureError = new Stripe.errors.StripeSignatureVerificationError({
			type: "api_error",
		});
		vi.spyOn(stripeClient.webhooks, "constructEvent").mockImplementationOnce(
			vi.fn().mockImplementation(() => {
				throw signatureError;
			}),
		);
		await agent
			.post("/api/v2/storage-purchases/stripe/webhook")
			.set("stripe-signature", "invalid_sig")
			.set("Content-Type", "application/json")
			.send("{}")
			.expect(400);
	});

	test("should return 200 on payment_intent.succeeded", async () => {
		await agent
			.post("/api/v2/storage-purchases/stripe/webhook")
			.set("stripe-signature", "test_sig")
			.set("Content-Type", "application/json")
			.send("{}")
			.expect(200);
	});

	test("should call creditStorage with the correct params on payment_intent.succeeded", async () => {
		await agent
			.post("/api/v2/storage-purchases/stripe/webhook")
			.set("stripe-signature", "test_sig")
			.set("Content-Type", "application/json")
			.send("{}");
		expect(legacyClient.creditStorage).toHaveBeenCalledWith({
			accountId: 3,
			donationAmountInCents: 10000,
			paymentIntentId: "pi_test123",
		});
	});

	test("should return 200 on payment_intent.payment_failed and log the failure", async () => {
		vi.spyOn(stripeClient.webhooks, "constructEvent").mockImplementation(
			vi.fn().mockReturnValueOnce({
				type: "payment_intent.payment_failed",
				data: { object: mockPaymentIntent },
			}),
		);
		await agent
			.post("/api/v2/storage-purchases/stripe/webhook")
			.set("stripe-signature", "test_sig")
			.set("Content-Type", "application/json")
			.send("{}")
			.expect(200);
		expect(logger.info).toHaveBeenCalledWith("Stripe payment failed", {
			paymentIntentId: "pi_test123",
		});
	});

	test("should return 200 on unhandled event types", async () => {
		vi.spyOn(stripeClient.webhooks, "constructEvent").mockImplementation(
			vi.fn().mockReturnValueOnce({
				type: "customer.created",
				data: { object: {} },
			}),
		);
		await agent
			.post("/api/v2/storage-purchases/stripe/webhook")
			.set("stripe-signature", "test_sig")
			.set("Content-Type", "application/json")
			.send("{}")
			.expect(200);
	});

	test("should return 500 if the webhook secret is not set", async () => {
		delete process.env["STRIPE_WEBHOOK_SECRET"];
		await agent
			.post("/api/v2/storage-purchases/stripe/webhook")
			.set("stripe-signature", "test_sig")
			.set("Content-Type", "application/json")
			.send("{}")
			.expect(500);
	});

	test("should return 400 if the payment intent customer is not a string", async () => {
		vi.spyOn(stripeClient.webhooks, "constructEvent").mockImplementation(
			vi.fn().mockReturnValue({
				...mockSuccessEvent,
				data: { object: { ...mockPaymentIntent, customer: null } },
			}),
		);
		await agent
			.post("/api/v2/storage-purchases/stripe/webhook")
			.set("stripe-signature", "test_sig")
			.set("Content-Type", "application/json")
			.send("{}")
			.expect(400);
	});

	test("should return 500 if the account lookup fails", async () => {
		vi.spyOn(db, "sql").mockImplementationOnce(
			vi.fn().mockRejectedValueOnce(new Error("DB error")),
		);
		await agent
			.post("/api/v2/storage-purchases/stripe/webhook")
			.set("stripe-signature", "test_sig")
			.set("Content-Type", "application/json")
			.send("{}")
			.expect(500);
	});

	test("should return 500 if no account is found for the Stripe customer", async () => {
		vi.spyOn(db, "sql").mockImplementationOnce(
			vi.fn().mockResolvedValueOnce({ rows: [] }),
		);
		await agent
			.post("/api/v2/storage-purchases/stripe/webhook")
			.set("stripe-signature", "test_sig")
			.set("Content-Type", "application/json")
			.send("{}")
			.expect(500);
	});

	test("should return 500 if creditStorage throws", async () => {
		vi.spyOn(legacyClient, "creditStorage").mockRejectedValueOnce(
			new Error("Network error"),
		);
		await agent
			.post("/api/v2/storage-purchases/stripe/webhook")
			.set("stripe-signature", "test_sig")
			.set("Content-Type", "application/json")
			.send("{}")
			.expect(500);
	});

	test("should return 500 if the legacy API returns an error", async () => {
		vi.spyOn(legacyClient, "creditStorage").mockImplementation(
			vi.fn().mockResolvedValueOnce({ ok: false, status: 500 }),
		);
		await agent
			.post("/api/v2/storage-purchases/stripe/webhook")
			.set("stripe-signature", "test_sig")
			.set("Content-Type", "application/json")
			.send("{}")
			.expect(500);
	});

	test("should send a Slack notification on payment_intent.succeeded", async () => {
		process.env["SLACK_WEBHOOK_URL"] = "https://hooks.slack.com/test";
		vi.spyOn(global, "fetch").mockImplementation(
			vi.fn().mockResolvedValue({ ok: true }),
		);
		await agent
			.post("/api/v2/storage-purchases/stripe/webhook")
			.set("stripe-signature", "test_sig")
			.set("Content-Type", "application/json")
			.send("{}");
		expect(global.fetch).toHaveBeenCalledWith(
			"https://hooks.slack.com/test",
			expect.objectContaining({
				method: "POST",
				body: JSON.stringify({
					text: "NEW PURCHASE - Test User 2 just spent $100 on storage!",
					icon_url:
						"https://www.permanent.org/app/assets/icon/android-chrome-192x192.png",
				}),
			}),
		);
	});

	test("should not send a Slack notification if SLACK_WEBHOOK_URL is not set", async () => {
		vi.spyOn(global, "fetch").mockImplementation(
			vi.fn().mockResolvedValue({ ok: true }),
		);
		await agent
			.post("/api/v2/storage-purchases/stripe/webhook")
			.set("stripe-signature", "test_sig")
			.set("Content-Type", "application/json")
			.send("{}");
		expect(global.fetch).not.toHaveBeenCalled();
	});

	test("should return 200 if the Slack notification fails", async () => {
		process.env["SLACK_WEBHOOK_URL"] = "https://hooks.slack.com/test";
		vi.spyOn(global, "fetch").mockRejectedValue(new Error("Slack error"));
		await agent
			.post("/api/v2/storage-purchases/stripe/webhook")
			.set("stripe-signature", "test_sig")
			.set("Content-Type", "application/json")
			.send("{}")
			.expect(200);
	});
});
