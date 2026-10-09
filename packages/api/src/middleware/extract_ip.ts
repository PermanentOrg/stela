import type { Request, Response, NextFunction } from "express";
import Joi from "joi";

const extractClientIpFromProxyList = (
	list: string | undefined,
): string | undefined => {
	if (typeof list !== "undefined") {
		if (list.includes(",")) {
			return list.split(",").shift()?.trim();
		}
	}
	return list;
};

export const extractIp = (
	req: Request<unknown, unknown, unknown>,
	_: Response,
	next: NextFunction,
): void => {
	const ipFromHeaders = extractClientIpFromProxyList(
		req.get("X-Forwarded-For"),
	);
	req.metadata = {
		...req.metadata,
		clientIp:
			Joi.string().ip().required().validate(ipFromHeaders).error === undefined
				? ipFromHeaders
				: req.socket.remoteAddress,
	};
	next();
};
