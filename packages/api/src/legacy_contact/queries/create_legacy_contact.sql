INSERT INTO
legacy_contact (account_id, name, email)
VALUES (
  (
    SELECT accountid
    FROM
      account
    WHERE
      primaryemail = :accountEmail
  ),
  :name,
  :email
)
RETURNING
  legacy_contact_id AS "legacyContactId",
  account_id AS "accountId",
  name,
  email,
  created_dt AS "createdDt",
  updated_dt AS "updatedDt";
