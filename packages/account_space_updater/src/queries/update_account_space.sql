WITH upload_data AS (
  SELECT
    record.uploadpayeraccountid,
    file.size,
    file.fileid
  FROM
    record
  INNER JOIN
    record_file
    ON record.recordid = record_file.recordid
  INNER JOIN
    file
    ON
      record_file.fileid = file.fileid
      AND file.format = 'file.format.original'
  WHERE
    record.recordid = :recordId
),

updated_account_space AS (
  UPDATE
    account_space
  SET
    spaceleft = spaceleft - (SELECT size FROM upload_data),
    fileleft = fileleft - 1,
    updateddt = CURRENT_TIMESTAMP
  WHERE
    accountid IN (SELECT uploadpayeraccountid FROM upload_data)
  RETURNING
    spaceleft,
    spacetotal,
    fileleft,
    filetotal
)

INSERT INTO
ledger_nonfinancial (
  type,
  spacedelta,
  filedelta,
  fromaccountid,
  fromspacebefore,
  fromspaceleft,
  fromspacetotal,
  fromfilebefore,
  fromfileleft,
  fromfiletotal,
  toaccountid,
  tospacebefore,
  tospaceleft,
  tospacetotal,
  tofilebefore,
  tofileleft,
  tofiletotal,
  recordid,
  fileid,
  status,
  createddt,
  updateddt
) VALUES (
  :operation,
  (SELECT size FROM upload_data),
  1,
  (SELECT uploadpayeraccountid FROM upload_data),
  (
    SELECT spaceleft + (SELECT upload_data.size FROM upload_data)
    FROM
      updated_account_space
  ),
  (SELECT spaceleft FROM updated_account_space),
  (SELECT spacetotal FROM updated_account_space),
  (SELECT fileleft + 1 FROM updated_account_space),
  (SELECT fileleft FROM updated_account_space),
  (SELECT filetotal FROM updated_account_space),
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  :recordId,
  (SELECT fileid FROM upload_data),
  'status.generic.ok',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
