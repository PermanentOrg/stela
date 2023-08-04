INSERT INTO
  legacy_contact (account_id, name, email)
VALUES (
  (
    SELECT
      accountId
    FROM
      account
    WHERE
      primaryEmail = :accountEmail
  ),
  :name,
  :email
)
RETURNING
  legacy_contact_id "legacyContactId",
  account_id "accountId",
  name,
  email,
  created_dt "createdDt",
  updated_dt "updatedDt";
