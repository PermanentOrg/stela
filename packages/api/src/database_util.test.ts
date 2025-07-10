import { TinyPgError } from "tinypg";
import {
	isInvalidEnumError,
	getInvalidValueFromInvalidEnumMessage,
} from "./database_util";

const testInvalidEnumError =
	"invalid input value for enum test_enum: not_a_test_enum";
const testNotInvalidEnumError = "Out of Cheese Error: Redo From Start";

describe("isInvalidEnumError", () => {
	test("should correctly recognize invalid enum errors", () => {
		expect(isInvalidEnumError(new TinyPgError(testInvalidEnumError))).toBe(
			true,
		);
	});
	test("should return false if not given a TinyPgError", () => {
		expect(
			isInvalidEnumError({
				message: testInvalidEnumError,
			}),
		).toBe(false);
	});
	test("should return false if not given an invalid enum error", () => {
		expect(
			isInvalidEnumError({
				message: testNotInvalidEnumError,
			}),
		).toBe(false);
	});
});

describe("getInvalidValueFromInvalidEnumMessage", () => {
	test("should return the value part of an invalid enum error message", () => {
		expect(getInvalidValueFromInvalidEnumMessage(testInvalidEnumError)).toBe(
			"not_a_test_enum",
		);
	});
	test("should return empty string if the format doesn't match an invalid enum error", () => {
		expect(getInvalidValueFromInvalidEnumMessage("test")).toBe("");
	});
});
