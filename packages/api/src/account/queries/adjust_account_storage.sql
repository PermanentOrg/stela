WITH to_account_space AS (
  UPDATE
    account_space
  SET
    spaceleft = spaceleft + :storageAmountInBytes,
    spacetotal = spacetotal + :storageAmountInBytes,
    updateddt = CURRENT_TIMESTAMP
  WHERE
    account_space.accountid = :accountId
  RETURNING
    accountid,
    spacetotal,
    spaceleft,
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
  'type.billing.transfer.admin_adjustment' AS type,
  :storageAmountInBytes,
  0 AS filedelta,
  0 AS fromaccountid,
  0 AS fromspacebefore,
  0 AS fromspaceleft,
  0 AS fromspacetotal,
  0 AS fromfilebefore,
  0 AS fromfileleft,
  0 AS fromfiletotal,
  accountid,
  spacetotal - :storageAmountInBytes,
  -- toSpaceLeft and toSpaceTotal are always equal;
  -- one should eventually be dropped
  -- or toSpaceLeft should be updated to actually track space remaining
  -- but for the time being they must both
  -- be maintained for backward compatibility
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
  to_account_space
RETURNING
  tospacetotal AS "storageTotalInBytes",
  spacedelta AS "adjustmentSizeInBytes",
  createddt AS "createdAt";
