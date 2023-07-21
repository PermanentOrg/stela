resource "kubernetes_deployment" "stela_prod" {
  metadata {
    name = "stela-prod"
    labels = {
      App         = "stela-prod"
      Environment = "prod"
    }
  }

  spec {
    replicas = 2
    selector {
      match_labels = {
        App = "stela-prod"
      }
    }
    template {
      metadata {
        labels = {
          App = "stela-prod"
        }
      }
      spec {
        container {
          image = var.stela_image
          name  = "stela-prod"

          env {
            name  = "ENV"
            value = var.env
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
            name = "FUSIONAUTH_API_KEY"
            value_from {
              secret_key_ref {
                name     = "prod-secrets"
                key      = "FUSIONAUTH_API_KEY"
                optional = false
              }
            }
          }

          env {
            name = "LEGACY_BACKEND_SHARED_SECRET"
            value_from {
              secret_key_ref {
                name     = "prod-secrets"
                key      = "LEGACY_BACKEND_SHARED_SECRET"
                optional = false
              }
            }
          }

          env {
            name  = "FUSIONAUTH_HOST"
            value = var.fusionauth_host
          }

          env {
            name  = "FUSIONAUTH_TENANT"
            value = var.prod_fusionauth_tenant
          }

          env {
            name  = "FUSIONAUTH_BACKEND_APPLICATION_ID"
            value = var.prod_fusionauth_backend_application_id
          }

          env {
            name  = "FUSIONAUTH_ADMIN_APPLICATION_ID"
            value = var.prod_fusionauth_admin_application_id
          }

          env {
            name  = "LEGACY_BACKEND_HOST_URL"
            value = var.legacy_backend_prod_host_url
          }

          env {
            name = "MAILCHIMP_API_KEY"
            value_from {
              secret_key_ref {
                name     = "prod-secrets"
                key      = "MAILCHIMP_API_KEY"
                optional = false
              }
            }
          }

          env {
            name = "MAILCHIMP_TRANSACTIONAL_API_KEY"
            value_from {
              secret_key_ref {
                name     = "prod-secrets"
                key      = "MAILCHIMP_TRANSACTIONAL_API_KEY"
                optional = false
              }
            }
          }

          env {
            name  = "MAILCHIMP_DATACENTER"
            value = var.mailchimp_datacenter
          }

          env {
            name  = "MAILCHIMP_COMMUNITY_LIST_ID"
            value = var.prod_mailchimp_community_list_id
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

          env {
            name  = "AWS_REGION"
            value = var.aws_region
          }

          env {
            name = "AWS_ACCESS_KEY_ID"
            value_from {
              secret_key_ref {
                name     = "prod-secrets"
                key      = "AWS_ACCESS_KEY_ID"
                optional = false
              }
            }
          }

          env {
            name = "AWS_SECRET_ACCESS_KEY"
            value_from {
              secret_key_ref {
                name     = "prod-secrets"
                key      = "AWS_SECRET_ACCESS_KEY"
                optional = false
              }
            }
          }

          env {
            name = "LOW_PRIORITY_TOPIC_ARN"
            value_from {
              secret_key_ref {
                name     = "prod-secrets"
                key      = "LOW_PRIORITY_TOPIC_ARN"
                optional = false
              }
            }
          }

          port {
            container_port = 80
          }

          resources {
            limits = {
              cpu    = "1"
              memory = "512Mi"
            }
            requests = {
              cpu    = "250m"
              memory = "50Mi"
            }
          }
        }

      }
    }
  }
}

resource "kubernetes_service" "stela_prod" {
  metadata {
    name = "stela-prod"
  }
  spec {
    selector = {
      App = kubernetes_deployment.stela_prod.spec.0.template.0.metadata[0].labels.App
    }
    port {
      port        = 80
      target_port = 80
    }
    type = "NodePort"
  }
}
