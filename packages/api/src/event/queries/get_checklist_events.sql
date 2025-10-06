WITH account_events AS (
  SELECT event.*
  FROM
    event
  INNER JOIN
    account
    ON
      account.subject::uuid = event.actor_id
  WHERE
    account.primaryemail = :email
)

SELECT
  EXISTS(
    SELECT 1
    FROM
      account_events
    WHERE
      account_events.actor_type = 'user'
      AND account_events.entity = 'archive'
      AND account_events.action = 'create'
  ) AS "archiveCreated",
  EXISTS(
    SELECT 1
    FROM
      account_events
    WHERE
      account_events.actor_type = 'user'
      AND account_events.entity = 'account'
      AND account_events.action = 'submit_promo'
  ) AS "storageRedeemed",
  EXISTS(
    SELECT 1
    FROM
      account_events
    WHERE
      account_events.actor_type = 'user'
      AND account_events.entity = 'legacy_contact'
      AND account_events.action = 'create'
  ) AS "legacyContact",
  EXISTS(
    SELECT 1
    FROM
      account_events
    WHERE
      account_events.actor_type = 'user'
      AND account_events.entity = 'directive'
      AND account_events.action = 'create'
  ) AS "archiveSteward",
  EXISTS(
    SELECT 1
    FROM
      account_events
    WHERE
      account_events.actor_type = 'user'
      AND account_events.entity = 'profile_item'
      AND account_events.action = 'update'
  ) AS "archiveProfile",
  EXISTS(
    SELECT 1
    FROM
      account_events
    WHERE
      account_events.actor_type = 'user'
      AND account_events.entity = 'record'
      AND account_events.action = 'submit'
  ) AS "firstUpload",
  EXISTS(
    SELECT 1
    FROM
      account_events
    WHERE
      account_events.actor_type = 'user'
      AND (
        (
          account_events.entity = 'record'
          AND account_events.action = 'create'
          AND (account_events.body ->> 'record')::jsonb ->> 'publicDT'
          IS NOT NULL
        )
        OR
        (
          account_events.entity = 'record'
          AND account_events.action = 'move'
          AND (account_events.body ->> 'public')::boolean
        )
        OR
        (
          account_events.entity = 'record'
          AND account_events.action = 'copy'
          AND (account_events.body ->> 'public')::boolean
        )
        OR
        (
          account_events.entity = 'folder'
          AND account_events.action = 'move'
          AND (account_events.body ->> 'public')::boolean
          AND (account_events.body ->> 'hasRecords')::boolean
        )
        OR
        (
          account_events.entity = 'folder'
          AND account_events.action = 'copy'
          AND (account_events.body ->> 'public')::boolean
          AND (account_events.body ->> 'hasRecords')::boolean
        )
      )
  ) AS "publishContent";
