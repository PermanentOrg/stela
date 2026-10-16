import type { Request, Response, NextFunction } from "express";
import createError from "http-errors";
import { fusionAuthClient } from "../fusionauth.js";
import { isObjectWithStatusCode } from "./handleError.js";
import { HTTP_STATUS } from "@pdc/http-status-codes";
import type { RequestAuth } from "./models.js";

const emailKey = "email";

const getOptionalValueFromAuthToken = async (
	authenticationToken: string,
	key: "email" | "sub",
	applicationIds: string[],
): Promise<string> => {
	const introspectionResponses = await Promise.all(
		applicationIds.map(async (applicationId) => {
			try {
				const response = await fusionAuthClient.introspectAccessToken(
					applicationId,
					authenticationToken,
				);
				return response;
			} catch (err) {
				if (
					isObjectWithStatusCode(err) &&
					err.statusCode ===
						HTTP_STATUS.CLIENT_ERROR.TOO_MANY_REQUESTS.valueOf()
				) {
					throw err;
				}
				return null;
			}
		}),
	);

	const successfulIntrospectionResponse = introspectionResponses.find(
		(introspectionResponse) =>
			introspectionResponse === null
				? false
				: introspectionResponse.wasSuccessful() &&
					introspectionResponse.response.active,
	);
	if (
		successfulIntrospectionResponse === undefined ||
		successfulIntrospectionResponse === null
	) {
		return "";
	}
	if (
		!successfulIntrospectionResponse.response.active ||
		typeof successfulIntrospectionResponse.response[key] !== "string"
	) {
		return "";
	}

	return successfulIntrospectionResponse.response[key];
};

const getValuesFromAuthToken = async (
	authenticationToken: string,
	applicationId: string,
): Promise<{ email: string; subject: string }> => {
	const introspectionResponse = await fusionAuthClient.introspectAccessToken(
		applicationId,
		authenticationToken,
	);
	if (!introspectionResponse.wasSuccessful()) {
		throw new createError.Unauthorized(
			`Token validation failed: ${
				introspectionResponse.exception.message ?? ""
			}`,
		);
	}

	if (
		!introspectionResponse.response.active ||
		typeof introspectionResponse.response.email !== "string" ||
		introspectionResponse.response.email === "" ||
		typeof introspectionResponse.response.sub !== "string" ||
		introspectionResponse.response.sub === ""
	) {
		throw new createError.Unauthorized("Invalid token");
	}

	return {
		email: introspectionResponse.response.email,
		subject: introspectionResponse.response.sub,
	};
};

const getAuthTokenFromRequest = (
	req: Request<unknown, unknown, unknown>,
): string => {
	const authorizationHeaderParts = req.get("Authorization")?.split(" ");
	if (authorizationHeaderParts === undefined) {
		return "";
	}
	const [firstWordInAuthorizationHeader, secondWordInAuthorizationHeader] =
		authorizationHeaderParts;
	if (firstWordInAuthorizationHeader !== "Bearer") {
		return "";
	}
	return secondWordInAuthorizationHeader ?? "";
};

const getSubjectAndEmailFromUserAuthToken = async (
	authenticationToken: string,
): Promise<{ subject: string; email: string }> => {
	try {
		return await getValuesFromAuthToken(
			authenticationToken,
			process.env["FUSIONAUTH_BACKEND_APPLICATION_ID"] ?? "",
		);
	} catch (err) {
		if (
			isObjectWithStatusCode(err) &&
			err.statusCode === HTTP_STATUS.CLIENT_ERROR.UNAUTHORIZED.valueOf()
		) {
			return await getValuesFromAuthToken(
				authenticationToken,
				process.env["FUSIONAUTH_SFTP_APPLICATION_ID"] ?? "",
			);
		}
		throw err;
	}
};

const getSubjectAndEmailFromAdminAuthToken = async (
	authenticationToken: string,
): Promise<{ subject: string; email: string }> => {
	const { subject, email } = await getValuesFromAuthToken(
		authenticationToken,
		process.env["FUSIONAUTH_ADMIN_APPLICATION_ID"] ?? "",
	);
	return { subject, email };
};

export const setAuth = (
	req: Request<unknown, unknown, unknown>,
	auth: RequestAuth,
): void => {
	req.metadata = {
		...req.metadata,
		auth: { ...req.metadata?.auth, ...auth },
	};
};

const verifyUserAuthentication = async (
	req: Request<unknown, unknown, unknown>,
	_: Response,
	next: NextFunction,
): Promise<void> => {
	try {
		const authenticationToken = getAuthTokenFromRequest(req);
		if (authenticationToken === "") {
			throw new createError.Unauthorized("Invalid Authorization header format");
		}
		const { subject, email } =
			await getSubjectAndEmailFromUserAuthToken(authenticationToken);
		setAuth(req, { kind: "user", email, subject });
		next();
	} catch (err) {
		next(err);
	}
};

const verifyAdminAuthentication = async (
	req: Request<unknown, unknown, unknown>,
	_: Response,
	next: NextFunction,
): Promise<void> => {
	try {
		const authenticationToken = getAuthTokenFromRequest(req);
		if (authenticationToken === "") {
			throw new createError.Unauthorized("Invalid Authorization header format");
		}
		const { email, subject } = await getValuesFromAuthToken(
			authenticationToken,
			process.env["FUSIONAUTH_ADMIN_APPLICATION_ID"] ?? "",
		);
		setAuth(req, { kind: "admin", email, subject });
		next();
	} catch (err) {
		next(err);
	}
};

const verifyUserOrAdminAuthentication = async (
	req: Request<unknown, unknown, unknown>,
	_: Response,
	next: NextFunction,
): Promise<void> => {
	try {
		const authenticationToken = getAuthTokenFromRequest(req);
		if (authenticationToken === "") {
			throw new createError.Unauthorized("Invalid Authorization header format");
		}
		try {
			const { subject, email } =
				await getSubjectAndEmailFromUserAuthToken(authenticationToken);
			setAuth(req, { kind: "user", email, subject });
			next();
		} catch (err) {
			if (
				isObjectWithStatusCode(err) &&
				err.statusCode === HTTP_STATUS.CLIENT_ERROR.UNAUTHORIZED.valueOf()
			) {
				const { subject, email } =
					await getSubjectAndEmailFromAdminAuthToken(authenticationToken);
				setAuth(req, { kind: "admin", email, subject });
				next();
			} else {
				next(err);
			}
		}
	} catch (err) {
		next(err);
	}
};

const extractUserEmailFromAuthToken = async (
	req: Request<unknown, unknown, unknown>,
	_: Response,
	next: NextFunction,
): Promise<void> => {
	try {
		const authenticationToken = getAuthTokenFromRequest(req);
		if (authenticationToken !== "") {
			const email = await getOptionalValueFromAuthToken(
				authenticationToken,
				emailKey,
				[
					process.env["FUSIONAUTH_BACKEND_APPLICATION_ID"] ?? "",
					process.env["FUSIONAUTH_SFTP_APPLICATION_ID"] ?? "",
				],
			);
			if (email !== "") {
				setAuth(req, { kind: "user", email });
			}
		}
		next();
	} catch (err) {
		next(err);
	}
};

const extractUserIsAdminFromAuthToken = async (
	req: Request<unknown, unknown, unknown>,
	_: Response,
	next: NextFunction,
): Promise<void> => {
	try {
		const authenticationToken = getAuthTokenFromRequest(req);
		if (authenticationToken !== "") {
			const email = await getOptionalValueFromAuthToken(
				authenticationToken,
				emailKey,
				[process.env["FUSIONAUTH_ADMIN_APPLICATION_ID"] ?? ""],
			);
			if (email !== "") {
				setAuth(req, { kind: "admin", email });
			}
		}
		next();
	} catch (err) {
		next(err);
	}
};

const extractShareTokenFromHeaders = (
	req: Request<unknown, unknown, unknown>,
	__: Response,
	next: NextFunction,
): void => {
	setAuth(req, { shareToken: req.get("X-Permanent-Share-Token") });
	next();
};

const verifyUserOrAdminOrDelegatedCallAuthentication = async (
	req: Request<unknown, unknown, unknown>,
	res: Response,
	next: NextFunction,
): Promise<void> => {
	try {
		const secret = req.get("X-Permanent-Delegated-Call-Secret");
		if (secret !== undefined && secret !== "") {
			const expectedSecret = process.env["DELEGATED_CALL_SECRET"] ?? "";
			if (expectedSecret === "" || secret !== expectedSecret) {
				throw new createError.Unauthorized("Invalid delegated call secret");
			}
			setAuth(req, {
				kind: "user",
				email: req.get("X-Permanent-Delegated-Call-User-Email"),
				subject: req.get("X-Permanent-Delegated-Call-User-Subject"),
			});
			next();
		} else {
			await verifyUserOrAdminAuthentication(req, res, next);
		}
	} catch (err) {
		next(err);
	}
};

export {
	verifyUserAuthentication,
	verifyAdminAuthentication,
	verifyUserOrAdminAuthentication,
	verifyUserOrAdminOrDelegatedCallAuthentication,
	extractUserEmailFromAuthToken,
	extractUserIsAdminFromAuthToken,
	extractShareTokenFromHeaders,
};
