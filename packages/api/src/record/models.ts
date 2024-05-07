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
}
