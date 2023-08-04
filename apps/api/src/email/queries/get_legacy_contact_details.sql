SELECT
  legacy_contact.name "legacyContactName",
  legacy_contact.email "legacyContactEmail",
  account.fullName "accountName"
FROM
  legacy_contact
JOIN
  account
  ON legacy_contact.account_id = account.accountId
WHERE
  legacy_contact.legacy_contact_id = :legacyContactId
