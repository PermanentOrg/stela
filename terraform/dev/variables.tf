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

variable "fusionauth_api_key" {
  description = "API key for the FusionAuth API"
  type        = string
}

variable "fusionauth_host" {
  description = "Host URL for the FusionAuth API"
  type        = string
  default     = "https://permanent-dev.fusionauth.io/"
}

variable "fusionauth_tenant" {
  description = "ID of the FusionAuth tenant used by this application"
  type        = string
  default     = "45586253-3e3b-448c-a27a-44eae469ec35"
}

variable "fusionauth_backend_application_id" {
  description = "ID of the FusionAuth application that manages authentication to the web-app's backend"
  type        = string
  default     = "8048057e-4f77-406a-a77d-2962a81cea21"
}

variable "fusionauth_admin_application_id" {
  description = "ID of the FusionAuth application that manages authentication to the admin portal"
  type        = string
  default     = "f2043bfb-9886-4df8-a0f0-7cd1d75651a0"
}

variable "legacy_backend_host_url" {
  description = "Host URL of the legacy PHP backend"
  type        = string
  default     = "https://dev.permanent.org/api"
}

variable "legacy_backend_shared_secret" {
  description = "Shared secret for authenticating calls to the legacy backend"
  type        = string
}
