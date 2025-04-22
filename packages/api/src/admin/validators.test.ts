import { validateRecalculateFolderThumbnailsRequest } from "./validators";

const adminSubjectFromAuthToken = "fcb2b59b-df07-4e79-ad20-bf7f067a965e";

describe("validateRecalculateFolderThumbnailsRequest", () => {
	test("should not error if the request is valid", () => {
		let error = null;
		try {
			validateRecalculateFolderThumbnailsRequest({
				emailFromAuthToken: "test@permanent.org",
				adminSubjectFromAuthToken,
				beginTimestamp: "2023-07-30",
				endTimestamp: "2023-07-31",
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).toBeNull();
		}
	});

	const expectErrorForRequestObject = (request: unknown): void => {
		let error = null;
		try {
			validateRecalculateFolderThumbnailsRequest(request);
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	};

	test("should error if emailFromAuthToken is missing", () => {
		expectErrorForRequestObject({
			adminSubjectFromAuthToken,
			beginTimestamp: "2023-07-30",
			endTimestamp: "2023-07-31",
		});
	});

	test("should error if emailFromAuthToken is wrong type", () => {
		expectErrorForRequestObject({
			emailFromAuthToken: 123,
			adminSubjectFromAuthToken,
			beginTimestamp: "2023-07-30",
			endTimestamp: "2023-07-31",
		});
	});

	test("should error if emailFromAuthToken is wrong format", () => {
		expectErrorForRequestObject({
			emailFromAuthToken: "not_an_email",
			adminSubjectFromAuthToken,
			beginTimestamp: "2023-07-30",
			endTimestamp: "2023-07-31",
		});
	});

	test("should error if adminSubjectFromAuthToken is missing", () => {
		expectErrorForRequestObject({
			emailFromAuthToken: "test@permanent.org",
			beginTimestamp: "2023-07-30",
			endTimestamp: "2023-07-31",
		});
	});

	test("should error if adminSubjectFromAuthToken is wrong type", () => {
		expectErrorForRequestObject({
			adminSubjectFromAuthToken: 12345,
			emailFromAuthToken: "test@permanent.org",
			beginTimestamp: "2023-07-30",
			endTimestamp: "2023-07-31",
		});
	});

	test("should error if adminSubjectFromAuthToken is wrong format", () => {
		expectErrorForRequestObject({
			adminSubjectFromAuthToken: "not a uuid",
			emailFromAuthToken: "test@permanent.org",
			beginTimestamp: "2023-07-30",
			endTimestamp: "2023-07-31",
		});
	});

	test("should error if beginTimestamp is missing", () => {
		expectErrorForRequestObject({
			adminSubjectFromAuthToken,
			emailFromAuthToken: "test@permanent.org",
			endTimestamp: "2023-07-31",
		});
	});

	test("should error if beginTimestamp is wrong type", () => {
		expectErrorForRequestObject({
			adminSubjectFromAuthToken,
			emailFromAuthToken: "test@permanent.org",
			beginTimestamp: "not_a_date",
			endTimestamp: "2023-07-31",
		});
	});

	test("should error if beginTimestamp is wrong format", () => {
		expectErrorForRequestObject({
			adminSubjectFromAuthToken,
			emailFromAuthToken: "test@permanent.org",
			beginTimestamp: "07/31/23",
			endTimestamp: "2023-07-31",
		});
	});

	test("should error if endTimestamp is missing", () => {
		expectErrorForRequestObject({
			adminSubjectFromAuthToken,
			emailFromAuthToken: "test@permanent.org",
			beginTimestamp: "2023-07-30",
		});
	});

	test("should error if endTimestamp is wrong type", () => {
		expectErrorForRequestObject({
			adminSubjectFromAuthToken,
			emailFromAuthToken: "test@permanent.org",
			beginTimestamp: "2023-07-30",
			endTimestamp: "not_a_date",
		});
	});

	test("should error if endTimestamp is wrong format", () => {
		expectErrorForRequestObject({
			adminSubjectFromAuthToken,
			emailFromAuthToken: "test@permanent.org",
			beginTimestamp: "2023-07-30",
			endTimestamp: "07/31/23",
		});
	});
});
