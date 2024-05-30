resource "kubernetes_cron_job_v1" "archivematica_cleanup_prod" {
  metadata {
    name = "archivematica-cleanup-prod"
    labels = {
      Environment = "prod"
    }
  }
  spec {
    concurrency_policy            = "Replace"
    failed_jobs_history_limit     = 5
    schedule                      = "0 * * * *"
    starting_deadline_seconds     = 10
    successful_jobs_history_limit = 10
    job_template {
      metadata {}
      spec {
        backoff_limit              = 2
        ttl_seconds_after_finished = 10
        template {
          metadata {}
          spec {
            container {
              name  = "archivematica-cleanup-prod"
              image = var.archivematica_cleanup_image

              env {
                name  = "ENV"
                value = var.env
              }

              env {
                name = "ARCHIVEMATICA_BASE_URL"
                value_from {
                  secret_key_ref {
                    name     = "prod-secrets"
                    key      = "ARCHIVEMATICA_BASE_URL"
                    optional = false
                  }
                }
              }

              env {
                name = "ARCHIVEMATICA_API_KEY"
                value_from {
                  secret_key_ref {
                    name     = "prod-secrets"
                    key      = "ARCHIVEMATICA_API_KEY"
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
