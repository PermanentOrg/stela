import { config } from "dotenv";
import { requireEnv } from "require-env-variable";

config({ path: "../../.env" });

requireEnv("DATABASE_URL");
requireEnv("SENTRY_DSN");
requireEnv("ENV");
