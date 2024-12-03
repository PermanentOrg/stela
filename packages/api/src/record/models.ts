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
  folderLinkId: string;
  folderLinkType: FolderLinkType;
  parentFolderId: string;
  parentFolderLinkId: string;
  parentFolderArchiveNumber: string;
  tags: Tag[];
  archiveArchiveNumber: string;
  shares: Share[];
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
  folderLinkId: string;
  folderLinkType: FolderLinkType;
  parentFolderId: string;
  parentFolderLinkId: string;
  parentFolderArchiveNumber: string;
  tags: Tag[];
  archiveArchiveNumber: string;
  shares: Share[];
}

export interface ArchiveFile {
  fileId: string;
  size: number;
  format: FileFormat;
  type: FileType;
  fileUrl: string;
  downloadUrl: string;
}

export interface Tag {
  tagId: string;
  name: string;
  type: string;
}

export interface Share {
  shareId: string;
  archiveId: string;
  accessRole: AccessRole;
  status: ShareStatus;
  archive: ShareArchive;
}

export interface ShareArchive {
  archiveId: string;
  thumbUrl200?: string;
  name: string;
}

export interface RecordColumnsForUpdate {
  recordId: string;
  locnid: bigint;
  description: string;
}

export interface PatchRecordRequest {
  emailFromAuthToken: string;
  locationId: bigint;
  description: string;
}

export interface CopyRecordRequest {
  RecordVO: RecordVO;
  FolderDestVO: FolderDestVO;
  archiveId: string; // this was in the session variable
}

export interface RecordVO {
  recordId: number;
  archiveNbr: string;
  folder_linkId: number;
  parentFolder_linkId: number;
  parentFolderId: number;
  uploadFileName: string;
}

export interface FolderDestVO {
  folder_linkId: number;
}

export enum AccessRole {
  Owner = "access.role.owner",
  Manager = "access.role.manager",
  Editor = "access.role.editor",
  Viewer = "access.role.viewer",
  Contributor = "access.role.contributor",
  Curator = "access.role.curator",
}

export enum ShareStatus {
  Ok = "status.generic.ok",
  Pending = "status.generic.pending",
  Deleted = "status.generic.deleted",
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
  Copying = "status.record.copying",
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

export enum FileFormat {
  Original = "file.format.original",
  Converted = "file.format.converted",
}

export enum FileType {
  VideoAvi = "type.file.video.avi",
  VideoMpg = "type.file.video.mpg",
  ImageBmp = "type.file.image.bmp",
  ArchiveZip = "type.file.archive.zip",
  SpreadsheetXls = "type.file.spreadsheet.xls",
  VideoMpeg = "type.file.video.mpeg",
  VideoWmv = "type.file.video.wmv",
  ImageHeic = "type.file.image.heic",
  AudioWma = "type.file.audio.wma",
  Unknown = "type.file.unknown.null",
  VideoMkv = "type.file.video.mkv",
  Gedcom = "type.file.gedcom",
  ImagePng = "type.file.image.png",
  AudioWav = "type.file.audio.wav",
  VideoM4v = "type.file.video.m4v",
  VideoMp4 = "type.file.video.mp4",
  SpreadsheetCsv = "type.file.spreadsheet.csv",
  DocumentHtm = "type.file.document.htm",
  DocumentDocx = "type.file.document.docx",
  PresentationOdp = "type.file.presentation.odp",
  AudioM4a = "type.file.audio.m4a",
  Gedzip = "type.file.gedzip",
  ImageJpg = "type.file.image.jpg",
  ImageTiff = "type.file.image.tiff",
  ImageHeif = "type.file.image.heif",
  AudioMp3 = "type.file.audio.mp3",
  DocumentDoc = "type.file.document.doc",
  SpreadsheetXlsx = "type.file.spreadsheet.xlsx",
  AudioAac = "type.file.audio.aac",
  DocumentEml = "type.file.document.eml",
  VideoWebm = "type.file.video.webm",
  DocumentOdt = "type.file.document.odt",
  ImageGif = "type.file.image.gif",
  ImageJpeg = "type.file.image.jpeg",
  AudioOgg = "type.file.audio.ogg",
  VideoOgv = "type.file.video.ogv",
  ImageTif = "type.file.image.tif",
  AudioFlac = "type.file.audio.flac",
  DocumentTxt = "type.file.document.txt",
  DocumentHtml = "type.file.document.html",
  PresentationKey = "type.file.presentation.key",
  Archive7zip = "type.file.archive.7zip",
  Video3gp = "type.file.video.3gp",
  PresentationPpt = "type.file.presentation.ppt",
  PdfPdfa = "type.file.pdf.pdfa",
  PresentationPptx = "type.file.presentation.pptx",
  SpreadsheetOds = "type.file.spreadsheet.ods",
  AudioAiff = "type.file.audio.aiff",
  VideoMov = "type.file.video.mov",
  DocumentRtf = "type.file.document.rtf",
  PdfPdf = "type.file.pdf.pdf",
}

enum FolderLinkType {
  FolderLinkPrivate = "type.folder_link.private",
  FolderPrivate = "type.folder.private",
  FolderRootApp = "type.folder.root.app",
  FolderLinkPublic = "type.folder_link.public",
  FolderLinkVault = "type.folder_link.vault",
  FolderLinkApp = "type.folder_link.app",
  FolderLinkShare = "type.folder_link.share",
  FolderLinkRootRoot = "type.folder_link.root.root",
  FolderLinkRootVault = "type.folder_link.root.vault",
  FolderLinkRootApp = "type.folder_link.root.app",
  FolderLinkRootShare = "type.folder_link.root.share",
  FolderLinkRootPrivate = "type.folder_link.root.private",
}
