import Joi from "joi";
import type { CreateShareLinkRequest } from "./models";
import { fieldsFromUserAuthentication } from "../validators";

export function validateCreateShareLinkRequest(
  data: unknown
): asserts data is CreateShareLinkRequest {
  const validation = Joi.object()
    .keys({
      ...fieldsFromUserAuthentication,
      itemId: Joi.string().required(),
      itemType: Joi.string().required().valid("record", "folder"),
      permissionsLevel: Joi.string()
        .when("accessRestrictions", {
          is: Joi.exist(),
          then: Joi.when("accessRestrictions", {
            is: "none",
            then: Joi.valid("viewer"),
            otherwise: Joi.valid(
              "viewer",
              "editor",
              "contributor",
              "manager",
              "owner"
            ),
          }),
          otherwise: Joi.valid("viewer"),
        })
        .optional(),
      accessRestrictions: Joi.string()
        .valid("none", "account", "approval")
        .optional(),
      maxUses: Joi.number()
        .integer()
        .min(1)
        .when("accessRestrictions", {
          is: Joi.exist(),
          then: Joi.when("accessRestrictions", {
            is: "none",
            then: Joi.forbidden(),
            otherwise: Joi.optional(),
          }),
          otherwise: Joi.forbidden(),
        }),
      expirationTimestamp: Joi.string().isoDate().optional(),
    })
    .validate(data);
  if (validation.error) {
    throw validation.error;
  }
}
