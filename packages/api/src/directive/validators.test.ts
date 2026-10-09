import {
	validateCreateDirectiveRequest,
	validateTriggerAdminDirectivesParams,
	validateGetDirectivesByArchiveIdParams,
	validateUpdateDirectiveParams,
	validateUpdateDirectiveRequest,
} from "./validators.js";
import { describe, expect, test } from "vitest";

describe("validateCreateDirectiveRequest", () => {
	test("should find no errors in a valid request", () => {
		let error = null;
		try {
			validateCreateDirectiveRequest(
				{
					archiveId: "1",
					stewardEmail: "test+1@permanent.org",
					type: "transfer",
					trigger: {
						type: "admin",
					},
				},
				"test@permanent.org",
			);
		} catch (err) {
			error = err;
		} finally {
			expect(error).toBeNull();
		}
	});
	test("should raise an error if archiveId is missing", () => {
		let error = null;
		try {
			validateCreateDirectiveRequest(
				{
					stewardEmail: "test+1@permanent.org",
					type: "transfer",
					trigger: {
						type: "admin",
					},
				},
				"test@permanent.org",
			);
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
	test("should raise an error if stewardEmail is missing", () => {
		let error = null;
		try {
			validateCreateDirectiveRequest(
				{
					archiveId: "1",
					type: "transfer",
					trigger: {
						type: "admin",
					},
				},
				"test@permanent.org",
			);
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
	test("should raise an error if stewardEmail is the active account's email", () => {
		let error = null;
		try {
			validateCreateDirectiveRequest(
				{
					stewardEmail: "test@permanent.org",
					archiveId: "1",
					type: "transfer",
					trigger: {
						type: "admin",
					},
				},
				"test@permanent.org",
			);
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
	test("should raise an error if type is missing", () => {
		let error = null;
		try {
			validateCreateDirectiveRequest(
				{
					archiveId: "1",
					stewardEmail: "test+1@permanent.org",
					trigger: {
						type: "admin",
					},
				},
				"test@permanent.org",
			);
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
	test("should raise an error if trigger.type is missing", () => {
		let error = null;
		try {
			validateCreateDirectiveRequest(
				{
					archiveId: "1",
					stewardEmail: "test+1@permanent.org",
					type: "transfer",
					trigger: {},
				},
				"test@permanent.org",
			);
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
	test("should raise an error if trigger is missing", () => {
		let error = null;
		try {
			validateCreateDirectiveRequest(
				{
					archiveId: "1",
					stewardEmail: "test+1@permanent.org",
					type: "transfer",
				},
				"test@permanent.org",
			);
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
	test("should raise an error if archiveId type is invalid", () => {
		let error = null;
		try {
			validateCreateDirectiveRequest(
				{
					archiveId: 1,
					stewardEmail: "test+1@permanent.org",
					type: "transfer",
					trigger: {
						type: "admin",
					},
				},
				"test@permanent.org",
			);
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
	test("should raise an error if stewardEmail value is invalid", () => {
		let error = null;
		try {
			validateCreateDirectiveRequest(
				{
					archiveId: "1",
					stewardEmail: "test+1",
					type: "transfer",
					trigger: {
						type: "admin",
					},
				},
				"test@permanent.org",
			);
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
	test("should raise an error if type type is invalid", () => {
		let error = null;
		try {
			validateCreateDirectiveRequest(
				{
					archiveId: "1",
					stewardEmail: "test+1@permanent.org",
					type: 1,
					trigger: {
						type: "admin",
					},
				},
				"test@permanent.org",
			);
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
	test("should raise an error if note type is invalid", () => {
		let error = null;
		try {
			validateCreateDirectiveRequest(
				{
					archiveId: "1",
					stewardEmail: "test+1@permanent.org",
					type: "transfer",
					note: 1,
					trigger: {
						type: "admin",
					},
				},
				"test@permanent.org",
			);
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
	test("should raise an error if trigger.type type is invalid", () => {
		let error = null;
		try {
			validateCreateDirectiveRequest(
				{
					archiveId: "1",
					type: "transfer",
					stewardEmail: "test+1@permanent.org",
					trigger: {
						type: 1,
					},
				},
				"test@permanent.org",
			);
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
	test("should raise an error if trigger type is invalid", () => {
		let error = null;
		try {
			validateCreateDirectiveRequest(
				{
					archiveId: "1",
					stewardEmail: "test+1@permanent.org",
					type: "transfer",
					trigger: "admin",
				},
				"test@permanent.org",
			);
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
});

describe("validateTriggerAdminDirectivesParams", () => {
	test("should find no errors in valid parameter set", () => {
		let error = null;
		try {
			validateTriggerAdminDirectivesParams({
				accountId: "1",
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).toBeNull();
		}
	});
	test("should raise an error if accountId is missing", () => {
		let error = null;
		try {
			validateTriggerAdminDirectivesParams({});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
	test("should raise an error if accountId is the wrong type", () => {
		let error = null;
		try {
			validateTriggerAdminDirectivesParams({
				accountId: 1,
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
});

describe("validateUpdateDirectiveParams", () => {
	test("should find no errors in valid parameter set", () => {
		let error = null;
		try {
			validateUpdateDirectiveParams({
				directiveId: "9b729043-fa60-49e7-87b2-d007a9b82a2e",
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).toBeNull();
		}
	});
	test("should raise an error if directiveId is missing", () => {
		let error = null;
		try {
			validateUpdateDirectiveParams({});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
	test("should raise an error if directiveId is the wrong type", () => {
		let error = null;
		try {
			validateUpdateDirectiveParams({
				directiveId: 1,
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
	test("should raise an error if directiveId is an invalid value", () => {
		let error = null;
		try {
			validateUpdateDirectiveParams({
				directiveId: "not_a_uuid",
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
});

describe("validateUpdateDirectiveRequest", () => {
	test("should find no errors in valid parameter set", () => {
		let error = null;
		try {
			validateUpdateDirectiveRequest(
				{
					stewardEmail: "test+1@permanent.org",
					type: "transfer",
					note: "note",
					trigger: {
						type: "admin",
					},
				},
				"test@permanent.org",
			);
		} catch (err) {
			error = err;
		} finally {
			expect(error).toBeNull();
		}
	});
	test("should raise an error if stewardEmail is wrong type", () => {
		let error = null;
		try {
			validateUpdateDirectiveRequest(
				{
					stewardEmail: 1,
					type: "transfer",
					trigger: {
						type: "admin",
					},
				},
				"test@permanent.org",
			);
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
	test("should raise an error if stewardEmail is an invalid value", () => {
		let error = null;
		try {
			validateUpdateDirectiveRequest(
				{
					stewardEmail: "not_an_email",
					type: "transfer",
					trigger: {
						type: "admin",
					},
				},
				"test@permanent.org",
			);
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
	test("should raise an error if stewardEmail appears when type is set and not transfer", () => {
		let error = null;
		try {
			validateUpdateDirectiveRequest(
				{
					stewardEmail: "test+1@permanent.org",
					type: "delete",
					trigger: {
						type: "admin",
					},
				},
				"test@permanent.org",
			);
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
	test("should raise an error if stewardEmail is the active account's email", () => {
		let error = null;
		try {
			validateUpdateDirectiveRequest(
				{
					stewardEmail: "test@permanent.org",
					type: "transfer",
					trigger: {
						type: "admin",
					},
				},
				"test@permanent.org",
			);
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
	test("should raise an error if type is wrong data type", () => {
		let error = null;
		try {
			validateUpdateDirectiveRequest(
				{
					stewardEmail: "test+1@permanent.org",
					type: 1,
					trigger: {
						type: "admin",
					},
				},
				"test@permanent.org",
			);
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
	test("should raise an error if note is wrong data type", () => {
		let error = null;
		try {
			validateUpdateDirectiveRequest(
				{
					stewardEmail: "test+1@permanent.org",
					type: "transfer",
					note: 1,
					trigger: {
						type: "admin",
					},
				},
				"test@permanent.org",
			);
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
	test("should raise an error if trigger is wrong data type", () => {
		let error = null;
		try {
			validateUpdateDirectiveRequest(
				{
					stewardEmail: "test+1@permanent.org",
					type: "transfer",
					note: "note",
					trigger: "admin",
				},
				"test@permanent.org",
			);
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
	test("should raise an error if trigger type is wrong data type", () => {
		let error = null;
		try {
			validateUpdateDirectiveRequest(
				{
					stewardEmail: "test+1@permanent.org",
					type: "transfer",
					note: "note",
					trigger: {
						type: 1,
					},
				},
				"test@permanent.org",
			);
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
});

describe("validateGetDirectivesByArchiveIdParams", () => {
	test("should find no errors in valid parameter set", () => {
		let error = null;
		try {
			validateGetDirectivesByArchiveIdParams({
				archiveId: "1",
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).toBeNull();
		}
	});
	test("should raise an error if archiveId is missing", () => {
		let error = null;
		try {
			validateGetDirectivesByArchiveIdParams({});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
	test("should raise an error if archiveId is the wrong type", () => {
		let error = null;
		try {
			validateGetDirectivesByArchiveIdParams({
				archiveId: 1,
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
});
