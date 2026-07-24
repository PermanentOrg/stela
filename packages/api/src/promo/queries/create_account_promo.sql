INSERT INTO account_promo (
  accountid,
  promoid,
  status,
  type,
  createddt,
  updateddt
)
VALUES (
  :accountId,
  :promoId,
  'status.generic.ok',
  'type.generic.placeholder',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
