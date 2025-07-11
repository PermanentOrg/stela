import type { NextFunction } from "express";
import { createRequest, createResponse } from "node-mocks-http";
import * as Sentry from "@sentry/node";
import { handleError } from "./handleError";

jest.mock("@sentry/node", () => ({
	captureException: jest.fn(),
}));
describe("handleError", () => {
	const request = createRequest();
	const response = createResponse();
	response.status = jest.fn().mockReturnThis();
	response.json = jest.fn();
	const nextFunction = jest.fn() as NextFunction;

	beforeEach(() => {
		jest.clearAllMocks();
	});

	test("should respond with the status and error object if the error has 'status' property", async () => {
		const error = { status: 400 };
		handleError(error, request, response, nextFunction);
		expect(Sentry.captureException).toHaveBeenCalledWith(error);
		expect(response.status).toHaveBeenCalledWith(400);
		expect(response.json).toHaveBeenCalledWith({ error });
		expect(nextFunction).not.toHaveBeenCalled();
	});

	test("should respond with the statusCode and error object if the error has 'statusCode' property", async () => {
		const error = { statusCode: 500 };
		handleError(error, request, response, nextFunction);
		expect(Sentry.captureException).toHaveBeenCalledWith(error);
		expect(response.status).toHaveBeenCalledWith(500);
		expect(response.json).toHaveBeenCalledWith({ error });
		expect(nextFunction).not.toHaveBeenCalled();
	});

	test("should call the next function if the error doesn't have 'status' or 'statusCode' property", async () => {
		const error = new Error("Some error");
		handleError(error, request, response, nextFunction);
		expect(Sentry.captureException).toHaveBeenCalledWith(error);
		expect(response.status).not.toHaveBeenCalled();
		expect(response.json).not.toHaveBeenCalled();
		expect(nextFunction).toHaveBeenCalledWith(error);
	});
});
