import createError from "http-errors";
import { fusionAuthClient } from "../fusionauth";
import {
  TwoFactorMethod,
  type SendEnableCodeRequest,
  type CreateTwoFactorMethodRequest,
  type SendDisableCodeRequest,
  type TwoFactorRequestResponse,
} from "./models";
import { db } from "../database";

export const getTwoFactorMethods = async (
  emailFromAuthToken: string
): Promise<TwoFactorRequestResponse[]> => {
  const clientResponse = await fusionAuthClient.retrieveUserByEmail(
    emailFromAuthToken
  );

  if (!clientResponse.wasSuccessful()) {
    throw createError(
      parseInt(clientResponse.exception.code ?? "500", 10),
      clientResponse.exception.message ?? "Unknown error"
    );
  }
  if (clientResponse.response.user.twoFactor.methods.length) {
    return clientResponse.response.user.twoFactor.methods.map(
      ({ id, method, email, mobilePhone }) => ({
        methodId: id,
        method,
        value: email || mobilePhone,
      })
    );
  }

  return [];
};

export const sendEnableCode = async (
  requestBody: SendEnableCodeRequest
): Promise<void> => {
  const fusionAuthUserIdResponse = await db.sql<{ subject: string }>(
    "idpuser.queries.get_subject_by_email",
    {
      email: requestBody.emailFromAuthToken,
    }
  );

  if (!fusionAuthUserIdResponse.rows[0]) {
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
    fusionAuthRequestBody.email = requestBody.value;
  } else {
    fusionAuthRequestBody.mobilePhone = requestBody.value;
  }

  const fusionAuthResponse =
    await fusionAuthClient.sendTwoFactorCodeForEnableDisable(
      fusionAuthRequestBody
    );

  if (!fusionAuthResponse.wasSuccessful()) {
    throw createError(
      parseInt(fusionAuthResponse.exception.code ?? "500", 10),
      fusionAuthResponse.exception.message ?? "Unknown error"
    );
  }
};

export const addTwoFactorMethod = async (
  requestBody: CreateTwoFactorMethodRequest
): Promise<void> => {
  const fusionAuthUserIdResponse = await db.sql<{ subject: string }>(
    "idpuser.queries.get_subject_by_email",
    {
      email: requestBody.emailFromAuthToken,
    }
  );
  if (!fusionAuthUserIdResponse.rows[0]) {
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
    fusionAuthRequestBody.email = requestBody.value;
  } else {
    fusionAuthRequestBody.mobilePhone = requestBody.value;
  }
  const fusionAuthResponse = await fusionAuthClient.enableTwoFactor(
    fusionAuthUserIdResponse.rows[0].subject,
    fusionAuthRequestBody
  );
  if (!fusionAuthResponse.wasSuccessful()) {
    throw createError(
      parseInt(fusionAuthResponse.exception.code ?? "500", 10),
      fusionAuthResponse.exception.message ?? "Unknown error"
    );
  }
};

export const sendDisableCode = async (
  requestBody: SendDisableCodeRequest
): Promise<void> => {
  const fusionAuthUserIdResponse = await db.sql<{ subject: string }>(
    "idpuser.queries.get_subject_by_email",
    {
      email: requestBody.emailFromAuthToken,
    }
  );

  if (!fusionAuthUserIdResponse.rows[0]) {
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
      fusionAuthResponse.exception.message ?? "Unknown error"
    );
  }
};
