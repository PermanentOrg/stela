WITH missing_ledger_records AS (
  SELECT
    record.recordid,
    record.archiveid
  FROM
    record
  LEFT JOIN
    ledger_nonfinancial ON record.recordid = ledger_nonfinancial.recordid
  WHERE
    record.archiveid = :archiveId
    AND record.status != 'status.generic.deleted'
    AND ledger_nonfinancial.recordid IS NULL
)

UPDATE record
SET
  uploadpayeraccountid = archive.payeraccountid,
  updateddt = CURRENT_TIMESTAMP
FROM
  missing_ledger_records
INNER JOIN
  archive ON missing_ledger_records.archiveid = archive.archiveid
WHERE
  record.recordid = missing_ledger_records.recordid
RETURNING
  record.recordid AS "recordId";
