import { config } from "dotenv";
import { requireEnv } from "require-env-variable";

config();

requireEnv("DATABASE_URL");
requireEnv("FUSIONAUTH_API_KEY");
requireEnv("FUSIONAUTH_HOST");
requireEnv("FUSIONAUTH_TENANT");
requireEnv("LEGACY_BACKEND_HOST_URL");
requireEnv("LEGACY_BACKEND_SHARED_SECRET");
requireEnv("MAILCHIMP_API_KEY");
requireEnv("MAILCHIMP_DATACENTER");
requireEnv("MAILCHIMP_COMMUNITY_LIST_ID");
