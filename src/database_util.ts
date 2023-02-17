import { TinyPgError } from "tinypg";

const invalidEnumErrorPrefix = "invalid input value for enum";

export const isInvalidEnumError = (err: unknown): err is TinyPgError =>
  err instanceof TinyPgError && err.message.startsWith(invalidEnumErrorPrefix);

export const getInvalidValueFromInvalidEnumMessage = (
  message: string
): string =>
  // These error messages take the form:
  // invalid input value for enum <SPECIFIC_ENUM>: "<OFFENDING_VALUE>"
  (message.split(": ")[1] ?? "").replace('"', "");
