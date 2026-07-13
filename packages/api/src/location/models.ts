export type LocationPrecision = "approximate" | "uncertain" | "unknown";

export interface LocationInput {
	name?: string;
	sublocation?: string;
	city?: string;
	state?: string;
	postalCode?: string;
	country?: string;
	latitude?: number;
	longitude?: number;
	altitudeMeters?: number;
	precision?: LocationPrecision;
	timezone?: string | null;
}

export interface Location extends LocationInput {
	id: string;
	streetNumber?: string;
	streetName?: string;
	locality?: string;
	county?: string;
	countryCode?: string;
	displayName?: string;
}
