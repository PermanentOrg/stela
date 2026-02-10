INSERT INTO
folder_size (
    folder_linkid,
    folderid,
    archiveid,
    parentfolder_linkid,
    parentfolderid,
    myfilesizeshallow,
    myfilesizedeep,
    myfoldercountshallow,
    myfoldercountdeep,
    myrecordcountshallow,
    myrecordcountdeep,
    myaudiocountshallow,
    myaudiocountdeep,
    mydocumentcountshallow,
    mydocumentcountdeep,
    myexperiencecountshallow,
    myexperiencecountdeep,
    myimagecountshallow,
    myimagecountdeep,
    myvideocountshallow,
    myvideocountdeep,
    allfilesizeshallow,
    allfilesizedeep,
    allfoldercountshallow,
    allfoldercountdeep,
    allrecordcountshallow,
    allrecordcountdeep,
    allaudiocountshallow,
    allaudiocountdeep,
    alldocumentcountshallow,
    alldocumentcountdeep,
    allexperiencecountshallow,
    allexperiencecountdeep,
    allimagecountshallow,
    allimagecountdeep,
    allvideocountshallow,
    allvideocountdeep,
    lastexecutedt,
    lastexecutereason,
    nextexecutedt,
    status,
    type
)
VALUES
-- Child folder (folder_linkid=300), archive 1 (matches record)
(
    300, 30, 1, 200, 20,
    0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    CURRENT_TIMESTAMP, 'initial',
    CURRENT_TIMESTAMP + '1 day'::INTERVAL,
    'status.generic.ok', 'type.folder_size.recount'
),
-- Parent folder (folder_linkid=200), archive 1
(
    200, 20, 1, 100, 10,
    0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    CURRENT_TIMESTAMP, 'initial',
    CURRENT_TIMESTAMP + '1 day'::INTERVAL,
    'status.generic.ok', 'type.folder_size.recount'
),
-- Root folder (folder_linkid=100), archive 1
(
    100, 10, 1, NULL, NULL,
    0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    CURRENT_TIMESTAMP, 'initial',
    CURRENT_TIMESTAMP + '1 day'::INTERVAL,
    'status.generic.ok', 'type.folder_size.recount'
),
-- Child folder (folder_linkid=300), archive 2 (different archive, for my vs all)
(
    300, 30, 2, 200, 20,
    0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    CURRENT_TIMESTAMP, 'initial',
    CURRENT_TIMESTAMP + '1 day'::INTERVAL,
    'status.generic.ok', 'type.folder_size.recount'
);
