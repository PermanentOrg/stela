data "kubernetes_resource" "event_send_staging" {
  count       = local.need_staging_images ? 1 : 0
  kind        = "CronJob"
  api_version = "batch/v1"
  metadata { name = "event-send-staging" }
}

resource "kubernetes_cron_job_v1" "event_send_staging" {
  metadata {
    name = "event-send-staging"
    labels = {
      Environment = "staging"
    }
  }
  spec {
    concurrency_policy            = "Replace"
    failed_jobs_history_limit     = 3
    schedule                      = "* * * * *"
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
              name  = "event-send-staging"
              image = local.desired_images["event-send-staging"]

              env {
                name  = "ENV"
                value = var.staging_env
              }

              env {
                name  = "AWS_REGION"
                value = var.aws_region
              }

              env {
                name = "DATABASE_URL"
                value_from {
                  secret_key_ref {
                    name     = "staging-secrets"
                    key      = "DATABASE_URL"
                    optional = false
                  }
                }
              }

              env {
                name = "AWS_ACCESS_KEY_ID"
                value_from {
                  secret_key_ref {
                    name     = "staging-secrets"
                    key      = "AWS_ACCESS_KEY_ID"
                    optional = false
                  }
                }
              }

              env {
                name = "AWS_SECRET_ACCESS_KEY"
                value_from {
                  secret_key_ref {
                    name     = "staging-secrets"
                    key      = "AWS_SECRET_ACCESS_KEY"
                    optional = false
                  }
                }
              }

              env {
                name = "EVENT_TOPIC_ARN"
                value_from {
                  secret_key_ref {
                    name     = "staging-secrets"
                    key      = "EVENT_TOPIC_ARN"
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

              env {
                name = "MIXPANEL_TOKEN"
                value_from {
                  secret_key_ref {
                    name     = "staging-secrets"
                    key      = "MIXPANEL_TOKEN"
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
