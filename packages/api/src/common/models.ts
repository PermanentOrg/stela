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
	name?: string;
	sublocation?: string;
	city?: string;
	state?: string;
	postalCode?: string;
	country?: string;
	latitude?: number;
	longitude?: number;
	altitudeMeters?: number;
	precision?: "approximate" | "uncertain" | "unknown";
}
