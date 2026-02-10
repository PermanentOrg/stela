INSERT INTO
folder_link (
    folder_linkid,
    recordid,
    folderid,
    parentfolderid,
    parentfolder_linkid,
    archiveid,
    "position",
    accessrole,
    status,
    type
)
VALUES
(
    100, NULL, 10, NULL, NULL, 1, 1,
    'access.role.owner', 'status.generic.ok', 'type.folder_link.private'
),
(
    200, NULL, 20, 10, 100, 1, 1,
    'access.role.owner', 'status.generic.ok', 'type.folder_link.private'
),
(
    300, NULL, 30, 20, 200, 1, 1,
    'access.role.owner', 'status.generic.ok', 'type.folder_link.private'
),
(
    400, 1, NULL, 30, 300, 1, 1,
    'access.role.owner', 'status.generic.ok', 'type.folder_link.private'
);
