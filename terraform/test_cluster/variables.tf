variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-west-2"
}

variable "dev_database_url" {
  description = "Dev database URL"
  type        = string
}

variable "staging_database_url" {
  description = "Staging database URL"
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

variable "stela_dev_image" {
  description = "Tag of stela image to deploy to dev"
  type        = string
}

variable "stela_staging_image" {
  description = "Tag of stela image to deploy to staging"
  type        = string
}

variable "dev_security_group_id" {
  description = "ID of the Development security group"
  type        = string
  default     = "sg-eca0e789"
}

variable "staging_security_group_id" {
  description = "ID of the Staging security group"
  type        = string
  default     = "sg-fea0e79b"
}

variable "dev_fusionauth_api_key" {
  description = "Dev API key for the FusionAuth API"
  type        = string
}

variable "staging_fusionauth_api_key" {
  description = "Staging API key for the FusionAuth API"
  type        = string
}

variable "fusionauth_host" {
  description = "Host URL for the FusionAuth API"
  type        = string
  default     = "https://permanent-dev.fusionauth.io/"
}

variable "dev_fusionauth_tenant" {
  description = "ID of the FusionAuth tenant used in the dev environment"
  type        = string
  default     = "0df055fe-b0b6-4215-8683-15ddbf3e1249"
}

variable "staging_fusionauth_tenant" {
  description = "ID of the FusionAuth tenant used in the staging environment"
  type        = string
  default     = "9ee9c91b-b094-459b-9fc2-bd29b7bf8c1e"
}

variable "dev_fusionauth_backend_application_id" {
  description = "ID of the FusionAuth application that manages authentication to the web-app's backend in the dev environment"
  type        = string
  default     = "8048057e-4f77-406a-a77d-2962a81cea21"
}

variable "staging_fusionauth_backend_application_id" {
  description = "ID of the FusionAuth application that manages authentication to the web-app's backend in the staging environment"
  type        = string
  default     = "8be789bb-32ee-4b20-a38a-5651e9d42e57"
}

variable "dev_fusionauth_admin_application_id" {
  description = "ID of the FusionAuth application that manages authentication to the admin portal in the dev environment"
  type        = string
  default     = "f2043bfb-9886-4df8-a0f0-7cd1d75651a0"
}

variable "staging_fusionauth_admin_application_id" {
  description = "ID of the FusionAuth application that manages authentication to the admin portal in the staging environment"
  type        = string
  default     = "5df9c061-0988-4f8d-b05a-0a338d5c44b6"
}

variable "legacy_backend_dev_host_url" {
  description = "Host URL of the legacy PHP backend"
  type        = string
  default     = "https://dev.permanent.org/api"
}

variable "legacy_backend_staging_host_url" {
  description = "Host URL of the legacy PHP backend"
  type        = string
  default     = "https://staging.permanent.org/api"
}

variable "dev_legacy_backend_shared_secret" {
  description = "Shared secret for authenticating calls to the legacy backend in the dev environment"
  type        = string
}

variable "staging_legacy_backend_shared_secret" {
  description = "Shared secret for authenticating calls to the legacy backend in the staging environment"
  type        = string
}

variable "mailchimp_api_key" {
  description = "API key for Mailchimp"
  type        = string
}

variable "mailchimp_datacenter" {
  description = "The identifier for the Mailchimp datacenter where our account is hosted"
  type        = string
  default     = "us12"
}

variable "dev_mailchimp_community_list_id" {
  description = "The ID of the Mailchimp audience we use in the dev environment"
  type        = string
  default     = "2736f796db"
}

variable "staging_mailchimp_community_list_id" {
  description = "The ID of the Mailchimp audience we use in the staging environment"
  type        = string
  default     = "757be72121"
}
