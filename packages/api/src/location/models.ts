export type LocationPrecision = "approximate" | "uncertain" | "unknown";

export interface LocationInput {
	name?: string | null;
	sublocation?: string | null;
	city?: string | null;
	state?: string | null;
	postalCode?: string | null;
	country?: string | null;
	latitude?: number | null;
	longitude?: number | null;
	altitudeMeters?: number | null;
	precision?: LocationPrecision | null;
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
