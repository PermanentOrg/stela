import { config } from "dotenv";
import { requireEnv } from "require-env-variable";

config({ path: "../../.env" });

requireEnv("SENTRY_DSN");
requireEnv("ENV");
requireEnv("DATABASE_URL");
requireEnv("EVENT_TOPIC_ARN");
requireEnv("AWS_REGION");
requireEnv("MIXPANEL_TOKEN");
