SELECT shareby_url.shareby_urlid AS "id"
FROM
  shareby_url
INNER JOIN
  account ON shareby_url.byaccountid = account.accountid
INNER JOIN
  folder_link ON shareby_url.folder_linkid = folder_link.folder_linkid
WHERE
  folder_link.folderid = :folderId
  AND account.primaryemail = :email;
