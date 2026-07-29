WITH aggregated_memberships AS (
  SELECT
    account_archive.accountid,
    ARRAY_AGG(
      JSONB_BUILD_OBJECT(
        'id', account_archive.account_archiveid::text,
        'accountId', account_archive.accountid::text,
        'accessRole',
        CASE account_archive.accessrole
          WHEN 'access.role.owner' THEN 'owner'
          WHEN 'access.role.manager' THEN 'manager'
          WHEN 'access.role.curator' THEN 'curator'
          WHEN 'access.role.editor' THEN 'editor'
          WHEN 'access.role.contributor' THEN 'contributor'
          WHEN 'access.role.viewer' THEN 'viewer'
        END,
        'status', CASE account_archive.status
          WHEN 'status.generic.ok' THEN 'ok'
          WHEN 'status.generic.pending' THEN 'pending'
          WHEN 'status.generic.deleted' THEN 'deleted'
        END,
        'archive', JSONB_BUILD_OBJECT(
          'id', archive.archiveid::text,
          'name', basic_profile_item.string1,
          'thumbnailUrls', JSONB_BUILD_OBJECT(
            'width200', archive.thumburl200,
            'width500', archive.thumburl500,
            'width1000', archive.thumburl1000,
            'width2000', archive.thumburl2000
          )
        )
      )
    ) AS memberships
  FROM
    account_archive
  INNER JOIN
    archive
    ON
      account_archive.archiveid = archive.archiveid
      AND archive.status != 'status.generic.deleted'
  LEFT JOIN
    profile_item AS basic_profile_item
    ON
      archive.archiveid = basic_profile_item.archiveid
      AND basic_profile_item.fieldnameui = 'profile.basic'
      AND basic_profile_item.status != 'status.generic.deleted'
  WHERE
    account_archive.status = 'status.generic.ok'
    AND account_archive.accountid IN (
      SELECT account.accountid
      FROM account
      WHERE
        ((
          :filterByIds = true
          AND account.accountid::text = ANY(:accountIds::text[])
        )
        OR (
          :filterByIds = false
          AND LOWER(account.primaryemail) = ANY(:accountEmails::text[])
        ))
        AND account.status = 'status.auth.ok'
        AND account.accountid > COALESCE(:cursor, 0)
    )
  GROUP BY
    account_archive.accountid
)
SELECT
  account.accountid::text AS id,
  account.fullname AS "fullName",
  account.defaultarchiveid::text AS "defaultArchiveId",
  account.createddt AS "createdAt",
  account.updateddt AS "updatedAt",
  JSONB_BUILD_OBJECT(
    'address', account.primaryemail,
    'verified', COALESCE(account.emailstatus = 'status.auth.ok', false)
  ) AS "primaryEmail",
  CASE
    WHEN account.primaryphone IS NOT null
      THEN JSONB_BUILD_OBJECT(
        'number', account.primaryphone,
        'verified', COALESCE(account.phonestatus = 'status.auth.ok', false)
      )
  END AS "primaryPhone",
  JSONB_BUILD_OBJECT(
    'lineOne', account.address,
    'lineTwo', account.address2,
    'city', account.city,
    'state', account.state,
    'zip', account.zip,
    'country', account.country
  ) AS address,
  JSONB_BUILD_OBJECT(
    'hideChecklist', account.hidechecklist,
    'allowSftpDeletion', account.allowsftpdeletion,
    'notificationsEnabled', JSONB_STRIP_NULLS(JSONB_BUILD_OBJECT(
      'sms', account.notificationpreferences -> 'textPreference',
      'email', account.notificationpreferences -> 'emailPreference',
      'inApp', account.notificationpreferences -> 'inAppPreference'
    ))
  ) AS settings,
  CASE account.status
    WHEN 'status.auth.ok' THEN 'ok'
    WHEN 'status.generic.invited' THEN 'invited'
  END AS status,
  CASE account.type
    WHEN 'type.account.standard' THEN 'standard'
    WHEN 'type.account.test' THEN 'test'
  END AS type,
  COALESCE(
    aggregated_memberships.memberships,
    ARRAY[]::jsonb[]
  ) AS "archiveMemberships",
  CEILING((
    SELECT COUNT(account_for_count.accountid) FROM account AS account_for_count
    WHERE
      ((
        :filterByIds = true
        AND account_for_count.accountid::text = ANY(:accountIds::text[])
      )
      OR (
        :filterByIds = false
        AND LOWER(account_for_count.primaryemail) = ANY(:accountEmails::text[])
      ))
      AND account_for_count.status = 'status.auth.ok'
  ) / :pageSize) AS "totalPages"
FROM
  account
LEFT JOIN
  aggregated_memberships ON account.accountid = aggregated_memberships.accountid
WHERE
  ((
    :filterByIds = true
    AND account.accountid::text = ANY(:accountIds::text[])
  )
  OR (
    :filterByIds = false
    AND LOWER(account.primaryemail) = ANY(:accountEmails::text[])
  ))
  AND account.accountid > COALESCE(:cursor, 0)
  AND account.status = 'status.auth.ok'
ORDER BY account.accountid ASC
LIMIT :pageSize;
