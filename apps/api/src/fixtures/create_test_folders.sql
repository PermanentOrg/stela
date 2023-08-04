INSERT INTO 
  folder (folderId, archiveId, publicDt, displayName, status)
VALUES
  (1, 1, '2023-06-21', 'Public Folder', 'status.generic.ok'),
  (2, 1, NULL, 'Private Folder', 'status.generic.ok'),
  (3, 1, CURRENT_TIMESTAMP + '1 day'::interval, 'Future Public Folder', 'status.generic.ok'),
  (4, 1, '2023-06-21', 'Deleted Folder', 'status.generic.deleted'),
  (5, 2, '2023-06-21', 'Public Folder', 'status.generic.ok');
