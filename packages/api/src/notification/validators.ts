import Joi from "joi";

export function validateMyNotificationsParams(data: unknown): asserts data is {
  archiveId: string;
  lastNotificationId: string;
} {
  const validation = Joi.object()
    .keys({
      archiveId: Joi.number().integer().required(),
      lastNotificationId: Joi.number().integer().required(),
    })
    .validate(data);
  if (validation.error) {
    throw validation.error;
  }
}
