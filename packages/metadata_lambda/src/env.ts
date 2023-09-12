import { config } from "dotenv";
import { requireEnv } from "require-env-variable";

config();

requireEnv("ENV");
requireEnv("AWS_REGION");
requireEnv("S3_BUCKET_NAME");
requireEnv("DATABASE_URL");
