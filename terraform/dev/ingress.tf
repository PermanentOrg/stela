resource "kubernetes_ingress_v1" "general_ingress" {
  metadata {
    name = "general-ingress"
    annotations = {
      "alb.ingress.kubernetes.io/scheme"          = "internet-facing"
      "alb.ingress.kubernetes.io/subnets"         = "${var.subnet_ids[0]} ${var.subnet_ids[1]} ${var.subnet_ids[2]}"
      "alb.ingress.kubernetes.io/certificate-arn" = "arn:aws:acm:us-west-2:364159549467:certificate/a890d8d5-fe0a-4d31-b249-813a8ce187d2"
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
              name = kubernetes_service.stela.metadata.0.name
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
