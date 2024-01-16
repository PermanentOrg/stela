WITH from_account AS (
  SELECT accountid
  FROM
    account
  WHERE
    primaryemail = :fromEmail
),

to_account AS (
  SELECT accountid
  FROM
    account
  WHERE
    primaryemail = ANY(:toEmails)
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

to_account_space AS (
  UPDATE
  account_space
  SET
    spaceleft = spaceleft + :storageAmountInBytes,
    spacetotal = spacetotal + :storageAmountInBytes,
    updateddt = CURRENT_TIMESTAMP
  FROM
    to_account
  WHERE
    account_space.accountid = to_account.accountid
  RETURNING
  to_account.accountid,
  spacetotal,
  filetotal
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
  'type.billing.gift.account_to_account' AS "type",
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
  accountid,
  spacetotal - :storageAmountInBytes,
  -- same backward compatibility reasoning as above applies here
  spacetotal AS tospaceleft,
  spacetotal AS tospacetotal,
  -- fileTotal wasn't changed, see above commment on backward
  -- compatibility for why toFileTotal = toFileLeft
  filetotal AS tofilebefore,
  filetotal AS tofileleft,
  filetotal AS tofiletotal,
  'status.generic.ok' AS status,
  CURRENT_TIMESTAMP AS createddt,
  CURRENT_TIMESTAMP AS updateddt
FROM
  to_account_space;
