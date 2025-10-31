import { config } from "dotenv";
import { requireEnv } from "require-env-variable";

config({ path: "../../.env" });

requireEnv("DATABASE_URL");
requireEnv("SENTRY_DSN");
requireEnv("AWS_ACCESS_KEY_ID");
requireEnv("AWS_SECRET_ACCESS_KEY");
requireEnv("AWS_REGION");
