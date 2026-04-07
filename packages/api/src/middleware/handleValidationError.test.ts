import type { NextFunction } from "express";
import { createRequest, createResponse } from "node-mocks-http";
import { handleValidationError } from "./handleValidationError";

describe("handleValidationError", () => {
	const request = createRequest();
	const response = createResponse();
	response.status = jest.fn().mockReturnThis();
	response.json = jest.fn();
	const nextFunction = jest.fn() as NextFunction;

	beforeEach(() => {
		jest.clearAllMocks();
	});

	test("should respond with 400 and error message if error is a Joi ValidationError", () => {
		const error = Object.assign(new Error("some field is required"), {
			isJoi: true,
		});
		handleValidationError(error, request, response, nextFunction);
		expect(response.status).toHaveBeenCalledWith(400);
		expect(response.json).toHaveBeenCalledWith({
			error: "some field is required",
		});
		expect(nextFunction).not.toHaveBeenCalled();
	});

	test("should call next with the error if it is not a Joi ValidationError", () => {
		const error = new Error("some other error");
		handleValidationError(error, request, response, nextFunction);
		expect(response.status).not.toHaveBeenCalled();
		expect(response.json).not.toHaveBeenCalled();
		expect(nextFunction).toHaveBeenCalledWith(error);
	});
});
