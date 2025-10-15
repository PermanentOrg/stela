WITH original_legacy_contact AS (
  SELECT email
  FROM
    legacy_contact
  WHERE
    legacy_contact_id = :legacyContactId
)
UPDATE
  legacy_contact
SET
  name = COALESCE(:name, name),
  email = COALESCE(:email, email),
  updated_dt = CURRENT_TIMESTAMP
WHERE
  legacy_contact_id = :legacyContactId
  AND account_id = (
    SELECT accountid
    FROM
      account
    WHERE
      primaryemail = :primaryEmail
  )
RETURNING
  legacy_contact_id "legacyContactId",
  name,
  email,
  created_dt "createdDt",
  updated_dt "updatedDt",
  email != (SELECT email FROM original_legacy_contact) "emailChanged";
