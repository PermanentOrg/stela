UPDATE invite
SET status = :status, updateddt = CURRENT_TIMESTAMP
WHERE inviteid = ANY(:inviteIds::bigint[]);
