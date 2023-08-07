resource "kubernetes_secret" "prod-secrets" {
  metadata {
    name = "prod-secrets"
  }

  data = {
    "DATABASE_URL"                    = var.prod_database_url
    "FUSIONAUTH_API_KEY"              = var.prod_fusionauth_api_key
    "LEGACY_BACKEND_SHARED_SECRET"    = var.prod_legacy_backend_shared_secret
    "MAILCHIMP_API_KEY"               = var.mailchimp_api_key
    "MAILCHIMP_TRANSACTIONAL_API_KEY" = var.mailchimp_transactional_api_key
    "SENTRY_DSN"                      = var.sentry_dsn
    "AWS_ACCESS_KEY_ID"               = var.aws_access_key_id
    "AWS_SECRET_ACCESS_KEY"           = var.aws_secret_access_key
    "LOW_PRIORITY_TOPIC_ARN"          = var.low_priority_topic_arn
  }
}
