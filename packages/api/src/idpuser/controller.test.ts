import request from "supertest";
import createError from "http-errors";
import type { NextFunction } from "express";
import { app } from "../app";
import { db } from "../database";
import { verifyUserAuthentication } from "../middleware";
import { fusionAuthClient } from "../fusionauth";
import type { TwoFactorRequestResponse } from "./models";
import { mockVerifyUserAuthentication } from "../../test/middleware_mocks";

jest.mock("../database");
jest.mock("../middleware");
global.fetch = jest.fn();
jest.mock("../fusionauth", () => ({
	fusionAuthClient: {
		retrieveUserByEmail: jest.fn(),
		sendTwoFactorCodeForEnableDisable: jest.fn(),
		enableTwoFactor: jest.fn(),
		disableTwoFactor: jest.fn(),
	},
}));

const mockRetrieveUserByEmail = (
	methods: Array<{
		id: string;
		method: string;
		email: string;
		mobilePhone: string;
	}>,
	successful: boolean,
	exception?: { code: string; message: string },
): void => {
	jest.mocked(fusionAuthClient.retrieveUserByEmail).mockImplementation(
		jest.fn().mockResolvedValue({
			response: {
				user: {
					twoFactor: {
						methods,
					},
				},
			},
			wasSuccessful: () => successful,
			exception,
		}),
	);
};

const mockSendTwoFactorCodeForEnableDisable = (
	successful: boolean,
	exception?: { code: string; message: string },
): void => {
	jest
		.mocked(fusionAuthClient.sendTwoFactorCodeForEnableDisable)
		.mockImplementation(
			jest.fn().mockResolvedValue({
				wasSuccessful: () => successful,
				exception,
			}),
		);
};

const mockEnableTwoFactor = (
	successful: boolean,
	exception?: { code: string; message: string },
): void => {
	jest.mocked(fusionAuthClient.enableTwoFactor).mockImplementation(
		jest.fn().mockResolvedValue({
			wasSuccessful: () => successful,
			exception,
		}),
	);
};

const mockDisableTwoFactor = (
	successful: boolean,
	exception?: { code: string; message: string },
): void => {
	jest.mocked(fusionAuthClient.disableTwoFactor).mockImplementation(
		jest.fn().mockResolvedValue({
			wasSuccessful: () => successful,
			exception,
		}),
	);
};

describe("/idpuser", () => {
	const agent = request(app);
	beforeEach(async () => {
		mockVerifyUserAuthentication(
			"test@permanent.org",
			"f8bc5749-a50e-4f8e-939b-fc8ae3c34f42",
		);
		mockRetrieveUserByEmail([], true);
	});

	afterEach(async () => {
		jest.restoreAllMocks();
	});

	test("expect a non-404 response", async () => {
		await agent.get("/api/v2/idpuser").expect(200);
	});

	test("should return invalid request status if the value from the auth token is not a valid email", async () => {
		mockVerifyUserAuthentication(
			"not_an_email",
			"f8bc5749-a50e-4f8e-939b-fc8ae3c34f42",
		);
		await agent.get("/api/v2/idpuser").expect(400);
	});

	test("should return invalid request status if there is no email in the auth token", async () => {
		mockVerifyUserAuthentication(
			undefined,
			"f8bc5749-a50e-4f8e-939b-fc8ae3c34f42",
		);
		await agent.get("/api/v2/idpuser").expect(400);
	});

	test("should return invalid request status if the user subject from the auth token is missing", async () => {
		mockVerifyUserAuthentication("test@permanent.org");
		await agent.get("/api/v2/idpuser").expect(400);
	});

	test("should return invalid request status if the user subject from the auth token is not a uuid", async () => {
		mockVerifyUserAuthentication("test@permanent.org", "not_a_uuid");
		await agent.get("/api/v2/idpuser").expect(400);
	});

	test("should return an array", async () => {
		const response = await agent.get("/api/v2/idpuser");
		expect(response.body).toBeInstanceOf(Array);
	});

	test("should return an array with the length equal to 1 if the user has one multi factor method enabled", async () => {
		mockRetrieveUserByEmail(
			[
				{
					id: "1234",
					method: "email",
					email: "test@example.com",
					mobilePhone: "",
				},
			],
			true,
		);

		const response = await agent.get("/api/v2/idpuser");

		const { body: responseBody } = response as {
			body: TwoFactorRequestResponse[];
		};
		expect(responseBody.length).toEqual(1);
	});

	test("should return an array with the length equal to 2 if the user has both multi factor methods enabled", async () => {
		const methods = [
			{ id: "1", method: "email", email: "test1@example.com", mobilePhone: "" },
			{ id: "2", method: "sms", mobilePhone: "1234567890", email: "" },
		];

		mockRetrieveUserByEmail(methods, true);
		const response = await agent.get("/api/v2/idpuser");

		const { body: responseBody } = response as {
			body: TwoFactorRequestResponse[];
		};
		expect(responseBody.length).toEqual(2);
	});

	test("should return a 500 status if getTwoFactorMethods throws an error", async () => {
		mockRetrieveUserByEmail([], false, {
			code: "500",
			message: "test_message",
		});

		const response = await agent.get("/api/v2/idpuser");
		expect(response.status).toBe(500);
	});

	test("should correctly map values when there are two-factor methods", async () => {
		const methods = [
			{ id: "1", method: "email", email: "test1@example.com", mobilePhone: "" },
			{ id: "2", method: "sms", mobilePhone: "1234567890", email: "" },
		];

		mockRetrieveUserByEmail(methods, true);
		const expected = [
			{ methodId: "1", method: "email", value: "test1@example.com" },
			{ methodId: "2", method: "sms", value: "1234567890" },
		];

		const response = await agent.get("/api/v2/idpuser");

		expect(response.body).toEqual(expected);
	});
});

describe("idpuser/send-enable-code", () => {
	const agent = request(app);

	const loadFixtures = async (): Promise<void> => {
		await db.sql("idpuser.fixtures.create_test_accounts");
	};

	const clearDatabase = async (): Promise<void> => {
		await db.query("TRUNCATE account CASCADE;");
	};

	beforeEach(async () => {
		mockVerifyUserAuthentication(
			"test@permanent.org",
			"f8bc5749-a50e-4f8e-939b-fc8ae3c34f42",
		);
		mockSendTwoFactorCodeForEnableDisable(true);

		await loadFixtures();
	});

	afterEach(async () => {
		await clearDatabase();
		jest.restoreAllMocks();
	});

	test("should return a 200 status if the request is successful", async () => {
		await agent
			.post("/api/v2/idpuser/send-enable-code")
			.send({ method: "email", value: "test@permanent.org" })
			.expect(200);
	});

	test("should return a 401 status if the request is not authenticated", async () => {
		jest
			.mocked(verifyUserAuthentication)
			.mockImplementation(async (_, __, next: NextFunction) => {
				next(createError(401, "Unauthorized"));
			});
		await agent.post("/api/v2/idpuser/send-enable-code").expect(401);
	});

	test("should return a 400 status if emailFromAuthToken is missing", async () => {
		mockVerifyUserAuthentication();
		await agent.post("/api/v2/idpuser/send-enable-code").expect(400);
	});

	test("should return a 400 status if emailFromAuthToken is not an email", async () => {
		mockVerifyUserAuthentication("not_an_email");
		await agent.post("/api/v2/idpuser/send-enable-code").expect(400);
	});

	test("should return invalid request status if the user subject from the auth token is missing", async () => {
		mockVerifyUserAuthentication("test@permanent.org");
		await agent.get("/api/v2/idpuser").expect(400);
	});

	test("should return invalid request status if the user subject from the auth token is not a uuid", async () => {
		mockVerifyUserAuthentication("test@permanent.org", "not_a_uuid");
		await agent.get("/api/v2/idpuser").expect(400);
	});

	test("should return a 400 status if method is missing", async () => {
		await agent.post("/api/v2/idpuser/send-enable-code").expect(400);
	});

	test("should return a 400 status if method is invalid", async () => {
		await agent
			.post("/api/v2/idpuser/send-enable-code")
			.send({ method: "invalid", value: "test@permanent.org" })
			.expect(400);
	});

	test("should return a 400 status if value is missing", async () => {
		await agent
			.post("/api/v2/idpuser/send-enable-code")
			.send({ method: "email" })
			.expect(400);
	});

	test("should return a 400 status if method is email and value is not an email", async () => {
		await agent
			.post("/api/v2/idpuser/send-enable-code")
			.send({ method: "email", value: "not_an_email" })
			.expect(400);
	});

	test("should call the fusionauth client to send the code", async () => {
		await agent
			.post("/api/v2/idpuser/send-enable-code")
			.send({ method: "email", value: "test@permanent.org" })
			.expect(200);
		expect(
			fusionAuthClient.sendTwoFactorCodeForEnableDisable,
		).toHaveBeenCalled();
	});

	test("should return a 404 status if the user doesn't exist in the database", async () => {
		await db.query("TRUNCATE account CASCADE;");
		await agent
			.post("/api/v2/idpuser/send-enable-code")
			.send({ method: "email", value: "test@permanent.org" })
			.expect(404);
	});

	test("should return a 500 status if the fusionauth client throws an error", async () => {
		mockSendTwoFactorCodeForEnableDisable(false, {
			code: "500",
			message: "test_message",
		});
		await agent
			.post("/api/v2/idpuser/send-enable-code")
			.send({ method: "email", value: "test@permanent.org" })
			.expect(500);
	});

	test("should return a 500 status if the database call fails", async () => {
		jest.spyOn(db, "sql").mockRejectedValue(new Error("test_error"));
		await agent
			.post("/api/v2/idpuser/send-enable-code")
			.send({ method: "email", value: "test@permanent.org" })
			.expect(500);
	});
});

describe("POST /idpuser/enable-two-factor", () => {
	const agent = request(app);

	const loadFixtures = async (): Promise<void> => {
		await db.sql("idpuser.fixtures.create_test_accounts");
	};

	const clearDatabase = async (): Promise<void> => {
		await db.query("TRUNCATE account CASCADE;");
	};

	beforeEach(async () => {
		await clearDatabase();
		jest.clearAllMocks();
		jest.resetAllMocks();
		await loadFixtures();
		mockVerifyUserAuthentication(
			"test@permanent.org",
			"f8bc5749-a50e-4f8e-939b-fc8ae3c34f42",
		);
	});

	afterEach(async () => {
		await clearDatabase();
		jest.restoreAllMocks();
	});

	test("should return a 401 status if the caller is not authenticated", async () => {
		jest
			.mocked(verifyUserAuthentication)
			.mockImplementation((_req, _res, _next: NextFunction) => {
				throw new createError.Unauthorized("Invalid token");
			});
		await agent
			.post("/api/v2/idpuser/enable-two-factor")
			.send({ code: "test_code", method: "sms", value: "000-000-0000" })
			.expect(401);
	});

	test("should return a 400 status if the email from the auth token is missing", async () => {
		mockVerifyUserAuthentication();
		await agent
			.post("/api/v2/idpuser/enable-two-factor")
			.send({ code: "test_code", method: "sms", value: "000-000-0000" })
			.expect(400);
	});

	test("should return a 400 status if the email from the auth token is not an email", async () => {
		mockVerifyUserAuthentication("not_an_email");
		await agent
			.post("/api/v2/idpuser/enable-two-factor")
			.send({ code: "test_code", method: "sms", value: "000-000-0000" })
			.expect(400);
	});

	test("should return invalid request status if the user subject from the auth token is missing", async () => {
		mockVerifyUserAuthentication("test@permanent.org");
		await agent.get("/api/v2/idpuser").expect(400);
	});

	test("should return invalid request status if the user subject from the auth token is not a uuid", async () => {
		mockVerifyUserAuthentication("test@permanent.org", "not_a_uuid");
		await agent.get("/api/v2/idpuser").expect(400);
	});

	test("should return a 400 status if the code is missing", async () => {
		await agent
			.post("/api/v2/idpuser/enable-two-factor")
			.send({ method: "sms", value: "000-000-0000" })
			.expect(400);
	});

	test("should return a 400 status if the method is missing", async () => {
		await agent
			.post("/api/v2/idpuser/enable-two-factor")
			.send({ code: "test_code", value: "000-000-0000" })
			.expect(400);
	});

	test("should return a 400 status if the method is invalid", async () => {
		await agent
			.post("/api/v2/idpuser/enable-two-factor")
			.send({ code: "test_code", method: "invalid", value: "000-000-0000" })
			.expect(400);
	});

	test("should return a 400 status if value is missing", async () => {
		await agent
			.post("/api/v2/idpuser/enable-two-factor")
			.send({ code: "test_code", method: "email" })
			.expect(400);
	});

	test("should return a 400 status if the method is email and value is not an email", async () => {
		await agent
			.post("/api/v2/idpuser/enable-two-factor")
			.send({ code: "test_code", method: "email", value: "not_an_email" })
			.expect(400);
	});

	test("should call fusionAuth to create the MFA method", async () => {
		mockEnableTwoFactor(true);
		await agent
			.post("/api/v2/idpuser/enable-two-factor")
			.send({
				code: "test_code",
				method: "email",
				value: "test@permanent.org",
			})
			.expect(200);
		expect(fusionAuthClient.enableTwoFactor).toHaveBeenCalled();
	});

	test("should return status 404 if the user isn't in the database", async () => {
		await db.query("TRUNCATE account CASCADE;");
		await agent
			.post("/api/v2/idpuser/enable-two-factor")
			.send({
				code: "test_code",
				method: "email",
				value: "test@permanent.org",
			})
			.expect(404);
	});

	test("should return status 500 if the fusionAuth call fails", async () => {
		mockEnableTwoFactor(false, { code: "500", message: "test_message" });
		await agent
			.post("/api/v2/idpuser/enable-two-factor")
			.send({ code: "test_code", method: "sms", value: "000-000-0000" })
			.expect(500);
	});

	test("should return status 500 if the database call fails", async () => {
		jest.spyOn(db, "sql").mockRejectedValueOnce(new Error("Database error"));
		await agent
			.post("/api/v2/idpuser/enable-two-factor")
			.send({
				code: "test_code",
				method: "email",
				value: "test@permanent.org",
			})
			.expect(500);
	});
});

describe("idpuser/send-disable-code", () => {
	const agent = request(app);

	const loadFixtures = async (): Promise<void> => {
		await db.sql("idpuser.fixtures.create_test_accounts");
	};

	const clearDatabase = async (): Promise<void> => {
		await db.query("TRUNCATE account CASCADE;");
	};

	beforeEach(async () => {
		mockVerifyUserAuthentication(
			"test@permanent.org",
			"f8bc5749-a50e-4f8e-939b-fc8ae3c34f42",
		);
		mockSendTwoFactorCodeForEnableDisable(true);
		await loadFixtures();
	});

	afterEach(async () => {
		await clearDatabase();
		jest.restoreAllMocks();
	});

	test("should return a 200 status if the request is successful", async () => {
		await agent
			.post("/api/v2/idpuser/send-disable-code")
			.send({ methodId: "test_method_id" })
			.expect(200);
	});

	test("should return a 401 status if the request not authenticated", async () => {
		jest
			.mocked(verifyUserAuthentication)
			.mockImplementation(async (_, __, next: NextFunction) => {
				next(createError(401, "Unauthorized"));
			});
		await agent
			.post("/api/v2/idpuser/send-disable-code")
			.send({ methodId: "test_method_id" })
			.expect(401);
	});

	test("should return a 400 status if emailFromAuthToken is missing", async () => {
		mockVerifyUserAuthentication();
		await agent
			.post("/api/v2/idpuser/send-disable-code")
			.send({ methodId: "test_method_id" })
			.expect(400);
	});

	test("should return a 400 status if emailFromAuthToken is not an email", async () => {
		mockVerifyUserAuthentication("not_an_email");
		await agent
			.post("/api/v2/idpuser/send-disable-code")
			.send({ methodId: "test_method_id" })
			.expect(400);
	});

	test("should return invalid request status if the user subject from the auth token is missing", async () => {
		mockVerifyUserAuthentication("test@permanent.org");
		await agent.get("/api/v2/idpuser").expect(400);
	});

	test("should return invalid request status if the user subject from the auth token is not a uuid", async () => {
		mockVerifyUserAuthentication("test@permanent.org", "not_a_uuid");
		await agent.get("/api/v2/idpuser").expect(400);
	});

	test("should return a 400 status if methodId is missing", async () => {
		await agent.post("/api/v2/idpuser/send-disable-code").expect(400);
	});

	test("should call the fusionauth client to send the code", async () => {
		await agent
			.post("/api/v2/idpuser/send-disable-code")
			.send({ methodId: "test_method_id" })
			.expect(200);
		expect(
			fusionAuthClient.sendTwoFactorCodeForEnableDisable,
		).toHaveBeenCalled();
	});

	test("should return a 404 status if the user doesn't exist in the database", async () => {
		await db.query("TRUNCATE account CASCADE;");
		await agent
			.post("/api/v2/idpuser/send-disable-code")
			.send({ methodId: "test_method_id" })
			.expect(404);
	});

	test("should return a 500 status if the fusionauth client throws an error", async () => {
		mockSendTwoFactorCodeForEnableDisable(false, {
			code: "500",
			message: "test_message",
		});
		await agent
			.post("/api/v2/idpuser/send-disable-code")
			.send({ methodId: "test_method_id" })
			.expect(500);
	});

	test("should return a 500 status if the database call fails", async () => {
		jest.spyOn(db, "sql").mockRejectedValue(new Error("test_error"));
		await agent
			.post("/api/v2/idpuser/send-disable-code")
			.send({ methodId: "test_method_id" })
			.expect(500);
	});
});

describe("/idpuser/disable-two-factor", () => {
	const agent = request(app);

	const loadFixtures = async (): Promise<void> => {
		await db.sql("idpuser.fixtures.create_test_accounts");
	};

	const clearDatabase = async (): Promise<void> => {
		await db.query("TRUNCATE account CASCADE;");
	};

	beforeEach(async () => {
		mockVerifyUserAuthentication(
			"test@permanent.org",
			"f8bc5749-a50e-4f8e-939b-fc8ae3c34f42",
		);
		mockDisableTwoFactor(true);
		await loadFixtures();
	});

	afterEach(async () => {
		await clearDatabase();
		jest.restoreAllMocks();
	});

	test("should return 200 status if the request is successful", async () => {
		await agent
			.post("/api/v2/idpuser/disable-two-factor")
			.send({ methodId: "test_method_id", code: "test_code" })
			.expect(200);
	});

	test("should return 401 status if the request is not authenticated", async () => {
		jest
			.mocked(verifyUserAuthentication)
			.mockImplementation(async (_, __, next: NextFunction) => {
				next(createError.Unauthorized("Invalid token"));
			});
		await agent
			.post("/api/v2/idpuser/disable-two-factor")
			.send({ methodId: "test_method_id", code: "test_code" })
			.expect(401);
	});

	test("should return 400 status if emailFromAuthToken is missing", async () => {
		mockVerifyUserAuthentication();
		await agent
			.post("/api/v2/idpuser/disable-two-factor")
			.send({ methodId: "test_method_id", code: "test_code" })
			.expect(400);
	});

	test("should return 400 status if emailFromAuthToken is not an email", async () => {
		mockVerifyUserAuthentication("not_an_email");
		await agent
			.post("/api/v2/idpuser/disable-two-factor")
			.send({ methodId: "test_method_id", code: "test_code" })
			.expect(400);
	});

	test("should return invalid request status if the user subject from the auth token is missing", async () => {
		mockVerifyUserAuthentication("test@permanent.org");
		await agent.get("/api/v2/idpuser").expect(400);
	});

	test("should return invalid request status if the user subject from the auth token is not a uuid", async () => {
		mockVerifyUserAuthentication("test@permanent.org", "not_a_uuid");
		await agent.get("/api/v2/idpuser").expect(400);
	});

	test("should return 400 status if methodId is missing", async () => {
		await agent
			.post("/api/v2/idpuser/disable-two-factor")
			.send({ code: "test_code" })
			.expect(400);
	});

	test("should return 400 status if code is missing", async () => {
		await agent
			.post("/api/v2/idpuser/disable-two-factor")
			.send({ methodId: "test_method_id" })
			.expect(400);
	});

	test("should call the fusionauth client to disable the two factor method", async () => {
		await agent
			.post("/api/v2/idpuser/disable-two-factor")
			.send({ methodId: "test_method_id", code: "test_code" })
			.expect(200);
		expect(fusionAuthClient.disableTwoFactor).toHaveBeenCalled();
	});

	test("should return status 404 if the user isn't in the database", async () => {
		await db.query("TRUNCATE account CASCADE;");
		await agent
			.post("/api/v2/idpuser/disable-two-factor")
			.send({ methodId: "test_method_id", code: "test_code" })
			.expect(404);
	});

	test("should return status 500 if the fusionAuth call fails", async () => {
		mockDisableTwoFactor(false, { code: "500", message: "test_message" });
		await agent
			.post("/api/v2/idpuser/disable-two-factor")
			.send({ methodId: "test_method_id", code: "test_code" })
			.expect(500);
	});

	test("should return status 500 if the database call fails", async () => {
		jest.spyOn(db, "sql").mockRejectedValueOnce(new Error("Database error"));
		await agent
			.post("/api/v2/idpuser/disable-two-factor")
			.send({ methodId: "test_method_id", code: "test_code" })
			.expect(500);
	});
});
