export enum AccessRole {
	Owner = "access.role.owner",
	Manager = "access.role.manager",
	Editor = "access.role.editor",
	Viewer = "access.role.viewer",
	Contributor = "access.role.contributor",
	Curator = "access.role.curator",
}

export interface Location {
	id: string;
	streetNumber?: string;
	streetName?: string;
	locality?: string;
	county?: string;
	state?: string;
	latitude?: number;
	longitude?: number;
	country?: string;
	countryCode?: string;
	displayName?: string;
}
