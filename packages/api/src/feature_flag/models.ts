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
	name: string;
	description: string;
}

export interface UpdateFeatureFlagRequest {
	description: string;
	globallyEnabled: boolean;
}
