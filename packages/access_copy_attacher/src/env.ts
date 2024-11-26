import { config } from "dotenv";
import { requireEnv } from "require-env-variable";

config({ path: "../../.env" });

requireEnv("DATABASE_URL");
requireEnv("SENTRY_DSN");
requireEnv("ENV");
requireEnv("CLOUDFRONT_KEY_PAIR_ID");
requireEnv("CLOUDFRONT_PRIVATE_KEY");
requireEnv("CLOUDFRONT_URL");
requireEnv("AWS_ACCESS_KEY_ID");
requireEnv("AWS_ACCESS_SECRET");
requireEnv("AWS_REGION");
requireEnv("S3_BUCKET");
requireEnv("BACKBLAZE_BUCKET");
