import type { Request, Response, NextFunction } from "express";
import createError from "http-errors";
import { fusionAuthClient } from "../fusionauth";
import { isObjectWithStatusCode } from "./handleError";

const emailKey = "email";
const subjectKey = "sub";

const getValueFromAuthToken = async (
	authenticationToken: string,
	key: "email" | "sub",
	applicationId: string,
): Promise<string> => {
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
		typeof introspectionResponse.response[key] !== "string" ||
		introspectionResponse.response[key] === ""
	) {
		throw new createError.Unauthorized("Invalid token");
	}

	return introspectionResponse.response[key];
};

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
				if (isObjectWithStatusCode(err) && err.statusCode === 429) {
					throw err;
				}
				return null;
			}
		}),
	);

	const successfulIntrospectionResponse = introspectionResponses.find(
		(introspectionResponse) => introspectionResponse?.wasSuccessful(),
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
	if (
		!authorizationHeaderParts ||
		authorizationHeaderParts.length !== 2 ||
		authorizationHeaderParts[0] !== "Bearer"
	) {
		return "";
	}
	return authorizationHeaderParts[1] ?? "";
};

const verifyUserAuthentication = async (
	req: Request<
		unknown,
		unknown,
		{ emailFromAuthToken?: string; userSubjectFromAuthToken?: string }
	>,
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
			process.env["FUSIONAUTH_BACKEND_APPLICATION_ID"] ?? "",
		);
		req.body.emailFromAuthToken = email;
		req.body.userSubjectFromAuthToken = subject;
		next();
	} catch (err) {
		next(err);
	}
};

const verifyAdminAuthentication = async (
	req: Request<
		unknown,
		unknown,
		{ emailFromAuthToken?: string; adminSubjectFromAuthToken?: string }
	>,
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
		req.body.emailFromAuthToken = email;
		req.body.adminSubjectFromAuthToken = subject;
		next();
	} catch (err) {
		next(err);
	}
};

const verifyUserOrAdminAuthentication = async (
	req: Request<
		unknown,
		unknown,
		{
			userSubjectFromAuthToken?: string;
			adminSubjectFromAuthToken?: string;
			userEmailFromAuthToken?: string;
			adminEmailFromAuthToken?: string;
		}
	>,
	_: Response,
	next: NextFunction,
): Promise<void> => {
	try {
		const authenticationToken = getAuthTokenFromRequest(req);
		if (authenticationToken === "") {
			throw new createError.Unauthorized("Invalid Authorization header format");
		}
		try {
			const subject = await getValueFromAuthToken(
				authenticationToken,
				subjectKey,
				process.env["FUSIONAUTH_BACKEND_APPLICATION_ID"] ?? "",
			);
			const email = await getValueFromAuthToken(
				authenticationToken,
				emailKey,
				process.env["FUSIONAUTH_BACKEND_APPLICATION_ID"] ?? "",
			);
			req.body.userSubjectFromAuthToken = subject;
			req.body.userEmailFromAuthToken = email;
			next();
		} catch (err) {
			try {
				const subject = await getValueFromAuthToken(
					authenticationToken,
					subjectKey,
					process.env["FUSIONAUTH_ADMIN_APPLICATION_ID"] ?? "",
				);
				const email = await getValueFromAuthToken(
					authenticationToken,
					emailKey,
					process.env["FUSIONAUTH_ADMIN_APPLICATION_ID"] ?? "",
				);
				req.body.adminSubjectFromAuthToken = subject;
				req.body.adminEmailFromAuthToken = email;
				next();
			} catch (innerErr) {
				next(innerErr);
			}
		}
	} catch (err) {
		next(err);
	}
};

const extractUserEmailFromAuthToken = async (
	req: Request<unknown, unknown, { emailFromAuthToken?: string }>,
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
				req.body.emailFromAuthToken = email;
			}
		}
		next();
	} catch (err) {
		next(err);
	}
};

const extractUserIsAdminFromAuthToken = async (
	req: Request<unknown, unknown, { admin?: boolean }>,
	_: Response,
	next: NextFunction,
): Promise<void> => {
	try {
		let email = "";
		const authenticationToken = getAuthTokenFromRequest(req);
		if (authenticationToken !== "") {
			email = await getOptionalValueFromAuthToken(
				authenticationToken,
				emailKey,
				[process.env["FUSIONAUTH_ADMIN_APPLICATION_ID"] ?? ""],
			);
		}
		req.body.admin = email !== "";
		next();
	} catch (err) {
		next(err);
	}
};

const extractShareTokenFromHeaders = (
	req: Request<
		unknown,
		unknown,
		{ emailFromAuthToken?: string; shareToken: string | undefined }
	>,
	__: Response,
	next: NextFunction,
): void => {
	req.body.shareToken = req.get("X-Permanent-Share-Token");
	next();
};

export {
	verifyUserAuthentication,
	verifyAdminAuthentication,
	verifyUserOrAdminAuthentication,
	extractUserEmailFromAuthToken,
	extractUserIsAdminFromAuthToken,
	extractShareTokenFromHeaders,
};
