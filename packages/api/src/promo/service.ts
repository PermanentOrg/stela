import createError from "http-errors";
import { logger } from "@stela/logger";
import { db } from "../database.js";
import { KB } from "../constants.js";
import type {
	AccountPromoCheckRow,
	ClaimPromoRequest,
	ClaimPromoResponse,
	CreatePromoRequest,
	Promo,
	PromoByCodeRow,
	PromoRow,
} from "./models.js";

export const claimPromo = async (
	data: ClaimPromoRequest,
): Promise<ClaimPromoResponse> =>
	await db.transaction(async (transactionDb) => {
		const promoResult = await transactionDb
			.sql<PromoByCodeRow>("promo.queries.get_promo_by_code", {
				promoCode: data.promoCode,
			})
			.catch((err: unknown) => {
				logger.error(err);
				throw new createError.InternalServerError(
					"Failed to look up promo code",
				);
			});

		const {
			rows: [promo],
		} = promoResult;
		if (
			promo?.status !== "status.promo.valid" ||
			promo.expirationTimestamp <= new Date() ||
			+promo.remainingUses <= 0
		) {
			throw new createError.BadRequest("Invalid promo code");
		}

		const accountCheckResult = await transactionDb
			.sql<AccountPromoCheckRow>("promo.queries.check_account_promo", {
				email: data.emailFromAuthToken.toLowerCase(),
				promoId: promo.id,
			})
			.catch((err: unknown) => {
				logger.error(err);
				throw new createError.InternalServerError(
					"Failed to check promo claim status",
				);
			});

		const {
			rows: [accountCheck],
		} = accountCheckResult;
		if (accountCheck === undefined) {
			throw new createError.NotFound("Account not found");
		}
		if (accountCheck.existingClaimId !== null) {
			throw new createError.BadRequest(
				"Promo code has already been claimed by this account",
			);
		}

		const decrementResult = await transactionDb
			.sql("promo.queries.decrement_promo_remaining_uses", {
				promoId: promo.id,
			})
			.catch((err: unknown) => {
				logger.error(err);
				throw new createError.InternalServerError("Failed to claim promo code");
			});

		if (decrementResult.rows.length === 0) {
			throw new createError.BadRequest("Invalid promo code");
		}

		await transactionDb
			.sql("promo.queries.create_account_promo", {
				accountId: accountCheck.accountId,
				promoId: promo.id,
			})
			.catch((err: unknown) => {
				logger.error(err);
				throw new createError.InternalServerError(
					"Failed to record promo claim",
				);
			});

		const adjustmentResult = await transactionDb
			.sql("storage.queries.adjust_account_storage", {
				accountId: accountCheck.accountId,
				storageAmountInBytes: +promo.storageInMB * KB * KB,
				ledgerType: "type.billing.transfer.promo",
			})
			.catch((err: unknown) => {
				logger.error(err);
				throw new createError.InternalServerError(
					"Failed to apply promo storage",
				);
			});

		if (adjustmentResult.rows.length === 0) {
			logger.error(
				"Storage update query in claimPromo returned 0 rows, meaning no update occurred",
			);
			throw new createError.InternalServerError(
				"Failed to apply promo storage",
			);
		}

		return { storageGrantInGb: +promo.storageInMB / KB };
	});

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
