import createError from "http-errors";
import { fusionAuthClient } from "../fusionauth.js";
import {
	TwoFactorMethod,
	type SendEnableCodeRequest,
	type CreateTwoFactorMethodRequest,
	type SendDisableCodeRequest,
	type DisableTwoFactorRequest,
	type TwoFactorRequestResponse,
} from "./models.js";
import { db } from "../database.js";

export const getTwoFactorMethods = async (
	callerEmail: string,
): Promise<TwoFactorRequestResponse[]> => {
	const clientResponse =
		await fusionAuthClient.retrieveUserByEmail(callerEmail);

	if (!clientResponse.wasSuccessful()) {
		throw createError(
			parseInt(clientResponse.exception.code ?? "500", 10),
			clientResponse.exception.message ?? "Unknown error",
		);
	}
	if (clientResponse.response.user.twoFactor.methods.length > 0) {
		return clientResponse.response.user.twoFactor.methods.map(
			({ id, method, email, mobilePhone }) => ({
				methodId: id,
				method,
				value:
					method === TwoFactorMethod.Email.valueOf()
						? (email ?? "")
						: (mobilePhone ?? ""),
			}),
		);
	}

	return [];
};

export const sendEnableCode = async (
	callerEmail: string,
	requestBody: SendEnableCodeRequest,
): Promise<void> => {
	const fusionAuthUserIdResponse = await db.sql<{ subject: string }>(
		"idpuser.queries.get_subject_by_email",
		{
			email: callerEmail,
		},
	);

	if (fusionAuthUserIdResponse.rows[0] === undefined) {
		throw createError.NotFound("User not found");
	}

	const fusionAuthRequestBody: {
		userId: string;
		method: string;
		mobilePhone?: string;
		email?: string;
	} = {
		userId: fusionAuthUserIdResponse.rows[0].subject,
		method: requestBody.method,
	};

	if (requestBody.method === TwoFactorMethod.Email) {
		({ value: fusionAuthRequestBody.email } = requestBody);
	} else {
		({ value: fusionAuthRequestBody.mobilePhone } = requestBody);
	}

	const fusionAuthResponse =
		await fusionAuthClient.sendTwoFactorCodeForEnableDisable(
			fusionAuthRequestBody,
		);

	if (!fusionAuthResponse.wasSuccessful()) {
		throw createError(
			parseInt(fusionAuthResponse.exception.code ?? "500", 10),
			fusionAuthResponse.exception.message ?? "Unknown error",
		);
	}
};

export const addTwoFactorMethod = async (
	callerEmail: string,
	requestBody: CreateTwoFactorMethodRequest,
): Promise<void> => {
	const fusionAuthUserIdResponse = await db.sql<{ subject: string }>(
		"idpuser.queries.get_subject_by_email",
		{
			email: callerEmail,
		},
	);
	if (fusionAuthUserIdResponse.rows[0] === undefined) {
		throw createError.NotFound("User not found");
	}
	const fusionAuthRequestBody: {
		code: string;
		method: string;
		email?: string;
		mobilePhone?: string;
	} = {
		code: requestBody.code,
		method: requestBody.method,
	};
	if (requestBody.method === TwoFactorMethod.Email) {
		({ value: fusionAuthRequestBody.email } = requestBody);
	} else {
		({ value: fusionAuthRequestBody.mobilePhone } = requestBody);
	}
	const fusionAuthResponse = await fusionAuthClient.enableTwoFactor(
		fusionAuthUserIdResponse.rows[0].subject,
		fusionAuthRequestBody,
	);
	if (!fusionAuthResponse.wasSuccessful()) {
		throw createError(
			parseInt(fusionAuthResponse.exception.code ?? "500", 10),
			fusionAuthResponse.exception.message ?? "Unknown error",
		);
	}
};

export const sendDisableCode = async (
	callerEmail: string,
	requestBody: SendDisableCodeRequest,
): Promise<void> => {
	const fusionAuthUserIdResponse = await db.sql<{ subject: string }>(
		"idpuser.queries.get_subject_by_email",
		{
			email: callerEmail,
		},
	);

	if (fusionAuthUserIdResponse.rows[0] === undefined) {
		throw createError.NotFound("User not found");
	}

	const fusionAuthResponse =
		await fusionAuthClient.sendTwoFactorCodeForEnableDisable({
			userId: fusionAuthUserIdResponse.rows[0].subject,
			methodId: requestBody.methodId,
		});

	if (!fusionAuthResponse.wasSuccessful()) {
		throw createError(
			parseInt(fusionAuthResponse.exception.code ?? "500", 10),
			fusionAuthResponse.exception.message ?? "Unknown error",
		);
	}
};

export const removeTwoFactorMethod = async (
	callerEmail: string,
	requestBody: DisableTwoFactorRequest,
): Promise<void> => {
	const fusionAuthUserIdResponse = await db.sql<{ subject: string }>(
		"idpuser.queries.get_subject_by_email",
		{
			email: callerEmail,
		},
	);
	if (fusionAuthUserIdResponse.rows[0] === undefined) {
		throw createError.NotFound("User not found");
	}

	const fusionAuthResponse = await fusionAuthClient.disableTwoFactor(
		fusionAuthUserIdResponse.rows[0].subject,
		requestBody.methodId,
		requestBody.code,
	);
	if (!fusionAuthResponse.wasSuccessful()) {
		throw createError(
			parseInt(fusionAuthResponse.exception.code ?? "500", 10),
			fusionAuthResponse.exception.message ?? "Unknown error",
		);
	}
};
