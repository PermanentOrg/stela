INSERT INTO
profile_item (
  profile_itemid,
  archiveid,
  fieldnameui,
  string1,
  string2,
  day1,
  publicdt,
  status,
  type
)
VALUES
(
  101,
  101,
  'profile.basic',
  'Harriet Tubman Collection',
  NULL,
  NULL,
  NULL,
  'status.generic.ok',
  'type.profile_item.basic'
),
(
  102,
  102,
  'profile.basic',
  'Riverside Historical Society',
  NULL,
  NULL,
  NULL,
  'status.generic.ok',
  'type.profile_item.basic'
),
(
  103,
  103,
  'profile.basic',
  'Harriet Private Papers',
  NULL,
  NULL,
  NULL,
  'status.generic.ok',
  'type.profile_item.basic'
),
(
  104,
  104,
  'profile.basic',
  'Harriet Deleted Archive',
  NULL,
  NULL,
  NULL,
  'status.generic.ok',
  'type.profile_item.basic'
),
(
  105,
  105,
  'profile.basic',
  'Bulk Ledger Archive',
  NULL,
  NULL,
  NULL,
  'status.generic.ok',
  'type.profile_item.basic'
),
(
  201,
  102,
  'profile.milestone',
  'Founded by Harriet Jones',
  'The society began meeting',
  '1901-05-01',
  '2023-01-01',
  'status.generic.ok',
  'type.profile_item.milestone'
),
(
  202,
  102,
  'profile.milestone',
  'Harriet private milestone',
  NULL,
  NULL,
  NULL,
  'status.generic.ok',
  'type.profile_item.milestone'
),
(
  203,
  102,
  'profile.milestone',
  'Harriet future milestone',
  NULL,
  NULL,
  CURRENT_TIMESTAMP + '1 day'::INTERVAL,
  'status.generic.ok',
  'type.profile_item.milestone'
),
(
  204,
  102,
  'profile.milestone',
  'Harriet deleted milestone',
  NULL,
  NULL,
  '2023-01-01',
  'status.generic.deleted',
  'type.profile_item.milestone'
),
(
  205,
  101,
  'profile.milestone',
  'Early life',
  'Born Araminta Ross',
  '1822-03-01',
  '2023-01-01',
  'status.generic.ok',
  'type.profile_item.milestone'
);
