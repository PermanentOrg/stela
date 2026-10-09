import {
	validateCreateStorageAdjustmentParams,
	validateLeaveArchiveParams,
	validateUpdateTagsRequest,
} from "./validators.js";
import { describe, expect, test } from "vitest";

describe("validateUpdateTagsRequest", () => {
	test("should find no errors in a valid request", () => {
		let error = null;
		try {
			validateUpdateTagsRequest({
				addTags: ["tag1", "tag2"],
				removeTags: ["tag3", "tag4"],
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).toBeNull();
		}
	});
	test("should raise an error if authentication fields are supplied in the body", () => {
		let error = null;
		try {
			validateUpdateTagsRequest({
				emailFromAuthToken: "test@permanent.org",
				addTags: ["tag1", "tag2"],
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
	test("should raise an error if addTags is not an array", () => {
		let error = null;
		try {
			validateUpdateTagsRequest({
				addTags: "tag1, tag2",
				removeTags: ["tag3", "tag4"],
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
	test("should raise an error if addTags has members of the wrong type", () => {
		let error = null;
		try {
			validateUpdateTagsRequest({
				addTags: ["tag1", 2],
				removeTags: ["tag3", "tag4"],
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
	test("should raise an error if removeTags is not an array", () => {
		let error = null;
		try {
			validateUpdateTagsRequest({
				addTags: ["tag1", "tag2"],
				removeTags: "tag3, tag4",
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
	test("should raise an error if removeTags has members of the wrong type", () => {
		let error = null;
		try {
			validateUpdateTagsRequest({
				addTags: ["tag1", "tag2"],
				removeTags: ["tag3", 4],
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
	test("should raise an error if addTags and removeTags are missing", () => {
		let error = null;
		try {
			validateUpdateTagsRequest({});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
});

describe("validateLeaveArchiveParams", () => {
	test("should find no errors in valid parameters (accepts numeric IDs and UUIDs)", () => {
		let error = null;
		try {
			validateLeaveArchiveParams({
				archiveId: "123",
			});

			validateLeaveArchiveParams({
				archiveId: "b5461dc2-1eb0-450e-b710-fef7b2cafe1e",
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
			validateLeaveArchiveParams({});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});

	test("should error if archiveId is not of type string", () => {
		let error = null;
		try {
			validateLeaveArchiveParams({
				archiveId: 123,
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});

	test("should error if archiveId is an invalid string", () => {
		let error = null;
		try {
			validateLeaveArchiveParams({
				archiveId: "not_real_id",
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});

	test("should error if archiveId string is numeric and begins with a 0", () => {
		let error = null;
		try {
			validateLeaveArchiveParams({
				archiveId: "0123",
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
});

describe("validateCreateStorageAdjustmentParams", () => {
	test("should error if accountId is missing", () => {
		let error = null;
		try {
			validateCreateStorageAdjustmentParams({});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});

	test("should error if accountId is not a string", () => {
		let error = null;
		try {
			validateCreateStorageAdjustmentParams({ accountId: 1 });
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
});
