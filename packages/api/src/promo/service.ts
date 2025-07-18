import createError from "http-errors";
import { logger } from "@stela/logger";
import { db } from "../database";
import type { CreatePromoRequest, Promo, PromoRow } from "./models";

export const createPromo = async (
	promoData: CreatePromoRequest,
): Promise<void> => {
	await db
		.sql("promo.queries.create_promo", {
			code: promoData.code,
			storageInMB: promoData.storageInMB,
			expirationTimestamp: promoData.expirationTimestamp,
			totalUses: promoData.totalUses,
		})
		.catch((err: unknown) => {
			logger.error(err);
			throw new createError.InternalServerError("Failed to create promo");
		});
};

export const getPromos = async (): Promise<Promo[]> => {
	const result = await db
		.sql<PromoRow>("promo.queries.get_promos")
		.catch((err: unknown) => {
			logger.error(err);
			throw new createError.InternalServerError("Failed to retrieve promos");
		});
	const promos = result.rows.map<Promo>(
		(row: PromoRow): Promo => ({
			...row,
			storageInMB: +row.storageInMB,
			remainingUses: +row.remainingUses,
		}),
	);

	return promos;
};
