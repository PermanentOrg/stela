resource "kubernetes_cron_job_v1" "thumbnail_refresh_prod" {
  metadata {
    name = "thumbnail-refresh-prod"
    labels = {
      Environment = "prod"
    }
  }
  spec {
    concurrency_policy            = "Replace"
    failed_jobs_history_limit     = 3
    schedule                      = "0 0 * * 0"
    starting_deadline_seconds     = 10
    successful_jobs_history_limit = 0
    job_template {
      metadata {}
      spec {
        backoff_limit = 2
        template {
          metadata {}
          spec {
            container {
              name  = "thumbnail-refresh-prod"
              image = var.thumbnail_refresh_image

              env {
                name  = "ENV"
                value = var.env
              }

              env {
                name  = "CLOUDFRONT_URL"
                value = var.cloudfront_url
              }

              env {
                name = "DATABASE_URL"
                value_from {
                  secret_key_ref {
                    name     = "prod-secrets"
                    key      = "DATABASE_URL"
                    optional = false
                  }
                }
              }

              env {
                name = "CLOUDFRONT_KEY_PAIR_ID"
                value_from {
                  secret_key_ref {
                    name     = "prod-secrets"
                    key      = "CLOUDFRONT_KEY_PAIR_ID"
                    optional = false
                  }
                }
              }

              env {
                name = "CLOUDFRONT_PRIVATE_KEY"
                value_from {
                  secret_key_ref {
                    name     = "prod-secrets"
                    key      = "CLOUDFRONT_PRIVATE_KEY"
                    optional = false
                  }
                }
              }

              env {
                name = "SENTRY_DSN"
                value_from {
                  secret_key_ref {
                    name     = "prod-secrets"
                    key      = "SENTRY_DSN"
                    optional = false
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
