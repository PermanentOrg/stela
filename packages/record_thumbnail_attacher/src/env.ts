import { config } from "dotenv";
import { requireEnv } from "require-env-variable";

config({ path: "../../.env" });

requireEnv("DATABASE_URL");
requireEnv("SENTRY_DSN");
requireEnv("ENV");
requireEnv("CLOUDFRONT_KEY_PAIR_ID");
requireEnv("CLOUDFRONT_PRIVATE_KEY");
requireEnv("CLOUDFRONT_URL");
