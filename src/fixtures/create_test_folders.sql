INSERT INTO 
  folder (folderId, archiveId, publicDt, displayName, status, createdDt)
VALUES
  (1, 1, '2023-06-21', 'Public Folder', 'status.generic.ok', CURRENT_TIMESTAMP - '2 days'::interval),
  (2, 1, NULL, 'Private Folder', 'status.generic.ok', CURRENT_TIMESTAMP),
  (3, 1, CURRENT_TIMESTAMP + '1 day'::interval, 'Future Public Folder', 'status.generic.ok', CURRENT_TIMESTAMP),
  (4, 1, '2023-06-21', 'Deleted Folder', 'status.generic.deleted', CURRENT_TIMESTAMP),
  (5, 2, '2023-06-21', 'Public Folder', 'status.generic.ok', CURRENT_TIMESTAMP),
  (6, 1000, NULL, 'Future Folder', 'status.generic.ok', CURRENT_TIMESTAMP + '1 day'::interval);
