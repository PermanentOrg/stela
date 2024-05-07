export interface ArchiveRecord {
  recordId: string;
  archiveId: string;
  displayName: string;
  archiveNumber?: string;
  description?: string;
  publicAt: Date;
}
