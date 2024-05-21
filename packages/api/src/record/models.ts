export interface ArchiveRecord {
  recordId: string;
  archiveId: string;
  displayName: string;
  archiveNumber?: string;
  description?: string;
  publicAt?: string;
  downloadName?: string;
  uploadFileName: string;
  uploadAccountId: string;
  uploadPayerAccountId?: string;
  size?: number;
  displayDate?: string;
  fileCreatedAt?: string;
  imageRatio?: number;
  thumbUrl200?: string;
  thumbUrl500?: string;
  thumbUrl1000?: string;
  thumbUrl2000?: string;
  status: RecordStatus;
  type: RecordType;
  createdAt: string;
  updatedAt?: string;
  altText?: string;
  files: ArchiveFile[];
}

export interface ArchiveRecordRow {
  recordId: string;
  archiveId: string;
  displayName: string;
  archiveNumber?: string;
  description?: string;
  publicAt?: string;
  downloadName?: string;
  uploadFileName: string;
  uploadAccountId: string;
  uploadPayerAccountId?: string;
  size?: string;
  displayDate?: string;
  fileCreatedAt?: string;
  imageRatio?: number;
  thumbUrl200?: string;
  thumbUrl500?: string;
  thumbUrl1000?: string;
  thumbUrl2000?: string;
  status: RecordStatus;
  type: RecordType;
  createdAt: string;
  updatedAt?: string;
  altText?: string;
  files: ArchiveFile[];
}

export interface ArchiveFile {
  fileId: string;
  size: number;
}

export enum RecordStatus {
  Deleted = "status.generic.deleted",
  Error = "status.generic.error",
  ManualReview = "status.generic.manual_review",
  Ok = "status.generic.ok",
  Converting = "status.record.converting",
  NeedsConverting = "status.record.needs_converting",
  NeedsProcessing = "status.record.needs_processing",
  OnlyMeta = "status.record.only_meta",
  Processing = "status.record.processing",
  Reprocessing = "status.record.reprocessing",
  Uploaded = "status.record.uploaded",
}

export enum RecordType {
  Unknown = "type.record.unknown",
  Document = "type.record.document",
  Spreadsheet = "type.record.spreadsheet",
  Presentation = "type.record.presentation",
  Image = "type.record.image",
  GenealogyArchive = "Genealogy Archive",
  Archive = "type.record.archive",
  Video = "type.record.video",
  Audio = "type.record.audio",
  Genealogy = "Genealogy",
  Pdf = "type.record.pdf",
}
