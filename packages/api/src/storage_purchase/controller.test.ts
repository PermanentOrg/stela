import request from "supertest";
import { app } from "../app";
import { db } from "../database";
import { stripeClient } from "../stripe";
import { verifyUserAuthentication } from "../middleware";
import { mockVerifyUserAuthentication } from "../../test/middleware_mocks";

jest.mock("../database");
jest.mock("../stripe");
jest.mock("../middleware");
jest.mock("@stela/logger");

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
		jest
			.spyOn(stripeClient.customers, "list")
			.mockImplementation(
				jest.fn().mockResolvedValue({ data: [{ id: "cus_stripe123" }] }),
			);
		jest
			.spyOn(stripeClient.customers, "create")
			.mockImplementation(jest.fn().mockResolvedValue({ id: "cus_new123" }));
		jest
			.spyOn(stripeClient.paymentIntents, "create")
			.mockImplementation(
				jest.fn().mockResolvedValue({ client_secret: "test_client_secret" }),
			);
		await clearDatabase();
		await loadFixtures();
	});

	afterEach(async () => {
		await clearDatabase();
		jest.restoreAllMocks();
		jest.clearAllMocks();
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
		jest
			.spyOn(stripeClient.customers, "list")
			.mockImplementation(jest.fn().mockResolvedValue({ data: [] }));
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
		const dbSpy = jest.spyOn(db, "sql");
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
		jest
			.spyOn(db, "sql")
			.mockImplementationOnce(
				jest.fn().mockRejectedValueOnce(new Error("DB error")),
			);
		await agent
			.post("/api/v2/storage-purchases")
			.send({ amountInUSD: 10 })
			.expect(500);
	});

	test("should return 500 if the Stripe customer lookup fails", async () => {
		jest
			.spyOn(stripeClient.customers, "list")
			.mockImplementationOnce(
				jest.fn().mockRejectedValueOnce(new Error("Stripe error")),
			);
		await agent
			.post("/api/v2/storage-purchases")
			.send({ amountInUSD: 10 })
			.expect(500);
	});

	test("should return 500 if Stripe customer creation fails", async () => {
		jest
			.spyOn(stripeClient.customers, "list")
			.mockImplementationOnce(jest.fn().mockResolvedValueOnce({ data: [] }));
		jest
			.spyOn(stripeClient.customers, "create")
			.mockImplementationOnce(
				jest.fn().mockRejectedValueOnce(new Error("Stripe error")),
			);
		await agent
			.post("/api/v2/storage-purchases")
			.send({ amountInUSD: 10 })
			.expect(500);
	});

	test("should return 500 if saving the customer ID fails", async () => {
		jest
			.spyOn(db, "sql")
			.mockImplementationOnce(
				jest.fn().mockResolvedValueOnce({ rows: [{ stripeCustomerId: null }] }),
			)
			.mockImplementationOnce(
				jest.fn().mockRejectedValueOnce(new Error("DB error")),
			);
		await agent
			.post("/api/v2/storage-purchases")
			.send({ amountInUSD: 10 })
			.expect(500);
	});

	test("should return 500 if payment intent creation fails", async () => {
		jest
			.spyOn(stripeClient.paymentIntents, "create")
			.mockImplementationOnce(
				jest.fn().mockRejectedValueOnce(new Error("Stripe error")),
			);
		await agent
			.post("/api/v2/storage-purchases")
			.send({ amountInUSD: 10 })
			.expect(500);
	});
});
