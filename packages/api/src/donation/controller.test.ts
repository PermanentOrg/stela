import request from "supertest";
import { when } from "jest-when";
import { logger } from "@stela/logger";
import { app } from "../app";
import { verifyUserAuthentication } from "../middleware";
import { db } from "../database";
import { GB } from "../constants";
import { mockVerifyUserAuthentication } from "../../test/middleware_mocks";

jest.mock("../database");
jest.mock("../middleware");
jest.mock("@stela/logger");

const mockStripeCustomersCreate = jest.fn();
const mockStripeCustomersList = jest.fn();
const mockStripeCustomersUpdate = jest.fn();
const mockStripeEphemeralKeysCreate = jest.fn();
const mockStripePaymentIntentsCreate = jest.fn();
const mockStripePaymentMethodsRetrieve = jest.fn();
const mockStripeWebhooksConstructEvent = jest.fn();

jest.mock("stripe", () => {
	return jest.fn().mockImplementation(() => ({
		customers: {
			create: mockStripeCustomersCreate,
			list: mockStripeCustomersList,
			update: mockStripeCustomersUpdate,
		},
		ephemeralKeys: {
			create: mockStripeEphemeralKeysCreate,
		},
		paymentIntents: {
			create: mockStripePaymentIntentsCreate,
		},
		paymentMethods: {
			retrieve: mockStripePaymentMethodsRetrieve,
		},
		webhooks: {
			constructEvent: mockStripeWebhooksConstructEvent,
		},
	}));
});

interface AccountSpace {
	spaceLeft: string;
	spaceTotal: string;
}

interface Donation {
	donationId: number;
	accountId: number;
	amountCents: number;
	amountDollars: string;
	claimed: boolean;
}

const clearDatabase = async (): Promise<void> => {
	await db.query(
		"TRUNCATE account, account_space, ledger_financial, donation, donation_public, donation_campaign CASCADE",
	);
};

const getAccountSpace = async (
	accountId: string,
): Promise<AccountSpace | undefined> => {
	const result = await db.query<AccountSpace>(
		'SELECT spaceleft "spaceLeft", spacetotal "spaceTotal" FROM account_space WHERE accountid = :accountId',
		{ accountId },
	);
	return result.rows[0];
};

const getDonation = async (donationId: number): Promise<Donation | undefined> => {
	const result = await db.query<Donation>(
		`SELECT
			donationid "donationId",
			accountid "accountId",
			amount_cents "amountCents",
			amount_dollars "amountDollars",
			claimed
		FROM donation
		WHERE donationid = :donationId`,
		{ donationId },
	);
	return result.rows[0];
};

describe("/donation/payment-sheet", () => {
	const agent = request(app);

	beforeEach(async () => {
		process.env["STRIPE_SECRET_KEY"] = "sk_test_fake";
		process.env["STRIPE_PUBLISHABLE_KEY"] = "pk_test_fake";
		process.env["STRIPE_WEBHOOK_SECRET"] = "whsec_test_fake";

		mockVerifyUserAuthentication(
			"test@permanent.org",
			"13bb917e-7c75-4971-a8ee-b22e82432888",
		);
		await clearDatabase();

		mockStripeCustomersList.mockResolvedValue({ data: [] });
		mockStripeCustomersCreate.mockResolvedValue({
			id: "cus_test123",
			email: "test@permanent.org",
		});
		mockStripeEphemeralKeysCreate.mockResolvedValue({
			secret: "ek_test_secret",
		});
		mockStripePaymentIntentsCreate.mockResolvedValue({
			id: "pi_test123",
			client_secret: "pi_test123_secret_xyz",
		});
	});

	afterEach(async () => {
		await clearDatabase();
		jest.clearAllMocks();
	});

	test("should call verifyUserAuthentication", async () => {
		await agent.post("/api/v2/donation/payment-sheet");
		expect(verifyUserAuthentication).toHaveBeenCalled();
	});

	test("should return invalid request status if email from auth token is missing", async () => {
		mockVerifyUserAuthentication(
			undefined,
			"13bb917e-7c75-4971-a8ee-b22e82432888",
		);
		await agent.post("/api/v2/donation/payment-sheet").expect(400);
	});

	test("should return invalid request status if accountId is missing", async () => {
		await agent
			.post("/api/v2/donation/payment-sheet")
			.send({
				amount: 5000,
				email: "donor@test.com",
				name: "Test Donor",
				anonymous: false,
			})
			.expect(400);
	});

	test("should return invalid request status if amount is less than 100 cents", async () => {
		await agent
			.post("/api/v2/donation/payment-sheet")
			.send({
				accountId: 1,
				amount: 50,
				email: "donor@test.com",
				name: "Test Donor",
				anonymous: false,
			})
			.expect(400);
	});

	test("should return invalid request status if email is not valid", async () => {
		await agent
			.post("/api/v2/donation/payment-sheet")
			.send({
				accountId: 1,
				amount: 5000,
				email: "not-an-email",
				name: "Test Donor",
				anonymous: false,
			})
			.expect(400);
	});

	test("should return invalid request status if name is empty", async () => {
		await agent
			.post("/api/v2/donation/payment-sheet")
			.send({
				accountId: 1,
				amount: 5000,
				email: "donor@test.com",
				name: "",
				anonymous: false,
			})
			.expect(400);
	});

	test("should return 200 and payment sheet data for valid request", async () => {
		await db.sql("donation.fixtures.create_test_accounts");

		const response = await agent
			.post("/api/v2/donation/payment-sheet")
			.send({
				accountId: 1,
				amount: 5000,
				email: "test@permanent.org",
				name: "Test User",
				anonymous: false,
			})
			.expect(200);

		expect(response.body).toHaveProperty("paymentIntentClientSecret");
		expect(response.body).toHaveProperty("ephemeralKeySecret");
		expect(response.body).toHaveProperty("customerId");
		expect(response.body).toHaveProperty("publishableKey");
		expect(response.body.publishableKey).toBe("pk_test_fake");
	});

	test("should return 404 if account does not exist", async () => {
		await agent
			.post("/api/v2/donation/payment-sheet")
			.send({
				accountId: 9999,
				amount: 5000,
				email: "test@permanent.org",
				name: "Test User",
				anonymous: false,
			})
			.expect(404);
	});

	test("should reuse existing Stripe customer if found", async () => {
		await db.sql("donation.fixtures.create_test_accounts");

		mockStripeCustomersList.mockResolvedValue({
			data: [{ id: "cus_existing", email: "test@permanent.org" }],
		});
		mockStripeCustomersUpdate.mockResolvedValue({
			id: "cus_existing",
			email: "test@permanent.org",
		});

		const response = await agent
			.post("/api/v2/donation/payment-sheet")
			.send({
				accountId: 1,
				amount: 5000,
				email: "test@permanent.org",
				name: "Test User",
				anonymous: false,
			})
			.expect(200);

		expect(mockStripeCustomersUpdate).toHaveBeenCalledWith("cus_existing", {
			name: "Test User",
			metadata: {
				anonymous: "false",
				permAccountId: "1",
			},
		});
		expect(mockStripeCustomersCreate).not.toHaveBeenCalled();
	});
});

describe("/donation/:donationId/claim-status", () => {
	const agent = request(app);

	beforeEach(async () => {
		mockVerifyUserAuthentication(
			"test@permanent.org",
			"13bb917e-7c75-4971-a8ee-b22e82432888",
		);
		await clearDatabase();
	});

	afterEach(async () => {
		await clearDatabase();
		jest.clearAllMocks();
	});

	test("should call verifyUserAuthentication", async () => {
		await agent.get("/api/v2/donation/1/claim-status");
		expect(verifyUserAuthentication).toHaveBeenCalled();
	});

	test("should return 400 for invalid donation ID", async () => {
		await agent.get("/api/v2/donation/invalid/claim-status").expect(400);
	});

	test("should return 404 if donation does not exist", async () => {
		await agent
			.get("/api/v2/donation/9999/claim-status")
			.send({ accountId: 1 })
			.expect(404);
	});

	test("should return 401 if account does not match donation", async () => {
		await db.sql("donation.fixtures.create_test_accounts");
		await db.sql("donation.fixtures.create_test_account_space");
		await db.sql("donation.fixtures.create_test_donations");

		await agent
			.get("/api/v2/donation/1/claim-status")
			.send({ accountId: 2 })
			.expect(401);
	});

	test("should return 409 if donation already claimed", async () => {
		await db.sql("donation.fixtures.create_test_accounts");
		await db.sql("donation.fixtures.create_test_account_space");
		await db.sql("donation.fixtures.create_test_donations");

		await agent
			.get("/api/v2/donation/2/claim-status")
			.send({ accountId: 2 })
			.expect(409);
	});

	test("should return 200 if donation can be claimed", async () => {
		await db.sql("donation.fixtures.create_test_accounts");
		await db.sql("donation.fixtures.create_test_account_space");
		await db.sql("donation.fixtures.create_test_donations");

		await agent
			.get("/api/v2/donation/1/claim-status")
			.send({ accountId: 1 })
			.expect(200);
	});
});

describe("/donation/:donationId/claim", () => {
	const agent = request(app);

	beforeEach(async () => {
		mockVerifyUserAuthentication(
			"test@permanent.org",
			"13bb917e-7c75-4971-a8ee-b22e82432888",
		);
		await clearDatabase();
	});

	afterEach(async () => {
		await clearDatabase();
		jest.clearAllMocks();
	});

	test("should call verifyUserAuthentication", async () => {
		await agent.post("/api/v2/donation/1/claim");
		expect(verifyUserAuthentication).toHaveBeenCalled();
	});

	test("should return 400 for invalid donation ID", async () => {
		await agent.post("/api/v2/donation/invalid/claim").expect(400);
	});

	test("should return 404 if donation does not exist", async () => {
		await agent
			.post("/api/v2/donation/9999/claim")
			.send({ accountId: 1 })
			.expect(404);
	});

	test("should return 401 if account does not match donation", async () => {
		await db.sql("donation.fixtures.create_test_accounts");
		await db.sql("donation.fixtures.create_test_account_space");
		await db.sql("donation.fixtures.create_test_donations");

		await agent
			.post("/api/v2/donation/1/claim")
			.send({ accountId: 2 })
			.expect(401);
	});

	test("should return 409 if donation already claimed", async () => {
		await db.sql("donation.fixtures.create_test_accounts");
		await db.sql("donation.fixtures.create_test_account_space");
		await db.sql("donation.fixtures.create_test_donations");

		await agent
			.post("/api/v2/donation/2/claim")
			.send({ accountId: 2 })
			.expect(409);
	});

	test("should claim donation and credit storage", async () => {
		await db.sql("donation.fixtures.create_test_accounts");
		await db.sql("donation.fixtures.create_test_account_space");
		await db.sql("donation.fixtures.create_test_donations");

		const initialSpace = await getAccountSpace("1");
		expect(initialSpace).toBeDefined();

		await agent
			.post("/api/v2/donation/1/claim")
			.send({ accountId: 1 })
			.expect(200);

		const donation = await getDonation(1);
		expect(donation?.claimed).toBe(true);

		const finalSpace = await getAccountSpace("1");
		expect(finalSpace).toBeDefined();

		const expectedStorageGb = Math.floor(50 / 10);
		const expectedStorageIncrease = expectedStorageGb * GB;
		expect(BigInt(finalSpace!.spaceTotal) - BigInt(initialSpace!.spaceTotal)).toBe(
			BigInt(expectedStorageIncrease),
		);
	});
});

describe("/donation/progress", () => {
	const agent = request(app);

	beforeEach(async () => {
		await clearDatabase();
	});

	afterEach(async () => {
		await clearDatabase();
		jest.clearAllMocks();
	});

	test("should return progress with empty donations", async () => {
		const response = await agent.get("/api/v2/donation/progress").expect(200);

		expect(response.body).toHaveProperty("totalDollars");
		expect(response.body).toHaveProperty("totalDonations");
		expect(response.body).toHaveProperty("totalStorageGb");
		expect(response.body).toHaveProperty("goalDollars");
		expect(response.body).toHaveProperty("campaignName");
	});

	test("should return correct totals with existing donations", async () => {
		await db.sql("donation.fixtures.create_test_accounts");
		await db.sql("donation.fixtures.create_test_account_space");
		await db.sql("donation.fixtures.create_test_donations");
		await db.sql("donation.fixtures.create_test_campaign");

		const response = await agent.get("/api/v2/donation/progress").expect(200);

		expect(response.body.totalDonations).toBe(3);
		expect(response.body.totalDollars).toBe(175);
		expect(response.body.totalStorageGb).toBe(17);
		expect(response.body.goalDollars).toBe(100000);
		expect(response.body.campaignName).toBe("Test Campaign 2026");
	});
});
