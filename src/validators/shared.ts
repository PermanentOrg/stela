import Joi from "joi";

export const validateBodyFromAuthentication = (
  data: unknown
): data is { emailFromAuthToken: string } => {
  const validation = Joi.object()
    .keys({ emailFromAuthToken: Joi.string().email().required() })
    .validate(data);
  if (validation.error) {
    throw validation.error;
  }
  return true;
};
