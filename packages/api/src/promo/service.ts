import createError from "http-errors";
import { logger } from "@stela/logger";
import { db } from "../database";
import type { CreatePromoRequest } from "./models";

export const createPromo = async (
  promoData: CreatePromoRequest
): Promise<void> => {
  await db
    .sql("promo.queries.create_promo", {
      code: promoData.code,
      storageInMB: promoData.storageInMB,
      expirationTimestamp: promoData.expirationTimestamp,
      totalUses: promoData.totalUses,
    })
    .catch((err) => {
      logger.error(err);
      throw new createError.InternalServerError("Failed to create promo");
    });
};
