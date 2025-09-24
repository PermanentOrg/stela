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
  description = "Tag of stela API image to deploy"
  type        = string
}

variable "archivematica_cleanup_image" {
  description = "Tag of Archivematica cleanup image to deploy"
  type        = string
}

variable "record_thumbnail_lambda_image" {
  description = "Tag of record thumbnail lambda image to deploy"
  type        = string
}

variable "thumbnail_refresh_image" {
  description = "Tag of thumbnail refresh image to deploy"
  type        = string
}

variable "file_url_refresh_image" {
  description = "Tag of file URL refresh image to deploy"
  type        = string
}

variable "access_copy_lambda_image" {
  description = "Tag of access copy lambda image to deploy"
  type        = string
}

variable "account_space_updater_lambda_image" {
  description = "Tag of the account space updater lambda image to deploy"
  type        = string
}

variable "trigger_archivematica_lambda_image" {
  description = "Tag of archivematica triggerer image to deploy"
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

variable "prod_fusionauth_sftp_application_id" {
  description = "ID of the FusionAuth application that manages authentication to the sftp service in the prod environment"
  type        = string
  default     = "5879a6f3-6b68-476c-a590-914905b6f6d3"
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

variable "sentry_dsn" {
  description = "DSN for Sentry"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-west-2"
}

variable "aws_access_key_id" {
  description = "AWS access key"
  type        = string
}

variable "aws_secret_access_key" {
  description = "AWS secret access key"
  type        = string
}

variable "low_priority_topic_arn" {
  description = "ARN of the SNS topic for 'low priority' messages"
  type        = string
}

variable "event_topic_arn" {
  description = "ARN of the SNS topic for system events"
  type        = string
}

variable "mixpanel_token" {
  description = "Mixpanel token"
  type        = string
}

variable "archivematica_base_url" {
  description = "Base URL for the Archivematica API"
  type        = string
}

variable "archivematica_api_key" {
  description = "API key"
  type        = string
}

variable "new_relic_license_key" {
  description = "New Relic license key for the dev environment"
  type        = string
}

variable "new_relic_app_name" {
  description = "New Relic app name for the dev environment"
  type        = string
  default     = "stela-api-prod"
}

variable "cloudfront_url" {
  description = "URL of the Cloudfront distribution for the prod environment"
  type        = string
}

variable "cloudfront_key_pair_id" {
  description = "ID of the CloudFront key pair"
  type        = string
}

variable "cloudfront_private_key" {
  description = "Private key for signing CloudFront URLs"
  type        = string
}

variable "aws_account_id" {
  description = "AWS account ID"
  type        = string
}

variable "s3_bucket" {
  description = "The name of the S3 bucket where files are stored"
  type        = string
}

variable "backblaze_bucket" {
  description = "The name of the Backblaze bucket where files are stored"
  type        = string
}

variable "site_url" {
  description = "The URL of the site"
  type        = string
  default     = "www.permanent.org"
}

variable "archivematica_original_location_id" {
  description = "Location ID where original copies are stored for the prod instance of Archivematica"
  type        = string
  default     = "b725c4d9-2fb3-4978-91ef-a325c578ece1"
}
