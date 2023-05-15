UPDATE
  legacy_contact
SET
  name = COALESCE(:name, name),
  email = COALESCE(:email, email),
  updated_dt = CURRENT_TIMESTAMP
WHERE
  legacy_contact_id = :legacyContactId
  AND account_id = (
    SELECT
      accountId
    FROM
      account
    WHERE
      primaryEmail = :primaryEmail
  )
RETURNING
  legacy_contact_id "legacyContactId",
  name,
  email,
  created_dt "createdDt",
  updated_dt "updatedDt";
