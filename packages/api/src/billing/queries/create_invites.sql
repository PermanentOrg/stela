WITH from_account AS (
  SELECT accountid
  FROM
    account
  WHERE primaryemail = :byAccountEmail
),

from_account_space AS (
  UPDATE
  account_space
  SET
    spaceleft = spaceleft - :storageAmountInBytes::bigint * :recipientCount,
    spacetotal = spacetotal - :storageAmountInBytes::bigint * :recipientCount,
    updateddt = CURRENT_TIMESTAMP
  WHERE
    accountid = (SELECT accountid FROM from_account)
  RETURNING
  spacetotal,
  filetotal
),

invitations AS (
  INSERT INTO
  invite (
    email,
    giftsizeinmb,
    status,
    type,
    expiresdt,
    token,
    byaccountid,
    timessent,
    createddt,
    updateddt
  )
  SELECT
    email,
    :storageAmountInBytes::bigint / (1024 * 1024),
    'status.invite.pending' AS status,
    'type.invite.invite_early_access' AS "type",
    CURRENT_TIMESTAMP + interval '30 days' AS expiresdt,
    token,
    (SELECT accountid FROM from_account),
    1 AS timessent,
    CURRENT_TIMESTAMP AS createddt,
    CURRENT_TIMESTAMP AS updateddt
  FROM
    UNNEST(:emails::text[], :tokens::text[]) AS "temp" (email, token)
  RETURNING
  inviteid
)
INSERT INTO
ledger_financial (
  type,
  spacedelta,
  filedelta,
  fromaccountid,
  fromspacebefore,
  fromspaceleft,
  fromspacetotal,
  fromfilebefore,
  fromfileleft,
  fromfiletotal,
  toaccountid,
  tospacebefore,
  tospaceleft,
  tospacetotal,
  tofilebefore,
  tofileleft,
  tofiletotal,
  status,
  createddt,
  updateddt
)
SELECT
  'type.billing.gift.purchase' AS "type",
  :storageAmountInBytes,
  0 AS filedelta,
  (SELECT accountid FROM from_account),
  (
    SELECT spacetotal
    FROM from_account_space
  ) + ROW_NUMBER() OVER () * :storageAmountInBytes::bigint,
  -- the following two fields get the same value for backward
  -- compatibility, in the long run one of them should be dropped
  -- (or potentially we should start tacking old and new values of
  -- spaceLeft here)
  (
    SELECT spacetotal
    FROM from_account_space
  ) + (ROW_NUMBER() OVER () - 1) * :storageAmountInBytes::bigint,
  (
    SELECT spacetotal
    FROM from_account_space
  ) + (ROW_NUMBER() OVER () - 1) * :storageAmountInBytes::bigint,
  -- fileTotal wasn't changed, see above commment on backward
  -- compatibility for why fromFileTotal = fromFileLeft
  (SELECT filetotal FROM from_account_space),
  (SELECT filetotal FROM from_account_space),
  (SELECT filetotal FROM from_account_space),
  0 AS toaccountid,
  0 AS tospacebefore,
  0 AS tospaceleft,
  0 AS tospacetotal,
  0 AS tofilebefore,
  0 AS tofileleft,
  0 AS tofiletotal,
  'status.generic.ok' AS status,
  CURRENT_TIMESTAMP AS createddt,
  CURRENT_TIMESTAMP AS updateddt
FROM
  invitations;
