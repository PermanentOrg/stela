WITH account_space_data AS (
    SELECT
        accountid,
        spaceleft,
        spacetotal,
        fileleft,
        filetotal
    FROM account_space
    WHERE accountid = :accountId
)
INSERT INTO ledger_financial (
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
    donationamount,
    status,
    createddt,
    updateddt
)
SELECT
    'type.billing.donation' AS type,
    :storageAmountInBytes AS spacedelta,
    0 AS filedelta,
    0 AS fromaccountid,
    0 AS fromspacebefore,
    0 AS fromspaceleft,
    0 AS fromspacetotal,
    0 AS fromfilebefore,
    0 AS fromfileleft,
    0 AS fromfiletotal,
    :accountId AS toaccountid,
    spacetotal - :storageAmountInBytes AS tospacebefore,
    spaceleft AS tospaceleft,
    spacetotal AS tospacetotal,
    filetotal AS tofilebefore,
    fileleft AS tofileleft,
    filetotal AS tofiletotal,
    :donationAmountDollars AS donationamount,
    'status.generic.ok' AS status,
    CURRENT_TIMESTAMP AS createddt,
    CURRENT_TIMESTAMP AS updateddt
FROM account_space_data
RETURNING ledger_financialid AS "ledgerFinancialId";
