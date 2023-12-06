SELECT
  archive.archiveId "archiveId",
  archive.type,
  archive.archiveNbr "archiveNbr",
  archive.thumburl200 "profileImage",
  profile_item.string1 "name",
  folder.thumburl500 "bannerImage"
FROM
  archive
JOIN
  featured_archive
  ON archive.archiveId = featured_archive.archive_id
JOIN
  profile_item
  ON archive.archiveId = profile_item.archiveId
JOIN
  folder
  ON archive.archiveId = folder.archiveId
WHERE
  profile_item.fieldNameUI = 'profile.basic'
  AND folder.type = 'type.folder.root.public'
  AND archive.public IS NOT NULL
  AND archive.public;
