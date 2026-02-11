UPDATE account_space
SET
    spaceleft = spaceleft + :storageAmountInBytes,
    spacetotal = spacetotal + :storageAmountInBytes,
    updateddt = CURRENT_TIMESTAMP
WHERE accountid = :accountId
RETURNING
    spaceleft AS "spaceLeft",
    spacetotal AS "spaceTotal";
