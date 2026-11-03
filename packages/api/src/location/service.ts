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
	if (sublocation !== undefined) {
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
	const result = await client
		.sql<{ locationId: string }>("location.queries.update_location", {
			locationId,
			...modernColumnValues(location),
			...deriveLegacyColumnValues(location),
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

const isLocationShared = async (
	locationId: string,
	client: TinyPg,
): Promise<boolean> => {
	const result = await client
		.sql<{ isShared: boolean }>("location.queries.is_location_shared", {
			locationId,
		})
		.catch((err: unknown) => {
			logger.error(err);
			throw new createError.InternalServerError("Failed to look up location");
		});
	return result.rows[0]?.isShared ?? false;
};

export const saveItemLocation = async (
	currentLocationId: string | null,
	location: LocationInput,
	client: TinyPg = db,
): Promise<string> => {
	if (currentLocationId === null) {
		return await insertLocation(location, client);
	}
	const locationId = (await isLocationShared(currentLocationId, client))
		? await copyLocation(currentLocationId, client)
		: currentLocationId;
	await updateLocation(locationId, location, client);
	return locationId;
};
