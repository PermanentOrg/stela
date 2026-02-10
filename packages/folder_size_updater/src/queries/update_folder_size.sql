WITH record_info AS (
    SELECT
        fl.parentfolder_linkid AS immediate_folder_linkid,
        r.archiveid AS record_archiveid,
        COALESCE(f.size, 0) AS file_size
    FROM
        record AS r
    INNER JOIN
        folder_link AS fl
        ON
            fl.recordid = r.recordid
            AND fl.status != 'status.generic.deleted'
    LEFT JOIN
        record_file AS rf
        ON rf.recordid = r.recordid
    LEFT JOIN
        file AS f
        ON
            rf.fileid = f.fileid
            AND f.format = 'file.format.original'
    WHERE
        r.recordid = :recordId
    LIMIT 1
),

ancestor_folder_links AS (
    SELECT
        fl.folder_linkid,
        fl.parentfolder_linkid,
        TRUE AS is_immediate_parent
    FROM
        folder_link AS fl
    INNER JOIN
        record_info AS ri
        ON fl.folder_linkid = ri.immediate_folder_linkid

    UNION ALL

    SELECT
        fl.folder_linkid,
        fl.parentfolder_linkid,
        FALSE AS is_immediate_parent
    FROM
        folder_link AS fl
    INNER JOIN
        ancestor_folder_links AS afl
        ON fl.folder_linkid = afl.parentfolder_linkid
)

UPDATE
    folder_size AS fs
SET
    allfilesizeshallow = fs.allfilesizeshallow
        + CASE
            WHEN afl.is_immediate_parent
                THEN ri.file_size * :delta
            ELSE 0
        END,
    allrecordcountshallow = fs.allrecordcountshallow
        + CASE
            WHEN afl.is_immediate_parent
                THEN :delta
            ELSE 0
        END,
    myfilesizeshallow = fs.myfilesizeshallow
        + CASE
            WHEN
                afl.is_immediate_parent
                AND fs.archiveid = ri.record_archiveid
                THEN ri.file_size * :delta
            ELSE 0
        END,
    myrecordcountshallow = fs.myrecordcountshallow
        + CASE
            WHEN
                afl.is_immediate_parent
                AND fs.archiveid = ri.record_archiveid
                THEN :delta
            ELSE 0
        END,
    allfilesizedeep = fs.allfilesizedeep + ri.file_size * :delta,
    allrecordcountdeep = fs.allrecordcountdeep + :delta,
    myfilesizedeep = fs.myfilesizedeep
        + CASE
            WHEN fs.archiveid = ri.record_archiveid
                THEN ri.file_size * :delta
            ELSE 0
        END,
    myrecordcountdeep = fs.myrecordcountdeep
        + CASE
            WHEN fs.archiveid = ri.record_archiveid
                THEN :delta
            ELSE 0
        END,
    lastexecutedt = CURRENT_TIMESTAMP,
    lastexecutereason = 'folder_size_updater',
    updateddt = CURRENT_TIMESTAMP
FROM
    ancestor_folder_links AS afl
CROSS JOIN
    record_info AS ri
WHERE
    fs.folder_linkid = afl.folder_linkid;
