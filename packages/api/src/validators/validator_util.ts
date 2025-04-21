import type { ValidationError } from "joi";

const isValidationError = (err: unknown): err is ValidationError =>
	(err as ValidationError).isJoi;

export { isValidationError };
