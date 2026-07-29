SELECT
  promoid AS id,
  sizeinmb AS "storageInMB",
  expiresdt AS "expirationTimestamp",
  remaininguses AS "remainingUses",
  status
FROM
  promo
WHERE
  code = :promoCode
FOR UPDATE
