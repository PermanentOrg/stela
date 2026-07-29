SELECT
  account.accountid AS "accountId",
  account_promo.account_promoid AS "existingClaimId"
FROM
  account
LEFT JOIN
  account_promo
  ON
    account.accountid = account_promo.accountid
    AND account_promo.promoid = :promoId
WHERE
  LOWER(account.primaryemail) = :email
