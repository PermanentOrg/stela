data "kubernetes_resource" "archivematica_cleanup_dev" {
  kind        = "CronJob"
  api_version = "batch/v1"
  metadata { name = "archivematica-cleanup-dev" }
}

resource "kubernetes_cron_job_v1" "archivematica_cleanup_dev" {
  metadata {
    name = "archivematica-cleanup-dev"
    labels = {
      Environment = "dev"
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
        backoff_limit = 2
        template {
          metadata {}
          spec {
            container {
              name  = "archivematica-cleanup-dev"
              image = local.desired_images["archivematica-cleanup-dev"]

              env {
                name  = "ENV"
                value = var.dev_env
              }

              env {
                name = "ARCHIVEMATICA_BASE_URL"
                value_from {
                  secret_key_ref {
                    name     = "dev-secrets"
                    key      = "ARCHIVEMATICA_BASE_URL"
                    optional = false
                  }
                }
              }

              env {
                name = "ARCHIVEMATICA_API_KEY"
                value_from {
                  secret_key_ref {
                    name     = "dev-secrets"
                    key      = "ARCHIVEMATICA_API_KEY"
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
