export interface FeatureFlagRow {
  id: number;
  name: string;
  description: string;
  globallyEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FeatureFlagNameRow {
  name: string;
}

export interface CreateFeatureFlagRequest {
  emailFromAuthToken: string;
  adminSubjectFromAuthToken: string;
  name: string;
  description: string;
}

export interface FeatureFlagRequest {
  admin: boolean;
}
