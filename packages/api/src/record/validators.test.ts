import { describe, expect, test } from "vitest";
import {
	validatePatchRecordRequest,
	validateGetRecordsPageQuery,
} from "./validators.js";

describe("validatePatchRecordRequest", () => {
	test("should find no errors in a valid request", () => {
		let error = null;
		try {
			validatePatchRecordRequest({
				emailFromAuthToken: "user@example.com",
				userSubjectFromAuthToken: "5c3473b6-cf2e-4c55-a80e-8db51d1bc5fd",
				locationId: 123,
				description: "description",
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).toBeNull();
		}
	});
	test("should not raise an error when optional fields are missing", () => {
		let error = null;
		try {
			validatePatchRecordRequest({
				emailFromAuthToken: "user@example.com",
				userSubjectFromAuthToken: "5c3473b6-cf2e-4c55-a80e-8db51d1bc5fd",
				locationId: 123,
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).toBeNull();
		}
	});
	test("should not raise an error when fields are null", () => {
		let error = null;
		try {
			validatePatchRecordRequest({
				emailFromAuthToken: "user@example.com",
				userSubjectFromAuthToken: "5c3473b6-cf2e-4c55-a80e-8db51d1bc5fd",
				locationId: null,
				description: null,
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).toBeNull();
		}
	});

	test("should raise an error if locationId is wrong type", () => {
		let error = null;
		try {
			validatePatchRecordRequest({
				emailFromAuthToken: "user@example.com",
				userSubjectFromAuthToken: "5c3473b6-cf2e-4c55-a80e-8db51d1bc5fd",
				locationId: true,
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});

	test("should accept a nested location object", () => {
		let error = null;
		try {
			validatePatchRecordRequest({
				emailFromAuthToken: "user@example.com",
				userSubjectFromAuthToken: "5c3473b6-cf2e-4c55-a80e-8db51d1bc5fd",
				location: {
					name: "Jean Valjean's House",
					city: "Paris",
					country: "France",
					latitude: 48.8386,
					longitude: 2.3069,
					precision: "approximate",
				},
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).toBeNull();
		}
	});

	test("should reject an empty location object", () => {
		let error = null;
		try {
			validatePatchRecordRequest({
				emailFromAuthToken: "user@example.com",
				userSubjectFromAuthToken: "5c3473b6-cf2e-4c55-a80e-8db51d1bc5fd",
				location: {},
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});

	test("should reject a location with an id field", () => {
		let error = null;
		try {
			validatePatchRecordRequest({
				emailFromAuthToken: "user@example.com",
				userSubjectFromAuthToken: "5c3473b6-cf2e-4c55-a80e-8db51d1bc5fd",
				location: {
					id: "1",
					name: "Jean Valjean's House",
				},
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});

	test("should reject if both locationId and location are present", () => {
		let error = null;
		try {
			validatePatchRecordRequest({
				emailFromAuthToken: "user@example.com",
				userSubjectFromAuthToken: "5c3473b6-cf2e-4c55-a80e-8db51d1bc5fd",
				locationId: 1,
				location: { name: "Jean Valjean's House" },
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});

	test("should reject a location with invalid precision value", () => {
		let error = null;
		try {
			validatePatchRecordRequest({
				emailFromAuthToken: "user@example.com",
				userSubjectFromAuthToken: "5c3473b6-cf2e-4c55-a80e-8db51d1bc5fd",
				location: { precision: "perfect" },
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});

	test("should reject latitude out of range", () => {
		let error = null;
		try {
			validatePatchRecordRequest({
				emailFromAuthToken: "user@example.com",
				userSubjectFromAuthToken: "5c3473b6-cf2e-4c55-a80e-8db51d1bc5fd",
				location: { latitude: 200 },
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});

	test("should reject a location that uses deprecated fields", () => {
		let error = null;
		try {
			validatePatchRecordRequest({
				emailFromAuthToken: "user@example.com",
				userSubjectFromAuthToken: "5c3473b6-cf2e-4c55-a80e-8db51d1bc5fd",
				location: {
					streetNumber: "55",
					streetName: "Rue Plumet",
					locality: "Paris",
					county: "Ile-de-France",
					countryCode: "FR",
					displayName: "Jean Valjean's House",
				},
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
});

describe("validateGetRecordsPageQuery", () => {
	test("should find no errors in a valid request", () => {
		let error = null;
		try {
			validateGetRecordsPageQuery({
				archiveId: "1",
				pageSize: 10,
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).toBeNull();
		}
	});

	test("should find no errors when a cursor is provided", () => {
		let error = null;
		try {
			validateGetRecordsPageQuery({
				recordIds: ["1", "2"],
				pageSize: 10,
				cursor: "5",
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).toBeNull();
		}
	});

	test("should raise an error if pageSize is missing", () => {
		let error = null;
		try {
			validateGetRecordsPageQuery({
				archiveId: "1",
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});

	test("should raise an error if pageSize is not an integer", () => {
		let error = null;
		try {
			validateGetRecordsPageQuery({
				archiveId: "1",
				pageSize: 1.5,
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});

	test("should raise an error if neither recordIds nor archiveId is provided", () => {
		let error = null;
		try {
			validateGetRecordsPageQuery({
				pageSize: 10,
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
});
