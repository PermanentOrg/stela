INSERT INTO file (
  fileid,
  archiveid,
  size,
  format,
  type,
  status,
  fileurl,
  downloadurl,
  createddt,
  updateddt
)
VALUES
(
  8,
  1,
  1024,
  'file.format.original',
  'type.file.image.png',
  'status.generic.ok',
  'https://localcdn.permanent.org/_Dev/'
  || '8?t=1732914102&Expires=1732914102&Signature=AmCIgw__&Key-Pair-Id=APKA',
  'https://localcdn.permanent.org/_Dev/8?t=1732914102&'
  || 'response-content-disposition=attachment%3B+filename%3D%22Robert+birthday+'
  || '%281%29.jpg%22&Expires=1732914102&Signature=R25~ODA0uZ77J2rjQ__&'
  || 'Key-Pair-Id=APKA',
  '2023-06-21T00:00:00.000Z',
  '2023-06-21T00:00:00.000Z'
),
(
  9,
  1,
  2056,
  'file.format.converted',
  'type.file.image.jpg',
  'status.generic.ok',
  'https://localcdn.permanent.org/_Dev/9?t=1732914102&Expires=1732914102&'
  || 'Signature=AmCIgw__&Key-Pair-Id=APKA',
  'https://localcdn.permanent.org/_Dev/9?t=1732914102&'
  || 'response-content-disposition=attachment%3B+filename%3D%22Robert+'
  || 'birthday+%281%29.jpg%22&Expires=1732914102&Signature='
  || 'R25~ODA0uZ77J2rjQ__&Key-Pair-Id=APKA',
  '2023-06-21T00:00:00.000Z',
  '2023-06-21T00:00:00.000Z'
);
