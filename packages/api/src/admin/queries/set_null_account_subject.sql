UPDATE
account
SET
  subject = :subject
WHERE
  LOWER(primaryemail) = LOWER(:email)
  AND status = 'status.auth.ok'
  AND subject IS NULL
RETURNING
accountid AS "accountId";
