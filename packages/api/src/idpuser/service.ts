import { fusionAuthClient } from "../fusionauth";
import type { TwoFactorRequestResponse } from "./models";

export const getTwoFactorMethods = async (
  emailFromAuthToken: string
): Promise<TwoFactorRequestResponse[]> => {
  try {
    const clientResponse = await fusionAuthClient.retrieveUserByEmail(
      emailFromAuthToken
    );

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
  } catch (error) {
    throw error;
  }
};
