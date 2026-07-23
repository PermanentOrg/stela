import {
	validatePatchFolderRequest,
	validateGetFoldersQuery,
	validateGetFoldersPageQuery,
} from "./validators.js";
import { describe, expect, test } from "vitest";

describe("validatePatchFolderRequest", () => {
	test("should find no errors in a valid request", () => {
		let error = null;
		try {
			validatePatchFolderRequest({
				emailFromAuthToken: "user@example.com",
				userSubjectFromAuthToken: "5c3473b6-cf2e-4c55-a80e-8db51d1bc5fd",
				displayDate: null,
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).toBeNull();
		}
	});
	test("should raise an error when all fields are missing", () => {
		let error = null;
		try {
			validatePatchFolderRequest({
				emailFromAuthToken: "user@example.com",
				userSubjectFromAuthToken: "5c3473b6-cf2e-4c55-a80e-8db51d1bc5fd",
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
	test("should not raise an error when fields are null", () => {
		let error = null;
		try {
			validatePatchFolderRequest({
				emailFromAuthToken: "user@example.com",
				userSubjectFromAuthToken: "5c3473b6-cf2e-4c55-a80e-8db51d1bc5fd",
				displayDate: null,
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).toBeNull();
		}
	});

	test("should raise an error if displayDate is wrong type", () => {
		let error = null;
		try {
			validatePatchFolderRequest({
				emailFromAuthToken: "user@example.com",
				userSubjectFromAuthToken: "5c3473b6-cf2e-4c55-a80e-8db51d1bc5fd",
				displayDate: true,
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
			validatePatchFolderRequest({
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
			validatePatchFolderRequest({
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
			validatePatchFolderRequest({
				emailFromAuthToken: "user@example.com",
				userSubjectFromAuthToken: "5c3473b6-cf2e-4c55-a80e-8db51d1bc5fd",
				location: { id: "1", name: "Jean Valjean's House" },
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
			validatePatchFolderRequest({
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

describe("validateGetFoldersQuery", () => {
	test("should find no errors in a valid request", () => {
		let error = null;
		try {
			validateGetFoldersQuery({
				folderIds: ["1", "2", "3"],
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).toBeNull();
		}
	});
	test("should throw an error if folderIds is missing", () => {
		let error = null;
		try {
			validateGetFoldersQuery({});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
	test("should throw an error if folderIds is empty", () => {
		let error = null;
		try {
			validateGetFoldersQuery({
				folderIds: [],
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
	test("should throw an error if folderIds is not an array", () => {
		let error = null;
		try {
			validateGetFoldersQuery({
				folderIds: "1",
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
	test("should throw an error if folderIds contains non-string members", () => {
		let error = null;
		try {
			validateGetFoldersQuery({
				folderIds: [1, 2, 3],
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
});

describe("validateGetFoldersPageQuery", () => {
	test("should find no errors in a valid request", () => {
		let error = null;
		try {
			validateGetFoldersPageQuery({
				folderIds: ["1", "2", "3"],
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
			validateGetFoldersPageQuery({
				folderIds: ["1", "2"],
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
			validateGetFoldersPageQuery({
				folderIds: ["1"],
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
			validateGetFoldersPageQuery({
				folderIds: ["1"],
				pageSize: 1.5,
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});

	test("should raise an error if folderIds is missing", () => {
		let error = null;
		try {
			validateGetFoldersPageQuery({
				pageSize: 10,
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
});
