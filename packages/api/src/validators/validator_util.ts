import type { ValidationError } from "joi";

const isValidationError = (value: unknown): value is ValidationError =>
	typeof value === "object" &&
	value !== null &&
	"isJoi" in value &&
	typeof value.isJoi === "boolean" &&
	value.isJoi;

export { isValidationError };
