INSERT INTO promo (
  code,
  sizeinmb,
  expiresdt,
  remaininguses,
  status,
  type,
  createddt,
  updateddt
) VALUES (
  :code,
  :storageInMB,
  :expirationTimestamp,
  :totalUses,
  'status.promo.valid',
  'type.generic.ok',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
