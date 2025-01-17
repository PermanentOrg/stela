SELECT
  notification.notificationid AS notificationId,
  notification.toaccountid AS toAccountId,
  notification.toarchiveid AS toArchiveId,
  notification.fromaccountid AS fromAccountId,
  notification.fromarchiveid AS fromArchiveId,
  notification.folder_linkid AS folderLinkId,
  notification.message as message,
  notification.redirecturl as redirectUrl,
  notification.thumbarchivenbr as thumbnailArchiveNumber,
  notification.timessent as timesSent,
  notification.lastsentdt as lastSentDate,
  notification.emailkvp as email,
  notification.status as status,
  notification.type as type,
  notification.createddt as createdAt,
  notification.updateddt as updatedAt
FROM
  notification
JOIN account ON account.accountid = notification.toaccountid AND primaryemail = :accountEmail
WHERE notification.toarchiveid = :archiveId AND notification.notificationid >= :lastNotificationId
  AND notification.status = 'status.notification.new'
  AND notification.type IN ('type.notification.pa_response', 'type.notification.pa_share', 'type.notification.pa_transfer', 'type.notification.transfer_directive', 'type.notification.pa_access_change', 'type.notification.relationship_accept', 'type.notification.relationship_request', 'type.notification.share', 'type.notification.pa_response_non_transfer')
ORDER BY notification.notificationid;