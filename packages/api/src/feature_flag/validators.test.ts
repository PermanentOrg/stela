import {
	validateCreateFeatureFlagRequest,
	validateUpdateFeatureFlagRequest,
	validateFeatureFlagParams,
} from "./validators.js";
import { describe, expect, test } from "vitest";

describe("validateCreateFeatureFlagRequest", () => {
	test("should find no errors in a valid request", () => {
		let error = null;
		try {
			validateCreateFeatureFlagRequest({
				name: "test-feature-flag",
				description: "feature flag description",
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
			validateCreateFeatureFlagRequest({
				name: "test-feature-flag",
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).toBeNull();
		}
	});
	test("should not raise an error when optional fields are null", () => {
		let error = null;
		try {
			validateCreateFeatureFlagRequest({
				name: "test-feature-flag",
				description: null,
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).toBeNull();
		}
	});
	test("should raise an error if name is missing", () => {
		let error = null;
		try {
			validateCreateFeatureFlagRequest({
				description: "feature flag description",
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
	test("should raise an error if name is wrong type", () => {
		let error = null;
		try {
			validateCreateFeatureFlagRequest({
				name: 1,
				description: "feature flag description",
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});

	test("should raise an error if description is wrong type", () => {
		let error = null;
		try {
			validateCreateFeatureFlagRequest({
				name: "name",
				description: 123,
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
});

describe("validateUpdateFeatureFlagRequest", () => {
	test("should find no errors in a valid request", () => {
		let error = null;
		try {
			validateUpdateFeatureFlagRequest({
				description: "feature flag description",
				globallyEnabled: false,
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
			validateUpdateFeatureFlagRequest({
				globallyEnabled: false,
				description: "feature flag description",
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).toBeNull();
		}
	});
	test("should not raise an error when optional fields are null", () => {
		let error = null;
		try {
			validateUpdateFeatureFlagRequest({
				globallyEnabled: false,
				description: null,
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).toBeNull();
		}
	});
	test("should raise an error if globallyEnabled is missing", () => {
		let error = null;
		try {
			validateUpdateFeatureFlagRequest({
				description: "feature flag description",
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
	test("should raise an error if globallyEnabled is wrong type", () => {
		let error = null;
		try {
			validateUpdateFeatureFlagRequest({
				name: 1,
				description: "feature flag description",
				globallyEnabled: "test",
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});

	test("should raise an error if description is wrong type", () => {
		let error = null;
		try {
			validateUpdateFeatureFlagRequest({
				description: 123,
				globallyEnabled: false,
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
});

describe("validateFeatureFlagParams", () => {
	test("should find no errors in a valid request", () => {
		let error = null;
		try {
			validateFeatureFlagParams({
				featureId: "bdefb1b1-2a2d-410a-b9a2-d41f15dfb5ce",
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).toBeNull();
		}
	});
	test("should raise an error if id is missing", () => {
		let error = null;
		try {
			validateFeatureFlagParams({});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
	test("should raise an error if id is wrong type", () => {
		let error = null;
		try {
			validateFeatureFlagParams({
				featureId: 3,
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
});
