resource "kubernetes_cron_job_v1" "archivematica_cleanup_staging" {
  metadata {
    name = "archivematica-cleanup-staging"
    labels = {
      Environment = "staging"
    }
  }
  spec {
    concurrency_policy            = "Replace"
    failed_jobs_history_limit     = 3
    schedule                      = "0 * * * *"
    starting_deadline_seconds     = 10
    successful_jobs_history_limit = 0
    job_template {
      metadata {}
      spec {
        backoff_limit              = 2
        template {
          metadata {}
          spec {
            container {
              name  = "archivematica-cleanup-staging"
              image = var.archivematica_cleanup_staging_image

              env {
                name  = "ENV"
                value = var.staging_env
              }

              env {
                name = "ARCHIVEMATICA_BASE_URL"
                value_from {
                  secret_key_ref {
                    name     = "staging-secrets"
                    key      = "ARCHIVEMATICA_BASE_URL"
                    optional = false
                  }
                }
              }

              env {
                name = "ARCHIVEMATICA_API_KEY"
                value_from {
                  secret_key_ref {
                    name     = "staging-secrets"
                    key      = "ARCHIVEMATICA_API_KEY"
                    optional = false
                  }
                }
              }

              env {
                name = "SENTRY_DSN"
                value_from {
                  secret_key_ref {
                    name     = "staging-secrets"
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
