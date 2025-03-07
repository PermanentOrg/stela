INSERT INTO
shareby_url (
  folder_linkid,
  urltoken,
  shareurl,
  byaccountid,
  byarchiveid,
  unrestricted,
  expiresdt
)
VALUES (
  3,
  '2849c711-e72e-41b5-bb49-b0b86a052668',
  'https://local.permanent.org/share/2849c711-e72e-41b5-bb49-b0b86a052668',
  2,
  1,
  true,
  null
),
(
  3,
  '17e86544-30b3-4039-9f50-56681bcf3085',
  'https://local.permanent.org/share/17e86544-30b3-4039-9f50-56681bcf3085',
  2,
  1,
  false,
  null
),
(
  3,
  '1753eb10-ca46-4964-890b-0d4cdca1a783',
  'https://local.permanent.org/share/1753eb10-ca46-4964-890b-0d4cdca1a783',
  2,
  1,
  true,
  CURRENT_TIMESTAMP - INTERVAL '1 day'
),
(
  16,
  '5b23ec69-3e37-4b83-9147-acf55d4654b5',
  'https://local.permanent.org/share/5b23ec69-3e37-4b83-9147-acf55d4654b5',
  2,
  1,
  true,
  null
),
(
  16,
  '85018ca8-881e-4cb7-9a22-24f3e015f797',
  'https://local.permanent.org/share/85018ca8-881e-4cb7-9a22-24f3e015f797',
  2,
  1,
  false,
  null
),
(
  16,
  'fbff79db-3814-4a1e-86be-ae1326cd56a3',
  'https://local.permanent.org/share/fbff79db-3814-4a1e-86be-ae1326cd56a3',
  2,
  1,
  true,
  CURRENT_TIMESTAMP - INTERVAL '1 day'
);
