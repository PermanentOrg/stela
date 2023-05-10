SELECT
  legacy_contact_id "legacyContactId",
  account_id "accountId",
  name,
  email,
  created_dt "createdDt",
  updated_dt "updatedDt"
FROM
  legacy_contact
WHERE
  account_id = (
    SELECT
      accountId
    FROM
      account
    WHERE
      primaryEmail = :primaryEmail
  );
