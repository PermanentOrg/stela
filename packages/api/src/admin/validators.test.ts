import { validateRecalculateFolderThumbnailsRequest } from "./validators.js";
import { describe, expect, test } from "vitest";

describe("validateRecalculateFolderThumbnailsRequest", () => {
	test("should not error if the request is valid", () => {
		let error = null;
		try {
			validateRecalculateFolderThumbnailsRequest({
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

	test("should error if authentication fields are supplied in the body", () => {
		expectErrorForRequestObject({
			emailFromAuthToken: "test@permanent.org",
			adminSubjectFromAuthToken: "fcb2b59b-df07-4e79-ad20-bf7f067a965e",
			beginTimestamp: "2023-07-30",
			endTimestamp: "2023-07-31",
		});
	});

	test("should error if beginTimestamp is missing", () => {
		expectErrorForRequestObject({
			endTimestamp: "2023-07-31",
		});
	});

	test("should error if beginTimestamp is wrong type", () => {
		expectErrorForRequestObject({
			beginTimestamp: "not_a_date",
			endTimestamp: "2023-07-31",
		});
	});

	test("should error if beginTimestamp is wrong format", () => {
		expectErrorForRequestObject({
			beginTimestamp: "07/31/23",
			endTimestamp: "2023-07-31",
		});
	});

	test("should error if endTimestamp is missing", () => {
		expectErrorForRequestObject({
			beginTimestamp: "2023-07-30",
		});
	});

	test("should error if endTimestamp is wrong type", () => {
		expectErrorForRequestObject({
			beginTimestamp: "2023-07-30",
			endTimestamp: "not_a_date",
		});
	});

	test("should error if endTimestamp is wrong format", () => {
		expectErrorForRequestObject({
			beginTimestamp: "2023-07-30",
			endTimestamp: "07/31/23",
		});
	});
});
