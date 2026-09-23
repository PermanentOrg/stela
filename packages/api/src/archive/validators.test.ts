import {
	validateArchiveIdFromParams,
	validateCreateArchiveRequest,
} from "./validators.js";
import { describe, expect, test } from "vitest";

describe("validateArchiveIdFromParams", () => {
	test("should find no errors in valid parameters", () => {
		let error = null;
		try {
			validateArchiveIdFromParams({
				archiveId: "123",
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).toBeNull();
		}
	});

	test("should error if archiveId is missing", () => {
		let error = null;
		try {
			validateArchiveIdFromParams({});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});

	test("should error if archiveId is wrong type", () => {
		let error = null;
		try {
			validateArchiveIdFromParams({
				archiveId: 123,
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
});

describe("validateCreateArchiveRequest", () => {
	const validBody = {
		emailFromAuthToken: "test@permanent.org",
		userSubjectFromAuthToken: "82bd483e-914b-4bfe-abf9-92ffe86d7803",
		name: "My Archive",
		ip: "127.0.0.1",
	};

	test("should not throw for a valid body without type", () => {
		expect(() => {
			validateCreateArchiveRequest(validBody);
		}).not.toThrow();
	});

	test.each(["person", "group", "organization"])(
		"should not throw for type %s",
		(type) => {
			expect(() => {
				validateCreateArchiveRequest({ ...validBody, type });
			}).not.toThrow();
		},
	);

	test("should throw for type nonprofit", () => {
		expect(() => {
			validateCreateArchiveRequest({ ...validBody, type: "nonprofit" });
		}).toThrow();
	});

	test("should throw if name is missing", () => {
		const { name: _name, ...rest } = validBody;
		expect(() => {
			validateCreateArchiveRequest(rest);
		}).toThrow();
	});

	test("should throw if name is empty", () => {
		expect(() => {
			validateCreateArchiveRequest({ ...validBody, name: "" });
		}).toThrow();
	});

	test("should throw if emailFromAuthToken is missing", () => {
		const { emailFromAuthToken: _email, ...rest } = validBody;
		expect(() => {
			validateCreateArchiveRequest(rest);
		}).toThrow();
	});

	test("should throw if ip is missing", () => {
		const { ip: _ip, ...rest } = validBody;
		expect(() => {
			validateCreateArchiveRequest(rest);
		}).toThrow();
	});
});
