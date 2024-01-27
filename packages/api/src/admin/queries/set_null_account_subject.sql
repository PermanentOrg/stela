UPDATE
account
SET
  subject = :subject
WHERE
  primaryemail = :email
  AND status = 'status.auth.ok'
  AND subject IS NULL
RETURNING
accountid AS "accountId";
