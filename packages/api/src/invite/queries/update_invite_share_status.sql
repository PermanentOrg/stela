UPDATE invite_share
SET status = :status, updateddt = CURRENT_TIMESTAMP
WHERE invite_shareid = ANY(:inviteShareIds::bigint[]);
