import { config } from "dotenv";
import { requireEnv } from "require-env-variable";

config({ path: "../../.env" });

requireEnv("ARCHIVEMATICA_HOST_URL");
requireEnv("ARCHIVEMATICA_API_KEY");
requireEnv("ARCHIVEMATICA_ORIGINAL_LOCATION_ID");
