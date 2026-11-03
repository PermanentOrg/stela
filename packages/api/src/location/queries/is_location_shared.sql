SELECT
  (
    (
      SELECT COUNT(*) FROM record
      WHERE locnid = :locationId::bigint
    )
    + (
      SELECT COUNT(*) FROM folder
      WHERE locnid = :locationId::bigint
    )
    + (
      SELECT COUNT(*) FROM profile_item
      WHERE
        locnid1 = :locationId::bigint
        OR locnid2 = :locationId::bigint
    )
  ) > 1 AS "isShared";
