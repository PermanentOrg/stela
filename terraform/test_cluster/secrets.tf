resource "kubernetes_secret" "dev-secrets" {
  metadata {
    name = "dev-secrets"
  }

  data = {
    "DATABASE_URL"                    = var.dev_database_url
    "FUSIONAUTH_API_KEY"              = var.dev_fusionauth_api_key
    "LEGACY_BACKEND_SHARED_SECRET"    = var.dev_legacy_backend_shared_secret
    "MAILCHIMP_API_KEY"               = var.mailchimp_api_key
    "MAILCHIMP_TRANSACTIONAL_API_KEY" = var.mailchimp_transactional_api_key
    "SENTRY_DSN"                      = var.sentry_dsn
    "AWS_ACCESS_KEY_ID"               = var.dev_aws_access_key_id
    "AWS_SECRET_ACCESS_KEY"           = var.dev_aws_secret_access_key
    "LOW_PRIORITY_TOPIC_ARN"          = var.dev_low_priority_topic_arn
    "MIXPANEL_TOKEN"                  = var.dev_mixpanel_token
    "ARCHIVEMATICA_BASE_URL"          = var.dev_archivematica_base_url
    "ARCHIVEMATICA_API_KEY"           = var.dev_archivematica_api_key
  }
}

resource "kubernetes_secret" "staging-secrets" {
  metadata {
    name = "staging-secrets"
  }

  data = {
    "DATABASE_URL"                    = var.staging_database_url
    "FUSIONAUTH_API_KEY"              = var.staging_fusionauth_api_key
    "LEGACY_BACKEND_SHARED_SECRET"    = var.staging_legacy_backend_shared_secret
    "MAILCHIMP_API_KEY"               = var.mailchimp_api_key
    "MAILCHIMP_TRANSACTIONAL_API_KEY" = var.mailchimp_transactional_api_key
    "SENTRY_DSN"                      = var.sentry_dsn
    "AWS_ACCESS_KEY_ID"               = var.staging_aws_access_key_id
    "AWS_SECRET_ACCESS_KEY"           = var.staging_aws_secret_access_key
    "LOW_PRIORITY_TOPIC_ARN"          = var.staging_low_priority_topic_arn
    "MIXPANEL_TOKEN"                  = var.staging_mixpanel_token
    "ARCHIVEMATICA_BASE_URL"          = var.staging_archivematica_base_url
    "ARCHIVEMATICA_API_KEY"           = var.staging_archivematica_api_key
  }
}
