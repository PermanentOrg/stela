import {
	validateUserAuthentication,
	validateAdminAuthentication,
	validateUserOrAdminAuthentication,
	validateOptionalAuthentication,
	validateClientIp,
	validatePaginationParameters,
} from "./shared.js";
import { describe, expect, test } from "vitest";

const testEmail = "test@permanent.org";
const testSubject = "b2a6787c-f255-465a-8eb0-1583004d4a4f";
const testShareToken = "cfa6f6a2-7005-42d6-a6b1-1ec4645a5227";

describe("validateUserAuthentication", () => {
	const validAuth = { kind: "user", email: testEmail, subject: testSubject };

	test("should find no errors in valid user authentication", () => {
		expect(() => {
			validateUserAuthentication(validAuth);
		}).not.toThrow();
	});
	test("should allow a share token", () => {
		expect(() => {
			validateUserAuthentication({ ...validAuth, shareToken: testShareToken });
		}).not.toThrow();
	});
	test("should raise an error if authentication is missing", () => {
		expect(() => {
			validateUserAuthentication(undefined);
		}).toThrow('"value" is required');
	});
	test("should raise an error if kind is admin", () => {
		expect(() => {
			validateUserAuthentication({ ...validAuth, kind: "admin" });
		}).toThrow('"kind" must be [user]');
	});
	test("should raise an error if email is missing", () => {
		expect(() => {
			validateUserAuthentication({ kind: "user", subject: testSubject });
		}).toThrow('"email" is required');
	});
	test("should raise an error if email is the wrong type", () => {
		expect(() => {
			validateUserAuthentication({ ...validAuth, email: 1 });
		}).toThrow('"email" must be a string');
	});
	test("should raise an error if email is an invalid value", () => {
		expect(() => {
			validateUserAuthentication({ ...validAuth, email: "not_an_email" });
		}).toThrow('"email" must be a valid email');
	});
	test("should raise an error if subject is missing", () => {
		expect(() => {
			validateUserAuthentication({ kind: "user", email: testEmail });
		}).toThrow('"subject" is required');
	});
	test("should raise an error if subject is the wrong type", () => {
		expect(() => {
			validateUserAuthentication({ ...validAuth, subject: 1 });
		}).toThrow('"subject" must be a string');
	});
	test("should raise an error if subject is not a uuid", () => {
		expect(() => {
			validateUserAuthentication({ ...validAuth, subject: "not_a_uuid" });
		}).toThrow('"subject" must be a valid GUID');
	});
	test("should raise an error if there are unexpected fields", () => {
		expect(() => {
			validateUserAuthentication({ ...validAuth, admin: true });
		}).toThrow('"admin" is not allowed');
	});
});

describe("validateAdminAuthentication", () => {
	const validAuth = { kind: "admin", email: testEmail, subject: testSubject };

	test("should find no errors in valid admin authentication", () => {
		expect(() => {
			validateAdminAuthentication(validAuth);
		}).not.toThrow();
	});
	test("should raise an error if authentication is missing", () => {
		expect(() => {
			validateAdminAuthentication(undefined);
		}).toThrow('"value" is required');
	});
	test("should raise an error if kind is user", () => {
		expect(() => {
			validateAdminAuthentication({ ...validAuth, kind: "user" });
		}).toThrow('"kind" must be [admin]');
	});
	test("should raise an error if email is missing", () => {
		expect(() => {
			validateAdminAuthentication({ kind: "admin", subject: testSubject });
		}).toThrow('"email" is required');
	});
	test("should raise an error if email is an invalid value", () => {
		expect(() => {
			validateAdminAuthentication({ ...validAuth, email: "not_an_email" });
		}).toThrow('"email" must be a valid email');
	});
	test("should raise an error if subject is missing", () => {
		expect(() => {
			validateAdminAuthentication({ kind: "admin", email: testEmail });
		}).toThrow('"subject" is required');
	});
	test("should raise an error if subject is not a uuid", () => {
		expect(() => {
			validateAdminAuthentication({ ...validAuth, subject: "not_a_uuid" });
		}).toThrow('"subject" must be a valid GUID');
	});
});

describe("validateUserOrAdminAuthentication", () => {
	test("should find no errors in valid user authentication", () => {
		expect(() => {
			validateUserOrAdminAuthentication({
				kind: "user",
				email: testEmail,
				subject: testSubject,
			});
		}).not.toThrow();
	});
	test("should find no errors in valid admin authentication", () => {
		expect(() => {
			validateUserOrAdminAuthentication({
				kind: "admin",
				email: testEmail,
				subject: testSubject,
			});
		}).not.toThrow();
	});
	test("should raise an error if authentication is missing", () => {
		expect(() => {
			validateUserOrAdminAuthentication(undefined);
		}).toThrow();
	});
	test("should raise an error if kind is missing", () => {
		expect(() => {
			validateUserOrAdminAuthentication({
				email: testEmail,
				subject: testSubject,
			});
		}).toThrow();
	});
	test("should raise an error if kind is invalid", () => {
		expect(() => {
			validateUserOrAdminAuthentication({
				kind: "superuser",
				email: testEmail,
				subject: testSubject,
			});
		}).toThrow();
	});
	test("should raise an error if email is missing", () => {
		expect(() => {
			validateUserOrAdminAuthentication({ kind: "user", subject: testSubject });
		}).toThrow();
	});
	test("should raise an error if subject is missing", () => {
		expect(() => {
			validateUserOrAdminAuthentication({ kind: "admin", email: testEmail });
		}).toThrow();
	});
});

describe("validateOptionalAuthentication", () => {
	test("should find no errors with an email and share token", () => {
		expect(() => {
			validateOptionalAuthentication({
				kind: "user",
				email: testEmail,
				shareToken: testShareToken,
			});
		}).not.toThrow();
	});
	test("should find no errors with an empty object", () => {
		expect(() => {
			validateOptionalAuthentication({});
		}).not.toThrow();
	});
	test("should find no errors if authentication is missing", () => {
		expect(() => {
			validateOptionalAuthentication(undefined);
		}).not.toThrow();
	});
	test("should raise an error if email is invalid", () => {
		expect(() => {
			validateOptionalAuthentication({ kind: "user", email: "not_an_email" });
		}).toThrow('"email" must be a valid email');
	});
	test("should raise an error if share token is the wrong type", () => {
		expect(() => {
			validateOptionalAuthentication({ shareToken: 1 });
		}).toThrow('"shareToken" must be a string');
	});
	test("should raise an error if kind is admin", () => {
		expect(() => {
			validateOptionalAuthentication({ kind: "admin", email: testEmail });
		}).toThrow('"kind" must be [user]');
	});
});

describe("validateClientIp", () => {
	test("should find no errors in a valid IPv4 address", () => {
		expect(() => {
			validateClientIp("127.0.0.1");
		}).not.toThrow();
	});
	test("should find no errors in a valid IPv6 address", () => {
		expect(() => {
			validateClientIp("::1");
		}).not.toThrow();
	});
	test("should raise an error if the IP is missing", () => {
		expect(() => {
			validateClientIp(undefined);
		}).toThrow('"value" is required');
	});
	test("should raise an error if the IP is invalid", () => {
		expect(() => {
			validateClientIp("not_an_ip");
		}).toThrow();
	});
});

describe("validatePaginationParameters", () => {
	test("should find no errors in valid parameter set", () => {
		let error = null;
		try {
			validatePaginationParameters({
				cursor: "1",
				pageSize: 100,
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).toBeNull();
		}
	});

	test("should not error if cursor is missing", () => {
		let error = null;
		try {
			validatePaginationParameters({
				pageSize: 100,
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).toBeNull();
		}
	});

	test("should error if cursor is not a string", () => {
		let error = null;
		try {
			validatePaginationParameters({
				cursor: 1,
				pageSize: 100,
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});

	test("should error if pageSize is missing", () => {
		let error = null;
		try {
			validatePaginationParameters({
				cursor: "1",
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});

	test("should error if pageSize is not a number", () => {
		let error = null;
		try {
			validatePaginationParameters({
				cursor: "1",
				pageSize: "not_a_number",
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});

	test("should error if pageSize is not an integer", () => {
		let error = null;
		try {
			validatePaginationParameters({
				cursor: "1",
				pageSize: 2.5,
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});

	test("should error if pageSize is less than one", () => {
		let error = null;
		try {
			validatePaginationParameters({
				cursor: "1",
				pageSize: 0,
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
});
