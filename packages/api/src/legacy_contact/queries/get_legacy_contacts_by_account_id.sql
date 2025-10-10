SELECT
  legacy_contact_id AS "legacyContactId",
  account_id AS "accountId",
  name,
  email,
  created_dt AS "createdDt",
  updated_dt AS "updatedDt"
FROM
  legacy_contact
WHERE
  account_id = (
    SELECT account.accountid
    FROM
      account
    WHERE
      account.primaryemail = :primaryEmail
  );
