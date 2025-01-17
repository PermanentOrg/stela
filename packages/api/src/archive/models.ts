export interface Tag {
  tagId: string;
  name: string;
  archiveId: string;
  status: string;
  type: string;
  createdDt: string;
  updatedDt: string;
}

export interface AccountStorage {
  accountSpaceId: string;
  accountId: string;
  spaceLeft: string;
  spaceTotal: string;
  filesLeft: string;
  filesTotal: string;
  status: string;
  type: string;
  createdDt: string;
  updatedDt: string;
}

export interface FeaturedArchive {
  archiveId: string;
  name: string;
  type: string;
  archiveNbr: string;
  profileImage: string;
  bannerImage: string;
}
