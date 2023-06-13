variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-west-2"
}

variable "env" {
  description = "Name of the production environment"
  type        = string
  default     = "production"
}

variable "prod_database_url" {
  description = "Dev database URL"
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

variable "prod_security_group_id" {
  description = "ID of the Production security group"
  type        = string
  default     = "sg-9c3f62f9"
}

variable "prod_fusionauth_api_key" {
  description = "Dev API key for the FusionAuth API"
  type        = string
}

variable "fusionauth_host" {
  description = "Host URL for the FusionAuth API"
  type        = string
  default     = "https://auth.permanent.org/"
}

variable "prod_fusionauth_tenant" {
  description = "ID of the FusionAuth tenant used in the prod environment"
  type        = string
  default     = "97c7a08f-2d3d-46be-a1f6-151e61b91fa1"
}

variable "prod_fusionauth_backend_application_id" {
  description = "ID of the FusionAuth application that manages authentication to the web-app's backend in the prod environment"
  type        = string
  default     = "c99604ce-8240-4cd0-b18b-511da693f921"
}

variable "prod_fusionauth_admin_application_id" {
  description = "ID of the FusionAuth application that manages authentication to the admin portal in the prod environment"
  type        = string
  default     = "28003417-1976-447c-bcbe-c5c1f575b596"
}

variable "legacy_backend_prod_host_url" {
  description = "Host URL of the legacy PHP backend"
  type        = string
  default     = "https://permanent.org/api"
}

variable "prod_legacy_backend_shared_secret" {
  description = "Shared secret for authenticating calls to the legacy backend in the prod environment"
  type        = string
}

variable "mailchimp_api_key" {
  description = "API key for Mailchimp Marketing"
  type        = string
}

variable "mailchimp_transactional_api_key" {
  description = "API key for Mailchimp Transactional"
  type        = string
}

variable "mailchimp_datacenter" {
  description = "The identifier for the Mailchimp datacenter where our account is hosted"
  type        = string
  default     = "us12"
}

variable "prod_mailchimp_community_list_id" {
  description = "The ID of the Mailchimp audience we use in the prod environment"
  type        = string
  default     = "487bd863fb"
}
