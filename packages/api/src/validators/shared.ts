import Joi from "joi";

export function validateBodyFromAuthentication(
  data: unknown
): asserts data is {
  emailFromAuthToken: string;
  userSubjectFromAuthToken: string;
} {
  const validation = Joi.object()
    .keys({
      emailFromAuthToken: Joi.string().email().required(),
      userSubjectFromAuthToken: Joi.string().required(),
    })
    .validate(data);
  if (validation.error) {
    throw validation.error;
  }
}

export function validateOptionalEmailFromAuthentication(
  data: unknown
): asserts data is { emailFromAuthToken: string } {
  const validation = Joi.object()
    .keys({ emailFromAuthToken: Joi.string().email() })
    .validate(data);
  if (validation.error) {
    throw validation.error;
  }
}
