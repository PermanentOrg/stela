SELECT
  archive.archiveid AS "archiveId",
  archive.type,
  archive.archivenbr AS "archiveNbr",
  archive.thumburl200 AS "profileImage",
  profile_item.string1 AS "name",
  folder.thumburl500 AS "bannerImage"
FROM
  archive
INNER JOIN
  featured_archive
  ON archive.archiveid = featured_archive.archive_id
INNER JOIN
  profile_item
  ON archive.archiveid = profile_item.archiveid
INNER JOIN
  folder
  ON archive.archiveid = folder.archiveid
WHERE
  profile_item.fieldnameui = 'profile.basic'
  AND folder.type = 'type.folder.root.public'
  AND archive.public IS NOT NULL
  AND archive.public;
