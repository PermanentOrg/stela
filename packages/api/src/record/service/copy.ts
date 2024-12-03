import { getFolderByFolderLinkId } from "../../folder/service";
import { type FolderRow, FolderStatus } from "../../folder/models";
import { validateCreateEventRequest } from "../../event/validators";
import type { CreateEventRequest } from "../../event/models";
import { getRecordById } from "../service";
import { type ArchiveRecord, type CopyRecordRequest, RecordStatus, type RecordVO } from "../models";
import { InternalServerError } from "http-errors";

export const getRecordFromRecordVo = async (
  recordVO: RecordVO
): Promise<ArchiveRecord | null> => {
  // const archiveId = recordData.RecordVO.archiveNbr;
  let record = null;
  let recordId = null;

  recordId = { recordId: recordVO.recordId.toString() };
  [record] = await getRecordById({
    recordIds: [recordId.recordId],
    accountEmail: "test11@testt.com", // Where to get this email from?
  });

  if (record === undefined) {
    throw new InternalServerError("RecordVO does not exist");
  }
  return record;
};

export const copyRecord = async (
  recordData: CopyRecordRequest
): Promise<FolderRow> => {
  // TODO check space over - How to check if there is enough space?
  const targetFolder = await getFolderByFolderLinkId({
    folderLinkId: recordData.FolderDestVO.folder_linkId.toString(),
  });

  const record = await getRecordFromRecordVo(recordData.RecordVO);
  if (!record) {
    throw new InternalServerError("RecordVO does not exist");
  }
  // Do we need need to check for read access?

  // Do we need to check for create permission in target folder?

  const sourceFolder = await getFolderByFolderLinkId({
    folderLinkId: record.parentFolderLinkId,
  });

  console.log(record);
  console.log(sourceFolder);

  record.status = RecordStatus.Copying; // TODO save this to the db
  targetFolder.status = FolderStatus.Copying; // TODO save this to the db

  const request: CreateEventRequest = {
    action: "copy",
    body: {
      analytics: {
        event: "Copy Record",
        distinctId: "",
        data: {
          workspace: "",
        },
      },
      record: {
        recordId: record.recordId,
        archiveId: record.archiveId,
      },
      newRecord: {},
      destination: {},
      public: "",
    },
    entity: "",
    entityId: "",
    ip: "",
    version: 1,
  };
  validateCreateEventRequest(request);
  // await createEvent(request);

  return targetFolder;
};
