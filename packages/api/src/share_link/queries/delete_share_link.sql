DELETE FROM
shareby_url
USING
  account
WHERE
  account.accountid = shareby_url.byaccountid
  AND account.primaryemail = :email
  AND shareby_urlid = :shareLinkId
RETURNING shareby_urlid AS id;
