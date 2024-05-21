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
}
