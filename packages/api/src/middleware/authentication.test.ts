import { createRequest, createResponse } from "node-mocks-http";
import {
	extractUserEmailFromAuthToken,
	verifyUserAuthentication,
	verifyAdminAuthentication,
	verifyUserOrAdminAuthentication,
	extractUserIsAdminFromAuthToken,
	extractShareTokenFromHeaders,
} from "./authentication";
import { fusionAuthClient } from "../fusionauth";
import {
	validateBodyFromAuthentication,
	fieldsFromUserOrAdminAuthentication,
} from "../validators";

jest.mock("../fusionauth");

const testEmail = "test@permanent.org";
const testSubject = "b2a6787c-f255-465a-8eb0-1583004d4a4f";

const successfulIntrospectionResponse = {
	statusCode: 200,
	response: {
		active: true as const,
		email: testEmail,
		sub: testSubject,
		applicationId: "de3aba1d-314a-4aad-8ccd-192b78979678",
		aud: "038b2813-afe9-4c0b-b175-6dfe1c8863cc",
		auth_time: 1709591001,
		authenticationType: "PASSWORD",
		email_verified: true,
		exp: 1709594601,
		iat: 1709591001,
		iss: "https://permanent-fake-test-issuer.io/",
		jti: "38d2e43e-78f6-41c8-a321-5e9094c6d9d0",
		roles: [],
		tid: "93dd3515-b384-44d7-81bb-2cbf85e01c13",
	},
	exception: {},
	wasSuccessful: (): boolean => true,
};

const failedIntrospectionResponse = {
	statusCode: 200,
	wasSuccessful: (): boolean => false,
	response: {
		active: false as const,
	},
	exception: {
		name: "Out of Cheese",
		message: "Out of Cheese Error. Redo From Start",
	},
};

const expiredTokenIntrospectionResponse = {
	statusCode: 200,
	response: {
		active: false as const,
	},
	exception: {},
	wasSuccessful: (): boolean => true,
};

const missingEmailIntrospectionResponse = {
	statusCode: 200,
	response: {
		active: true as const,
		email: "",
		sub: testSubject,
		applicationId: "de3aba1d-314a-4aad-8ccd-192b78979678",
		aud: "038b2813-afe9-4c0b-b175-6dfe1c8863cc",
		auth_time: 1709591001,
		authenticationType: "PASSWORD",
		email_verified: true,
		exp: 1709594601,
		iat: 1709591001,
		iss: "https://permanent-fake-test-issuer.io/",
		jti: "38d2e43e-78f6-41c8-a321-5e9094c6d9d0",
		roles: [],
		tid: "93dd3515-b384-44d7-81bb-2cbf85e01c13",
	},
	exception: {},
	wasSuccessful: (): boolean => true,
};

describe("verifyUserAuthentication", () => {
	test("should add the email to the request body if the token is valid", async () => {
		const request = createRequest({
			headers: { Authorization: "Bearer test" },
		});
		jest
			.spyOn(fusionAuthClient, "introspectAccessToken")
			.mockImplementation(async () => successfulIntrospectionResponse);
		await verifyUserAuthentication(request, createResponse(), jest.fn());

		const {
			body: { emailFromAuthToken },
		} = request as { body: { emailFromAuthToken: string } };
		expect(emailFromAuthToken).toBe(testEmail);
	});

	test("should add the subject to the request body if the token is valid", async () => {
		const request = createRequest({
			headers: { Authorization: "Bearer test" },
		});
		jest
			.spyOn(fusionAuthClient, "introspectAccessToken")
			.mockImplementation(async () => successfulIntrospectionResponse);
		await verifyUserAuthentication(request, createResponse(), jest.fn());

		const {
			body: { userSubjectFromAuthToken },
		} = request as { body: { userSubjectFromAuthToken: string } };
		expect(userSubjectFromAuthToken).toBe(testSubject);
	});

	test("should produce a request body that passes auth-only request validation", async () => {
		const request = createRequest({
			headers: { Authorization: "Bearer test" },
		});
		jest
			.spyOn(fusionAuthClient, "introspectAccessToken")
			.mockImplementation(async () => successfulIntrospectionResponse);
		await verifyUserAuthentication(request, createResponse(), jest.fn());

		expect(() => {
			validateBodyFromAuthentication(request.body);
		}).not.toThrow();
	});

	test("should throw unauthorized if authorization header is missing", async () => {
		const request = createRequest();
		jest
			.spyOn(fusionAuthClient, "introspectAccessToken")
			.mockImplementation(async () => successfulIntrospectionResponse);
		await verifyUserAuthentication(
			request,
			createResponse(),
			(err: unknown) => {
				expect(typeof err).toBe("object");
				expect(err).not.toBeNull();
				if (typeof err === "object" && err !== null) {
					expect("statusCode" in err).toBe(true);
					if ("statusCode" in err) {
						expect(err.statusCode).toBe(401);
					}
				}
			},
		);
	});

	test("should throw unauthorized if authorization header has the wrong number of words", async () => {
		const request = createRequest({ headers: { Authorization: "test" } });
		jest
			.spyOn(fusionAuthClient, "introspectAccessToken")
			.mockImplementation(async () => successfulIntrospectionResponse);
		await verifyUserAuthentication(
			request,
			createResponse(),
			(err: unknown) => {
				expect(typeof err).toBe("object");
				expect(err).not.toBeNull();
				if (typeof err === "object" && err !== null) {
					expect("statusCode" in err).toBe(true);
					if ("statusCode" in err) {
						expect(err.statusCode).toBe(401);
					}
				}
			},
		);
	});

	test("should throw unauthorized if authorization header doesn't start with Bearer", async () => {
		const request = createRequest({ headers: { Authorization: "test test" } });
		jest
			.spyOn(fusionAuthClient, "introspectAccessToken")
			.mockImplementation(async () => successfulIntrospectionResponse);
		await verifyUserAuthentication(
			request,
			createResponse(),
			(err: unknown) => {
				expect(typeof err).toBe("object");
				expect(err).not.toBeNull();
				if (typeof err === "object" && err !== null) {
					expect("statusCode" in err).toBe(true);
					if ("statusCode" in err) {
						expect(err.statusCode).toBe(401);
					}
				}
			},
		);
	});

	test("should throw unauthorized if token validation call fails", async () => {
		const request = createRequest({
			headers: { Authorization: "Bearer test" },
		});
		jest
			.spyOn(fusionAuthClient, "introspectAccessToken")
			.mockImplementation(async () => failedIntrospectionResponse);
		await verifyUserAuthentication(
			request,
			createResponse(),
			(err: unknown) => {
				expect(typeof err).toBe("object");
				expect(err).not.toBeNull();
				if (typeof err === "object" && err !== null) {
					expect("statusCode" in err).toBe(true);
					if ("statusCode" in err) {
						expect(err.statusCode).toBe(401);
					}
				}
			},
		);
	});

	test("should throw unauthorized if token is expired", async () => {
		const request = createRequest({
			headers: { Authorization: "Bearer test" },
		});
		jest
			.spyOn(fusionAuthClient, "introspectAccessToken")
			.mockImplementation(async () => expiredTokenIntrospectionResponse);
		await verifyUserAuthentication(
			request,
			createResponse(),
			(err: unknown) => {
				expect(typeof err).toBe("object");
				expect(err).not.toBeNull();
				if (typeof err === "object" && err !== null) {
					expect("statusCode" in err).toBe(true);
					if ("statusCode" in err) {
						expect(err.statusCode).toBe(401);
					}
				}
			},
		);
	});

	test("should throw unauthorized if token doesn't include an email", async () => {
		const request = createRequest({
			headers: { Authorization: "Bearer test" },
		});
		jest
			.spyOn(fusionAuthClient, "introspectAccessToken")
			.mockImplementation(async () => missingEmailIntrospectionResponse);
		await verifyUserAuthentication(
			request,
			createResponse(),
			(err: unknown) => {
				expect(typeof err).toBe("object");
				expect(err).not.toBeNull();
				if (typeof err === "object" && err !== null) {
					expect("statusCode" in err).toBe(true);
					if ("statusCode" in err) {
						expect(err.statusCode).toBe(401);
					}
				}
			},
		);
	});
});

describe("verifyAdminAuthentication", () => {
	test("should add the email to the request body if the token is valid", async () => {
		const request = createRequest({
			headers: { Authorization: "Bearer test" },
		});
		jest
			.spyOn(fusionAuthClient, "introspectAccessToken")
			.mockImplementation(async () => successfulIntrospectionResponse);
		await verifyAdminAuthentication(request, createResponse(), jest.fn());

		const {
			body: { emailFromAuthToken },
		} = request as { body: { emailFromAuthToken: string } };
		expect(emailFromAuthToken).toBe(testEmail);
	});

	test("should add the admin subject to the request body if the token is valid", async () => {
		const request = createRequest({
			headers: { Authorization: "Bearer test" },
		});
		jest
			.spyOn(fusionAuthClient, "introspectAccessToken")
			.mockImplementation(async () => successfulIntrospectionResponse);
		await verifyAdminAuthentication(request, createResponse(), jest.fn());

		const {
			body: { adminSubjectFromAuthToken },
		} = request as { body: { adminSubjectFromAuthToken: string } };
		expect(adminSubjectFromAuthToken).toBe(testSubject);
	});

	test("should throw unauthorized if authorization header is missing", async () => {
		const request = createRequest();
		jest
			.spyOn(fusionAuthClient, "introspectAccessToken")
			.mockImplementation(async () => successfulIntrospectionResponse);
		await verifyAdminAuthentication(
			request,
			createResponse(),
			(err: unknown) => {
				expect(typeof err).toBe("object");
				expect(err).not.toBeNull();
				if (typeof err === "object" && err !== null) {
					expect("statusCode" in err).toBe(true);
					if ("statusCode" in err) {
						expect(err.statusCode).toBe(401);
					}
				}
			},
		);
	});
});

describe("verifyUserOrAdminAuthentication", () => {
	test("should add subject and email to the request body if user token is valid", async () => {
		const request = createRequest({
			headers: { Authorization: "Bearer test" },
		});
		jest
			.spyOn(fusionAuthClient, "introspectAccessToken")
			.mockImplementation(async () => successfulIntrospectionResponse);

		await verifyUserOrAdminAuthentication(request, createResponse(), jest.fn());
		const {
			body: { userSubjectFromAuthToken, userEmailFromAuthToken },
		} = request as {
			body: {
				userSubjectFromAuthToken: string;
				userEmailFromAuthToken: string;
			};
		};
		expect(userSubjectFromAuthToken).toBe(testSubject);
		expect(userEmailFromAuthToken).toBe(testEmail);
		expect(
			fieldsFromUserOrAdminAuthentication.validate(request.body).error,
		).toBeFalsy();
	});

	test("should add subject and email to the request body if admin token is valid", async () => {
		const request = createRequest({
			headers: { Authorization: "Bearer test" },
		});
		jest
			.spyOn(fusionAuthClient, "introspectAccessToken")
			.mockImplementationOnce(async () => expiredTokenIntrospectionResponse)
			.mockImplementationOnce(async () => successfulIntrospectionResponse);

		await verifyUserOrAdminAuthentication(request, createResponse(), jest.fn());
		const {
			body: { adminSubjectFromAuthToken, adminEmailFromAuthToken },
		} = request as {
			body: {
				adminSubjectFromAuthToken: string;
				adminEmailFromAuthToken: string;
			};
		};
		expect(adminSubjectFromAuthToken).toBe(testSubject);
		expect(adminEmailFromAuthToken).toBe(testEmail);
		expect(
			fieldsFromUserOrAdminAuthentication.validate(request.body).error,
		).toBeFalsy();
	});

	test("should throw unauthorized if both tokens are invalid", async () => {
		const request = createRequest({
			headers: { Authorization: "Bearer test" },
		});
		jest
			.spyOn(fusionAuthClient, "introspectAccessToken")
			.mockImplementation(async () => failedIntrospectionResponse);

		await verifyUserOrAdminAuthentication(
			request,
			createResponse(),
			(err: unknown) => {
				expect(typeof err).toBe("object");
				expect(err).not.toBeNull();
				if (typeof err === "object" && err !== null) {
					expect("statusCode" in err).toBe(true);
					if ("statusCode" in err) {
						expect(err.statusCode).toBe(401);
					}
				}
			},
		);
	});

	test("should throw unauthorized if both tokens are expired", async () => {
		const request = createRequest({
			headers: { Authorization: "Bearer test" },
		});
		jest
			.spyOn(fusionAuthClient, "introspectAccessToken")
			.mockImplementation(async () => expiredTokenIntrospectionResponse);

		await verifyUserOrAdminAuthentication(
			request,
			createResponse(),
			(err: unknown) => {
				expect(typeof err).toBe("object");
				expect(err).not.toBeNull();
				if (typeof err === "object" && err !== null) {
					expect("statusCode" in err).toBe(true);
					if ("statusCode" in err) {
						expect(err.statusCode).toBe(401);
					}
				}
			},
		);
	});

	test("should throw unauthorized if the authentication header is formatted incorrectly", async () => {
		const request = createRequest({ headers: { Authorization: "test" } });
		jest
			.spyOn(fusionAuthClient, "introspectAccessToken")
			.mockImplementation(async () => expiredTokenIntrospectionResponse);

		await verifyUserOrAdminAuthentication(
			request,
			createResponse(),
			(err: unknown) => {
				expect(typeof err).toBe("object");
				expect(err).not.toBeNull();
				if (typeof err === "object" && err !== null) {
					expect("statusCode" in err).toBe(true);
					if ("statusCode" in err) {
						expect(err.statusCode).toBe(401);
					}
				}
			},
		);
	});
});

describe("extractUserEmailFromAuthToken", () => {
	test("request body will have email if there was an auth token", async () => {
		const request = createRequest({
			headers: { Authorization: "Bearer test" },
		});
		jest
			.spyOn(fusionAuthClient, "introspectAccessToken")
			.mockImplementation(async () => successfulIntrospectionResponse);
		await extractUserEmailFromAuthToken(request, createResponse(), jest.fn());
		const {
			body: { emailFromAuthToken },
		} = request as { body: { emailFromAuthToken: string } };
		expect(emailFromAuthToken).toBe(testEmail);
	});

	test("Request body has undefined emailFromAuthToken if there was no auth token", async () => {
		const request = createRequest({ headers: { Authorization: "" } });
		await extractUserEmailFromAuthToken(request, createResponse(), jest.fn());
		const {
			body: { emailFromAuthToken },
		} = request as { body: { emailFromAuthToken: string } };
		expect(emailFromAuthToken).toBeUndefined();
	});

	test("Request body has undefined emailFromAuthToken if auth token is invalid", async () => {
		const request = createRequest({
			headers: { Authorization: "Bearer test" },
		});
		jest
			.spyOn(fusionAuthClient, "introspectAccessToken")
			.mockImplementation(async () => failedIntrospectionResponse);
		await extractUserEmailFromAuthToken(request, createResponse(), jest.fn());
		const {
			body: { emailFromAuthToken },
		} = request as { body: { emailFromAuthToken: string } };
		expect(emailFromAuthToken).toBeUndefined();
	});

	test("Request body has undefined emailFromAuthToken if auth token is expired", async () => {
		const request = createRequest({
			headers: { Authorization: "Bearer test" },
		});
		jest
			.spyOn(fusionAuthClient, "introspectAccessToken")
			.mockImplementation(async () => expiredTokenIntrospectionResponse);
		await extractUserEmailFromAuthToken(request, createResponse(), jest.fn());
		const {
			body: { emailFromAuthToken },
		} = request as { body: { emailFromAuthToken: string } };
		expect(emailFromAuthToken).toBeUndefined();
	});

	test("Request body has undefined emailFromAuthToken if all introspect calls throw errors", async () => {
		const request = createRequest({
			headers: { Authorization: "Bearer test" },
		});
		jest
			.spyOn(fusionAuthClient, "introspectAccessToken")
			.mockImplementation(async () => {
				throw new Error("unauthenticated");
			});
		await extractUserEmailFromAuthToken(request, createResponse(), jest.fn());
		const {
			body: { emailFromAuthToken },
		} = request as { body: { emailFromAuthToken: string } };
		expect(emailFromAuthToken).toBeUndefined();
	});

	test("Request body will have email if the first auth token is invalid but the second one is valid", async () => {
		const request = createRequest({
			headers: { Authorization: "Bearer test" },
		});
		jest
			.spyOn(fusionAuthClient, "introspectAccessToken")
			.mockImplementationOnce(async () => failedIntrospectionResponse);
		jest
			.spyOn(fusionAuthClient, "introspectAccessToken")
			.mockImplementationOnce(async () => successfulIntrospectionResponse);
		await extractUserEmailFromAuthToken(request, createResponse(), jest.fn());
		const {
			body: { emailFromAuthToken },
		} = request as { body: { emailFromAuthToken: string } };
		expect(emailFromAuthToken).toBe(testEmail);
	});

	test("Request body will have email if token is valid but one introspect call throws", async () => {
		const request = createRequest({
			headers: { Authorization: "Bearer test" },
		});
		jest
			.spyOn(fusionAuthClient, "introspectAccessToken")
			.mockImplementationOnce(async () => {
				throw new Error("unauthenticated");
			});
		jest
			.spyOn(fusionAuthClient, "introspectAccessToken")
			.mockImplementationOnce(async () => successfulIntrospectionResponse);
		await extractUserEmailFromAuthToken(request, createResponse(), jest.fn());
		const {
			body: { emailFromAuthToken },
		} = request as { body: { emailFromAuthToken: string } };
		expect(emailFromAuthToken).toBe(testEmail);
	});

	test("will throw a 429 if it recieves one from an introspect call", async () => {
		const request = createRequest({
			headers: { Authorization: "Bearer test" },
		});
		const testError = Object.assign(new Error("Rate Limit Exceeded"), {
			statusCode: 429,
		});
		jest
			.spyOn(fusionAuthClient, "introspectAccessToken")
			.mockImplementationOnce(async () => {
				throw testError;
			});
		jest
			.spyOn(fusionAuthClient, "introspectAccessToken")
			.mockImplementationOnce(async () => successfulIntrospectionResponse);
		const next = jest.fn();
		await extractUserEmailFromAuthToken(request, createResponse(), next);
		expect(next).toHaveBeenCalledWith(testError);
	});
});

describe("extractUserIsAdminFromAuthToken", () => {
	test("is admin will be true if there is an valid auth token", async () => {
		const request = createRequest({
			headers: { Authorization: "Bearer test" },
		});
		jest
			.spyOn(fusionAuthClient, "introspectAccessToken")
			.mockImplementationOnce(async () => successfulIntrospectionResponse);
		await extractUserIsAdminFromAuthToken(request, createResponse(), jest.fn());
		const {
			body: { admin },
		} = request as { body: { admin: boolean } };
		expect(admin).toBe(true);
	});

	test("is admin will be false if there is no auth token", async () => {
		const request = createRequest({ headers: { Authorization: "" } });
		await extractUserIsAdminFromAuthToken(request, createResponse(), jest.fn());
		const {
			body: { admin },
		} = request as { body: { admin: boolean } };
		expect(admin).toBe(false);
	});

	test("is admin will be false if there is an invalid auth token", async () => {
		const request = createRequest({
			headers: { Authorization: "Bearer test" },
		});
		jest
			.spyOn(fusionAuthClient, "introspectAccessToken")
			.mockImplementationOnce(async () => failedIntrospectionResponse);
		await extractUserIsAdminFromAuthToken(request, createResponse(), jest.fn());
		const {
			body: { admin },
		} = request as { body: { admin: boolean } };
		expect(admin).toBe(false);
	});
});

describe("extractUserIsAdminFromAuthToken", () => {
	test("is admin will be true if there is an valid auth token", async () => {
		const request = createRequest({
			headers: { Authorization: "Bearer test" },
		});
		jest
			.spyOn(fusionAuthClient, "introspectAccessToken")
			.mockImplementationOnce(async () => successfulIntrospectionResponse);
		await extractUserIsAdminFromAuthToken(request, createResponse(), jest.fn());
		const {
			body: { admin },
		} = request as { body: { admin: boolean } };
		expect(admin).toBe(true);
	});

	test("is admin will be false if there is no auth token", async () => {
		const request = createRequest({ headers: { Authorization: "" } });
		await extractUserIsAdminFromAuthToken(request, createResponse(), jest.fn());
		const {
			body: { admin },
		} = request as { body: { admin: boolean } };
		expect(admin).toBe(false);
	});

	test("is admin will be false if there is an invalid auth token", async () => {
		const request = createRequest({
			headers: { Authorization: "Bearer test" },
		});
		jest
			.spyOn(fusionAuthClient, "introspectAccessToken")
			.mockImplementationOnce(async () => failedIntrospectionResponse);
		await extractUserIsAdminFromAuthToken(request, createResponse(), jest.fn());
		const {
			body: { admin },
		} = request as { body: { admin: boolean } };
		expect(admin).toBe(false);
	});
});

describe("extractShareTokenFromHeaders", () => {
	test("should add the share token to the request body if the token present", async () => {
		const testShareToken = "cfa6f6a2-7005-42d6-a6b1-1ec4645a5227";
		const request = createRequest({
			headers: { "X-Permanent-Share-Token": testShareToken },
		});
		extractShareTokenFromHeaders(request, createResponse(), jest.fn());
		const {
			body: { shareToken },
		} = request as { body: { shareToken: string } };
		expect(shareToken).toEqual(testShareToken);
	});
});
