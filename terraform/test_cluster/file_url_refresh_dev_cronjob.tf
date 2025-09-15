data "kubernetes_resource" "file_url_refresh_dev" {
  kind        = "CronJob"
  api_version = "batch/v1"
  metadata { name = "file-url-refresh-dev" }
}

resource "kubernetes_cron_job_v1" "file_url_refresh_dev" {
  metadata {
    name = "file-url-refresh-dev"
    labels = {
      Environment = "dev"
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
              name  = "file-url-refresh-dev"
              image = local.desired_images["file-url-refresh-dev"]

              env {
                name  = "ENV"
                value = var.dev_env
              }

              env {
                name  = "CLOUDFRONT_URL"
                value = var.dev_cloudfront_url
              }

              env {
                name = "DATABASE_URL"
                value_from {
                  secret_key_ref {
                    name     = "dev-secrets"
                    key      = "DATABASE_URL"
                    optional = false
                  }
                }
              }

              env {
                name = "CLOUDFRONT_KEY_PAIR_ID"
                value_from {
                  secret_key_ref {
                    name     = "dev-secrets"
                    key      = "CLOUDFRONT_KEY_PAIR_ID"
                    optional = false
                  }
                }
              }

              env {
                name = "CLOUDFRONT_PRIVATE_KEY"
                value_from {
                  secret_key_ref {
                    name     = "dev-secrets"
                    key      = "CLOUDFRONT_PRIVATE_KEY"
                    optional = false
                  }
                }
              }

              env {
                name = "SENTRY_DSN"
                value_from {
                  secret_key_ref {
                    name     = "dev-secrets"
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
