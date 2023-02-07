variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-west-2"
}

variable "database_url" {
  description = "Database URL"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
  default     = "vpc-3da37958"
}

variable "subnet_ids" {
  description = "Subnet IDs"
  type        = list(string)
  default     = ["subnet-a3f202fa", "subnet-fc843999", "subnet-0fc91a78"]
}

variable "stela_image" {
  description = "Tag of stela image to deploy"
  type        = string
}

variable "security_group_id" {
  description = "ID of the security group the cluster should exist in"
  type        = string
  default     = "sg-eca0e789"
}
