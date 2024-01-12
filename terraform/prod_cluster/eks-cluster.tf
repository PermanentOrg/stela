module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "19.0.4"

  cluster_name    = local.cluster_name
  cluster_version = "1.25"

  vpc_id                         = var.vpc_id
  subnet_ids                     = var.subnet_ids
  cluster_endpoint_public_access = true
  cluster_security_group_id      = var.prod_security_group_id
  aws_auth_users = [
    {
      userarn  = "arn:aws:iam::364159549467:user/liam"
      username = "liam"
      groups   = ["system:masters"]
    },
    {
      userarn  = "arn:aws:iam::364159549467:user/cecilia"
      username = "cecilia"
      groups   = ["system:masters"]
    },
    {
      userarn  = "arn:aws:iam::364159549467:user/natalie"
      username = "natalie"
      groups   = ["system:masters"]
    }
  ]

  eks_managed_node_group_defaults = {
    ami_type = "AL2_x86_64"

  }

  eks_managed_node_groups = {
    one = {
      name = "node-group-1"

      vpc_security_group_ids = [var.prod_security_group_id]

      instance_types = ["t3.medium"]

      min_size     = 2
      max_size     = 3
      desired_size = 2
    }
  }
}
