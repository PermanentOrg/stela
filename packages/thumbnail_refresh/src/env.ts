import { config } from "dotenv";
import { requireEnv } from "require-env-variable";

config({ path: "../../.env" });

requireEnv("SENTRY_DSN");
requireEnv("ENV");
requireEnv("DATABASE_URL");
requireEnv("CLOUDFRONT_URL");
requireEnv("CLOUDFRONT_KEY_PAIR_ID");
requireEnv("CLOUDFRONT_PRIVATE_KEY");
