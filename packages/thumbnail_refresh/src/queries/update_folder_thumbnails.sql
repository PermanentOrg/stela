UPDATE
  folder
SET
  thumbnail256 = :thumbnail256,
  thumburl200 = :thumbnail200,
  thumburl500 = :thumbnail500,
  thumburl1000 = :thumbnail1000,
  thumburl2000 = :thumbnail2000,
  thumbdt = CURRENT_TIMESTAMP + interval '1 year',
  updateddt = CURRENT_TIMESTAMP
WHERE
  folderId = :folderId;
