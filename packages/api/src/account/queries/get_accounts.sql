SELECT
  account.accountid::text AS id,
  account.primaryemail AS "primaryEmailAddress",
  account.emailstatus AS "emailStatus",
  account.primaryphone AS "primaryPhoneNumber",
  account.phonestatus AS "phoneStatus",
  account.fullname AS "fullName",
  account.defaultarchiveid::text AS "defaultArchiveId",
  account.address AS "addressLineOne",
  account.address2 AS "addressLineTwo",
  account.city,
  account.state,
  account.zip,
  account.country,
  account.hidechecklist AS "hideChecklist",
  account.allowsftpdeletion AS "allowSftpDeletion",
  account.notificationpreferences AS "notificationPreferences",
  account.status,
  account.type,
  CEILING((
    SELECT COUNT(account_for_count.accountid) FROM account AS account_for_count
    WHERE
      (
        :filterByIds = TRUE
        AND account_for_count.accountid::text = ANY(:accountIds::text[])
      )
      OR (
        :filterByIds = FALSE
        AND LOWER(account_for_count.primaryemail) = ANY(:accountEmails::text[])
      )
  ) / :pageSize) AS "totalPages"
FROM
  account
WHERE
  ((
    :filterByIds = TRUE
    AND account.accountid::text = ANY(:accountIds::text[])
  )
  OR (
    :filterByIds = FALSE
    AND LOWER(account.primaryemail) = ANY(:accountEmails::text[])
  ))
  AND account.accountid > COALESCE(:cursor, 0)
  AND account.status != 'status.generic.deleted'
ORDER BY account.accountid ASC
LIMIT :pageSize;
