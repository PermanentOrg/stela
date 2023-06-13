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
  }
}
