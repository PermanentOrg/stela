resource "kubernetes_secret" "prod-secrets" {
  metadata {
    name = "prod-secrets"
  }

  data = {
    "DATABASE_URL"                 = var.prod_database_url
    "FUSIONAUTH_API_KEY"           = var.prod_fusionauth_api_key
    "LEGACY_BACKEND_SHARED_SECRET" = var.prod_legacy_backend_shared_secret
  }
}
