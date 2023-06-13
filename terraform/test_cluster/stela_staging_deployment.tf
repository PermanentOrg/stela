resource "kubernetes_deployment" "stela_staging" {
  metadata {
    name = "stela-staging"
    labels = {
      App         = "stela-staging"
      Environment = "staging"
    }
  }

  spec {
    replicas = 2
    selector {
      match_labels = {
        App = "stela-staging"
      }
    }
    template {
      metadata {
        labels = {
          App = "stela-staging"
        }
      }
      spec {
        container {
          image = var.stela_staging_image
          name  = "stela-staging"

          env {
            name  = "ENV"
            value = var.staging_env
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
            name = "FUSIONAUTH_API_KEY"
            value_from {
              secret_key_ref {
                name     = "staging-secrets"
                key      = "FUSIONAUTH_API_KEY"
                optional = false
              }
            }
          }

          env {
            name = "LEGACY_BACKEND_SHARED_SECRET"
            value_from {
              secret_key_ref {
                name     = "staging-secrets"
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
            value = var.staging_fusionauth_tenant
          }

          env {
            name  = "FUSIONAUTH_BACKEND_APPLICATION_ID"
            value = var.staging_fusionauth_backend_application_id
          }

          env {
            name  = "FUSIONAUTH_ADMIN_APPLICATION_ID"
            value = var.staging_fusionauth_admin_application_id
          }

          env {
            name  = "LEGACY_BACKEND_HOST_URL"
            value = var.legacy_backend_dev_host_url
          }

          env {
            name = "MAILCHIMP_API_KEY"
            value_from {
              secret_key_ref {
                name     = "staging-secrets"
                key      = "MAILCHIMP_API_KEY"
                optional = false
              }
            }
          }

          env {
            name = "MAILCHIMP_TRANSACTIONAL_API_KEY"
            value_from {
              secret_key_ref {
                name     = "staging-secrets"
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
            value = var.staging_mailchimp_community_list_id
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

resource "kubernetes_service" "stela_staging" {
  metadata {
    name = "stela-staging"
  }
  spec {
    selector = {
      App = kubernetes_deployment.stela_staging.spec.0.template.0.metadata[0].labels.App
    }
    port {
      port        = 80
      target_port = 80
    }
    type = "NodePort"
  }
}
