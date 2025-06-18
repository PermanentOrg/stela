import { config } from "dotenv";
import { requireEnv } from "require-env-variable";

config({ path: "../../.env" });

export const {
	ARCHIVEMATICA_HOST_URL,
	ARCHIVEMATICA_API_KEY,
	ARCHIVEMATICA_ORIGINAL_LOCATION_ID,
} = requireEnv(
	"ARCHIVEMATICA_HOST_URL",
	"ARCHIVEMATICA_API_KEY",
	"ARCHIVEMATICA_ORIGINAL_LOCATION_ID",
);
