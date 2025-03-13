import { config } from "dotenv";
import { requireEnv } from "require-env-variable";

config({ path: "../../.env" });

requireEnv("ENV");
requireEnv("DATABASE_URL");
requireEnv("FUSIONAUTH_HOST");
requireEnv("FUSIONAUTH_TENANT");
requireEnv("FUSIONAUTH_BACKEND_APPLICATION_ID");
requireEnv("FUSIONAUTH_ADMIN_APPLICATION_ID");
requireEnv("FUSIONAUTH_SFTP_APPLICATION_ID");
requireEnv("LEGACY_BACKEND_HOST_URL");
requireEnv("LEGACY_BACKEND_SHARED_SECRET");
requireEnv("MAILCHIMP_API_KEY");
requireEnv("MAILCHIMP_DATACENTER");
requireEnv("MAILCHIMP_COMMUNITY_LIST_ID");
requireEnv("SENTRY_DSN");
requireEnv("AWS_REGION");
requireEnv("LOW_PRIORITY_TOPIC_ARN");
requireEnv("MIXPANEL_TOKEN");
requireEnv("EVENT_TOPIC_ARN");
requireEnv("SITE_URL");
