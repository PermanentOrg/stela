INSERT INTO account_space (
    account_spaceid,
    accountid,
    spaceleft,
    spacetotal,
    fileleft,
    filetotal,
    status,
    type,
    createddt,
    updateddt
)
VALUES
    (1, 1, 1073741824, 1073741824, 100, 100, 'status.generic.ok', 'type.account_space.standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (2, 2, 1073741824, 1073741824, 100, 100, 'status.generic.ok', 'type.account_space.standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (3, 3, 1073741824, 1073741824, 100, 100, 'status.generic.ok', 'type.account_space.standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;
