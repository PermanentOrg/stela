SELECT
  promoid AS id,
  code,
  sizeinmb AS "storageInMB",
  expiresdt AS "expirationTimestamp",
  remaininguses AS "remainingUses",
  status,
  type,
  createddt AS "createdAt",
  updateddt AS "updatedAt"
FROM
  promo;
