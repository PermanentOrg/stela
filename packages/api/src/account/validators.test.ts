import {
	validateCreateStorageAdjustmentParams,
	validateLeaveArchiveParams,
	validateLeaveArchiveRequest,
	validateUpdateTagsRequest,
} from "./validators";

describe("validateUpdateTagsRequest", () => {
	test("should find no errors in a valid request", () => {
		let error = null;
		try {
			validateUpdateTagsRequest({
				emailFromAuthToken: "test@permanent.org",
				userSubjectFromAuthToken: "c0caa7e3-4396-4ec9-997c-ce09d939946c",
				addTags: ["tag1", "tag2"],
				removeTags: ["tag3", "tag4"],
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).toBeNull();
		}
	});
	test("should raise an error if emailFromAuthToken is missing", () => {
		let error = null;
		try {
			validateUpdateTagsRequest({
				userSubjectFromAuthToken: "c0caa7e3-4396-4ec9-997c-ce09d939946c",
				addTags: ["tag1", "tag2"],
				removeTags: ["tag3", "tag4"],
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
	test("should raise an error if emailFromAuthToken is wrong type", () => {
		let error = null;
		try {
			validateUpdateTagsRequest({
				emailFromAuthToken: 1,
				userSubjectFromAuthToken: "c0caa7e3-4396-4ec9-997c-ce09d939946c",
				addTags: ["tag1", "tag2"],
				removeTags: ["tag3", "tag4"],
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
	test("should raise an error if emailFromAuthToken is wrong format", () => {
		let error = null;
		try {
			validateUpdateTagsRequest({
				emailFromAuthToken: "not_an_email",
				userSubjectFromAuthToken: "c0caa7e3-4396-4ec9-997c-ce09d939946c",
				addTags: ["tag1", "tag2"],
				removeTags: ["tag3", "tag4"],
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
	test("should raise an error if userSubjectFromAuthToken is missing", () => {
		let error = null;
		try {
			validateUpdateTagsRequest({
				emailFromAuthToken: "test@permanent.org",
				addTags: ["tag1", "tag2"],
				removeTags: ["tag3", "tag4"],
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
	test("should raise an error if userSubjectFromAuthToken is wrong type", () => {
		let error = null;
		try {
			validateUpdateTagsRequest({
				emailFromAuthToken: "test@permanent.org",
				userSubjectFromAuthToken: 1,
				addTags: ["tag1", "tag2"],
				removeTags: ["tag3", "tag4"],
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
	test("should raise an error if userSubjectFromAuthToken is wrong format", () => {
		let error = null;
		try {
			validateUpdateTagsRequest({
				emailFromAuthToken: "test@permanent.org",
				userSubjectFromAuthToken: "not_a_uuid",
				addTags: ["tag1", "tag2"],
				removeTags: ["tag3", "tag4"],
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
				emailFromAuthToken: "test@permanent.org",
				userSubjectFromAuthToken: "c0caa7e3-4396-4ec9-997c-ce09d939946c",
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
				emailFromAuthToken: "test@permanent.org",
				userSubjectFromAuthToken: "c0caa7e3-4396-4ec9-997c-ce09d939946c",
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
				emailFromAuthToken: "test@permanent.org",
				userSubjectFromAuthToken: "c0caa7e3-4396-4ec9-997c-ce09d939946c",
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
				emailFromAuthToken: "test@permanent.org",
				userSubjectFromAuthToken: "c0caa7e3-4396-4ec9-997c-ce09d939946c",
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
			validateUpdateTagsRequest({
				emailFromAuthToken: "test@permanent.org",
				userSubjectFromAuthToken: "c0caa7e3-4396-4ec9-997c-ce09d939946c",
			});
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

describe("validateLeaveArchiveRequest", () => {
	test("should find no errors in valid parameters", () => {
		let error = null;
		try {
			validateLeaveArchiveRequest({
				ip: "127.0.0.1",
				emailFromAuthToken: "test@test.com",
				userSubjectFromAuthToken: "b5461dc2-1eb0-450e-b710-fef7b2cafe1e",
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).toBeNull();
		}
	});

	test("should error if 'ip' is missing", () => {
		let error = null;
		try {
			validateLeaveArchiveRequest({
				emailFromAuthToken: "test@test.com",
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});

	test("should error if 'emailFromAuthToken' is missing", () => {
		let error = null;
		try {
			validateLeaveArchiveRequest({
				ip: "127.0.0.1",
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});

	test("should error if 'ip' is not the right format", () => {
		let error = null;
		try {
			validateLeaveArchiveRequest({
				ip: "1.2.3",
				emailFromAuthToken: "test@test.com",
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});

	test("should error if 'emailFromAuthToken' is not the right format", () => {
		let error = null;
		try {
			validateLeaveArchiveRequest({
				ip: "127.0.0.1",
				emailFromAuthToken: "not_an_email",
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
