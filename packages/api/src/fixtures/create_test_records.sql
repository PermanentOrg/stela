INSERT INTO 
  record (recordId, archiveId, publicDt, displayName, uploadAccountId, uploadPayerAccountId, uploadFilename, status, type)
VALUES
  (1, 1, '2023-06-21', 'Public File', 2, 2, 'public_file.jpg', 'status.generic.ok', 'type.record.image'),
  (2, 1, NULL, 'Private File', 2, 2, 'private_file.jpg', 'status.generic.ok', 'type.record.image'),
  (3, 1, CURRENT_TIMESTAMP + '1 day'::interval, 'Future Public File', 2, 2, 'future_public_file.jpg', 'status.generic.ok', 'type.record.image'),
  (4, 1, '2023-06-21', 'Deleted File', 2, 2, 'public_file.jpg', 'status.generic.deleted', 'type.record.image'),
  (5, 2, '2023-06-21', 'Public File', 3, 3, 'public_file.jpg', 'status.generic.ok', 'type.record.image');
