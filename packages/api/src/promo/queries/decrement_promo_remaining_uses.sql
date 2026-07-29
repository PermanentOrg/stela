UPDATE
  promo
SET
  remaininguses = remaininguses - 1,
  updateddt = CURRENT_TIMESTAMP
WHERE
  promoid = :promoId
  AND remaininguses > 0
RETURNING
  promoid AS id
