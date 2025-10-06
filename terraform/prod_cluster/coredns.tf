# Enhanced CoreDNS configuration for AL2023 compatibility
resource "kubernetes_config_map_v1_data" "coredns_custom_logging" {
  metadata {
    name      = "coredns"
    namespace = "kube-system"
  }

  # Force this to overwrite the existing EKS-managed configmap
  force = true

  data = {
    Corefile = <<-EOF
      .:53 {
          log  # Enable query logging
          errors  # Enable error logging
          health {
             lameduck 5s
          }
          ready
          kubernetes cluster.local in-addr.arpa ip6.arpa {
             pods insecure
             fallthrough in-addr.arpa ip6.arpa
             ttl 30
          }
          prometheus :9153
          forward . /etc/resolv.conf {
             max_concurrent 1000  # Increase concurrent query limit
          }
          cache 30
          loop
          reload
          loadbalance
      }
    EOF
  }

  depends_on = [module.eks]
}

# Scale up CoreDNS replicas for AL2023's higher DNS load
resource "kubernetes_deployment_v1" "coredns_scale" {
  metadata {
    name      = "coredns"
    namespace = "kube-system"
  }

  spec {
    replicas = 4  # Increase from default 2

    # Don't manage the full deployment spec, just replicas
    # This prevents Terraform from fighting with EKS addon manager
    selector {
      match_labels = {
        "k8s-app" = "kube-dns"
      }
    }

    template {
      metadata {
        labels = {
          "k8s-app" = "kube-dns"
        }
      }

      spec {
        container {
          name  = "coredns"
          image = "placeholder"  # EKS manages the actual image

          resources {
            limits = {
              memory = "200Mi"  # Increase from default 170Mi
            }
            requests = {
              cpu    = "200m"    # Increase from default 100m
              memory = "100Mi"   # Increase from default 70Mi
            }
          }
        }
      }
    }
  }

  # Let EKS manage most of the deployment
  lifecycle {
    ignore_changes = [
      spec[0].template[0].spec[0].container[0].image,
      spec[0].template[0].metadata[0].annotations,
      metadata[0].annotations
    ]
  }

  depends_on = [module.eks]
}
