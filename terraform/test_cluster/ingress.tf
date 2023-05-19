resource "kubernetes_ingress_v1" "general_ingress_dev" {
  metadata {
    name = "general-ingress-dev"
    annotations = {
      "alb.ingress.kubernetes.io/scheme"          = "internet-facing"
      "alb.ingress.kubernetes.io/subnets"         = "${var.subnet_ids[0]},${var.subnet_ids[1]},${var.subnet_ids[2]}"
      "alb.ingress.kubernetes.io/certificate-arn" = "arn:aws:acm:us-west-2:364159549467:certificate/ba6adc44-5a9d-47cb-a64f-ddb840f6f19d"
      "alb.ingress.kubernetes.io/listen-ports"    = "[{\"HTTP\": 80}, {\"HTTPS\":443}]"
      "alb.ingress.kubernetes.io/ssl-redirect"    = "443"
    }
  }
  spec {
    ingress_class_name = "alb"
    rule {
      http {
        path {
          path = "/*"
          backend {
            service {
              name = kubernetes_service.stela_dev.metadata.0.name
              port {
                number = 80
              }
            }
          }
        }
      }
    }
  }
}

resource "kubernetes_ingress_v1" "general_ingress_staging" {
  metadata {
    name = "general-ingress-staging"
    annotations = {
      "alb.ingress.kubernetes.io/scheme"          = "internet-facing"
      "alb.ingress.kubernetes.io/subnets"         = "${var.subnet_ids[0]},${var.subnet_ids[1]},${var.subnet_ids[2]}"
      "alb.ingress.kubernetes.io/certificate-arn" = "arn:aws:acm:us-west-2:364159549467:certificate/ba6adc44-5a9d-47cb-a64f-ddb840f6f19d"
      "alb.ingress.kubernetes.io/listen-ports"    = "[{\"HTTP\": 80}, {\"HTTPS\":443}]"
      "alb.ingress.kubernetes.io/ssl-redirect"    = "443"
    }
  }
  spec {
    ingress_class_name = "alb"
    rule {
      http {
        path {
          path = "/*"
          backend {
            service {
              name = kubernetes_service.stela_staging.metadata.0.name
              port {
                number = 80
              }
            }
          }
        }
      }
    }
  }
}
