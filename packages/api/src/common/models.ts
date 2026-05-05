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
	// The fields below are deprecated in our public API. They remain here
	// because we still read and write them while clients migrate to the
	// fields above.
	streetNumber?: string;
	streetName?: string;
	locality?: string;
	county?: string;
	countryCode?: string;
	displayName?: string;
}
