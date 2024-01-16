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
    SELECT accountid
    FROM
      account
    WHERE
      primaryemail = :primaryEmail
  );
