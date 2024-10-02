import Joi from "joi";

export const fieldsFromUserAuthentication = {
  emailFromAuthToken: Joi.string().email().required(),
  userSubjectFromAuthToken: Joi.string().uuid().required(),
};

export const fieldsFromAdminAuthentication = {
  emailFromAuthToken: Joi.string().email().required(),
  adminSubjectFromAuthToken: Joi.string().uuid().required(),
};

export const fieldsFromUserOrAdminAuthentication = Joi.object()
  .keys({
    userEmailFromAuthToken: Joi.string().email(),
    userSubjectFromAuthToken: Joi.string().uuid(),
    adminEmailFromAuthToken: Joi.string().email(),
    adminSubjectFromAuthToken: Joi.string().uuid(),
  })
  .xor("userEmailFromAuthToken", "adminEmailFromAuthToken")
  .xor("userSubjectFromAuthToken", "adminSubjectFromAuthToken")
  .nand("userEmailFromAuthToken", "adminSubjectFromAuthToken")
  .nand("adminEmailFromAuthToken", "userSubjectFromAuthToken");

export function validateBodyFromAuthentication(data: unknown): asserts data is {
  emailFromAuthToken: string;
  userSubjectFromAuthToken: string;
} {
  const validation = Joi.object()
    .keys(fieldsFromUserAuthentication)
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
