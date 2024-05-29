import { config } from "dotenv";
import { requireEnv } from "require-env-variable";

config({ path: "../../.env" });

requireEnv("ARCHIVEMATICA_BASE_URL");
requireEnv("ARCHIVEMATICA_API_KEY");
requireEnv("SENTRY_DSN");
requireEnv("ENV");
