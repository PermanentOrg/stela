import type { Request, Response, NextFunction } from "express";
import * as Sentry from "@sentry/node";

interface ObjectWithStatus {
	status: number;
}

interface ObjectWithStatusCode {
	statusCode: number;
}

const isObjectWithStatus = (value: unknown): value is ObjectWithStatus =>
	value instanceof Object &&
	"status" in value &&
	typeof (value as { status: unknown }).status === "number";

export const isObjectWithStatusCode = (
	value: unknown,
): value is ObjectWithStatusCode =>
	value instanceof Object &&
	"statusCode" in value &&
	typeof (value as { statusCode: unknown }).statusCode === "number";

export const handleError = async (
	err: unknown,
	_: Request,
	res: Response,
	next: NextFunction,
): Promise<void> => {
	Sentry.captureException(err);
	if (isObjectWithStatus(err)) {
		res.status(err.status).json({ error: err });
	} else if (isObjectWithStatusCode(err)) {
		res.status(err.statusCode).json({ error: err });
	} else {
		next(err);
	}
};
