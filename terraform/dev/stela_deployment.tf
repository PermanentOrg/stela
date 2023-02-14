resource "kubernetes_deployment" "stela" {
  metadata {
    name = "stela"
    labels = {
      App = "stela"
    }
  }

  spec {
    replicas = 2
    selector {
      match_labels = {
        App = "stela"
      }
    }
    template {
      metadata {
        labels = {
          App = "stela"
        }
      }
      spec {
        container {
          image = var.stela_image
          name  = "stela"

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

resource "kubernetes_service" "stela" {
  metadata {
    name = "stela"
  }
  spec {
    selector = {
      App = kubernetes_deployment.stela.spec.0.template.0.metadata[0].labels.App
    }
    port {
      port        = 80
      target_port = 80
    }
    type = "NodePort"
  }
}
