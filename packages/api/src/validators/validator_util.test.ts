import { isValidationError } from "./validator_util.js";
import { describe, expect, test } from "vitest";

describe("isValidationError", () => {
	test("should recognize a ValidationError", () => {
		expect(isValidationError({ isJoi: true })).toBeTruthy();
	});

	test("should recognize when something is not an ValidationError", () => {
		expect(isValidationError({ isJoi: false })).toBeFalsy();
		expect(isValidationError({})).toBeFalsy();
	});
});
