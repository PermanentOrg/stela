import type { Request, Response, NextFunction } from "express";
import * as Sentry from "@sentry/node";

interface ErrorWithStatus {
	status: number;
}

interface ErrorWithStatusCode {
	statusCode: number;
}

const isErrorWithStatus = (err: unknown): err is ErrorWithStatus =>
	typeof (err as ErrorWithStatus).status === "number";

const isErrorWithStatusCode = (err: unknown): err is ErrorWithStatusCode =>
	typeof (err as ErrorWithStatusCode).statusCode === "number";

export const handleError = async (
	err: unknown,
	_: Request,
	res: Response,
	next: NextFunction,
): Promise<void> => {
	Sentry.captureException(err);
	if (isErrorWithStatus(err)) {
		res.status(err.status).json({ error: err });
	} else if (isErrorWithStatusCode(err)) {
		res.status(err.statusCode).json({ error: err });
	} else {
		next(err);
	}
};
