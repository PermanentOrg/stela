SELECT
  legacy_contact.name AS "legacyContactName",
  legacy_contact.email AS "legacyContactEmail",
  account.fullname AS "accountName"
FROM
  legacy_contact
INNER JOIN
  account
  ON legacy_contact.account_id = account.accountid
WHERE
  legacy_contact.legacy_contact_id = :legacyContactId
