import createError from "http-errors";
import { logger } from "@stela/logger";
import type { TinyPg } from "tinypg";
import { db } from "../database.js";
import type { LocationInput } from "./models.js";

const MODERN_LOCATION_FIELDS = [
	"name",
	"sublocation",
	"city",
	"state",
	"postalCode",
	"country",
	"latitude",
	"longitude",
	"altitudeMeters",
	"precision",
] as const satisfies ReadonlyArray<keyof LocationInput>;

interface LegacyColumnValues {
	streetNumber: string | null;
	streetName: string | null;
	locality: string | null;
}

const modernColumnValues = (location: LocationInput): Record<string, unknown> =>
	Object.fromEntries(
		MODERN_LOCATION_FIELDS.map((field) => [field, location[field] ?? null]),
	);

// MIGRATION SHIM: We accept only the fields in LocationInput from clients, but
// the locn table also carries legacy columns (streetnumber, streetname,
// locality) that some clients still read. We derive what we can from the new
// fields and write through on every insert/update so the legacy columns stay
// coherent with the new ones. This whole helper goes away when the 1:1
// location ERD migration (#746) drops the legacy columns.
const deriveLegacyColumnValues = (
	location: LocationInput,
): LegacyColumnValues => {
	let streetNumber: string | null = null;
	let streetName: string | null = null;
	const { sublocation } = location;
	if (typeof sublocation === "string") {
		const match = /^(?<number>\d+)\s+(?<rest>.+)$/v.exec(sublocation);
		if (match === null) {
			streetName = sublocation;
		} else {
			const { groups } = match;
			streetNumber = groups?.["number"] ?? null;
			streetName = groups?.["rest"] ?? null;
		}
	}

	const locality = location.city ?? null;

	return { streetNumber, streetName, locality };
};

const clearedColumnFlags = (
	location: LocationInput,
	legacyColumnValues: LegacyColumnValues,
): Record<string, boolean> => {
	const sublocationProvided = location.sublocation !== undefined;
	return {
		setNameToNull: location.name === null,
		setSublocationToNull: location.sublocation === null,
		setCityToNull: location.city === null,
		setStateToNull: location.state === null,
		setPostalCodeToNull: location.postalCode === null,
		setCountryToNull: location.country === null,
		setLatitudeToNull: location.latitude === null,
		setLongitudeToNull: location.longitude === null,
		setAltitudeMetersToNull: location.altitudeMeters === null,
		setPrecisionToNull: location.precision === null,
		setStreetNumberToNull:
			sublocationProvided && legacyColumnValues.streetNumber === null,
		setStreetNameToNull:
			sublocationProvided && legacyColumnValues.streetName === null,
		setLocalityToNull: location.city === null,
	};
};

export const insertLocation = async (
	location: LocationInput,
	client: TinyPg = db,
): Promise<string> => {
	const result = await client
		.sql<{
			locationId: string;
		}>("location.queries.insert_location", {
			...modernColumnValues(location),
			...deriveLegacyColumnValues(location),
		})
		.catch((err: unknown) => {
			logger.error(err);
			throw new createError.InternalServerError("Failed to create location");
		});
	const { rows } = result;
	const [inserted] = rows;
	if (inserted === undefined) {
		throw new createError.InternalServerError("Failed to create location");
	}
	return inserted.locationId;
};

export const updateLocation = async (
	locationId: string,
	location: LocationInput,
	client: TinyPg = db,
): Promise<void> => {
	const legacyColumnValues = deriveLegacyColumnValues(location);
	const result = await client
		.sql<{ locationId: string }>("location.queries.update_location", {
			locationId,
			...modernColumnValues(location),
			...legacyColumnValues,
			...clearedColumnFlags(location, legacyColumnValues),
		})
		.catch((err: unknown) => {
			logger.error(err);
			throw new createError.InternalServerError("Failed to update location");
		});
	if (result.rows[0] === undefined) {
		throw new createError.NotFound(`Location ${locationId} not found`);
	}
};

export const copyLocation = async (
	locationId: string,
	client: TinyPg = db,
): Promise<string> => {
	const result = await client
		.sql<{ locationId: string }>("location.queries.copy_location", {
			locationId,
		})
		.catch((err: unknown) => {
			logger.error(err);
			throw new createError.InternalServerError("Failed to copy location");
		});
	const {
		rows: [copied],
	} = result;
	if (copied === undefined) {
		throw new createError.NotFound(`Location ${locationId} not found`);
	}
	return copied.locationId;
};
