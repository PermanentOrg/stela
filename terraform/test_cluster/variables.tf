variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-west-2"
}

variable "dev_env" {
  description = "Name of the dev environment"
  type        = string
  default     = "dev"
}

variable "staging_env" {
  description = "Name of the staging environment"
  type        = string
  default     = "staging"
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
  description = "Tag of stela API image to deploy to dev"
  type        = string
}

variable "stela_staging_image" {
  description = "Tag of stela API image to deploy to staging"
  type        = string
}

variable "archivematica_cleanup_dev_image" {
  description = "Tag of archivematica cleanup image to deploy to dev"
  type        = string
}

variable "archivematica_cleanup_staging_image" {
  description = "Tag of archivematica cleanup image to deploy to staging"
  type        = string
}

variable "record_thumbnail_dev_lambda_image" {
  description = "Tag of record thumbnail lambda image to deploy to dev"
  type        = string
}

variable "record_thumbnail_staging_lambda_image" {
  description = "Tag of record thumbnail lambda image to deploy to staging"
  type        = string
}

variable "thumbnail_refresh_dev_image" {
  description = "Tag of thumbnail refresh image to deploy to dev"
  type        = string
}

variable "thumbnail_refresh_staging_image" {
  description = "Tag of thumbnail refresh image to deploy to staging"
  type        = string
}

variable "file_url_refresh_dev_image" {
  description = "Tag of file URL refresh image to deploy to dev"
  type        = string
}

variable "file_url_refresh_staging_image" {
  description = "Tag of file URL refresh image to deploy to staging"
  type        = string
}

variable "access_copy_dev_lambda_image" {
  description = "Tag of the access copy lambda image to deploy to dev"
  type        = string
}

variable "access_copy_staging_lambda_image" {
  description = "Tag of the access copy lambda image to deploy to staging"
  type        = string
}

variable "account_space_updater_dev_lambda_image" {
  description = "Tag of account space updater image to deploy to dev"
  type        = string
}

variable "account_space_updater_staging_lambda_image" {
  description = "Tag of account space updater image to deploy to staging"
  type        = string
}

variable "trigger_archivematica_dev_lambda_image" {
  description = "Tag of archivematica triggerer image to deploy to dev"
  type        = string
}

variable "trigger_archivematica_staging_lambda_image" {
  description = "Tag of archivematica triggerer image to deploy to staging"
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

variable "dev_fusionauth_sftp_application_id" {
  description = "ID of the FusionAuth application that manages authentication to the sftp service in the dev environment"
  type        = string
  default     = "00eecfff-180f-4db5-9a34-10498c971830"
}

variable "staging_fusionauth_sftp_application_id" {
  description = "ID of the FusionAuth application that manages authentication to the sftp service in the staging environment"
  type        = string
  default     = "ed2d6e4d-fca3-4929-bba6-2df1c2fcb921"
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

variable "sentry_dsn" {
  description = "DSN for Sentry"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-west-2"
}

variable "dev_aws_access_key_id" {
  description = "AWS access key"
  type        = string
}

variable "dev_aws_secret_access_key" {
  description = "AWS secret access key"
  type        = string
}

variable "dev_low_priority_topic_arn" {
  description = "ARN of the SNS topic for 'low priority' messages"
  type        = string
}

variable "dev_event_topic_arn" {
  description = "ARN of the SNS topic for system events"
  type        = string
}

variable "staging_aws_access_key_id" {
  description = "AWS access key"
  type        = string
}

variable "staging_aws_secret_access_key" {
  description = "AWS secret access key"
  type        = string
}

variable "staging_low_priority_topic_arn" {
  description = "ARN of the SNS topic for 'low priority' messages"
  type        = string
}

variable "staging_event_topic_arn" {
  description = "ARN of the SNS topic for system events"
  type        = string
}

variable "dev_mixpanel_token" {
  description = "Mixpanel token"
  type        = string
}

variable "staging_mixpanel_token" {
  description = "Mixpanel token"
  type        = string
}

variable "dev_archivematica_base_url" {
  description = "Base URL for the Archivematica API in the dev environment"
  type        = string
}

variable "staging_archivematica_base_url" {
  description = "Base URL for the Archivematica API in the staging environment"
  type        = string
}

variable "dev_archivematica_api_key" {
  description = "API key for the Archivematica API in the dev environment"
  type        = string
}

variable "staging_archivematica_api_key" {
  description = "API key for the Archivematica API in the staging environment"
  type        = string
}

variable "dev_new_relic_license_key" {
  description = "New Relic license key for the dev environment"
  type        = string
}

variable "dev_new_relic_app_name" {
  description = "New Relic app name for the dev environment"
  type        = string
  default     = "stela-api-dev"
}

variable "staging_new_relic_license_key" {
  description = "New Relic license key for the dev environment"
  type        = string
}

variable "staging_new_relic_app_name" {
  description = "New Relic app name for the dev environment"
  type        = string
  default     = "stela-api-staging"
}

variable "dev_cloudfront_url" {
  description = "URL of the CloudFront distribution for the dev environment"
  type        = string
}

variable "staging_cloudfront_url" {
  description = "URL of the CloudFront distribution for the staging environment"
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

variable "dev_s3_bucket" {
  description = "Name of the S3 bucket where files are stored in dev"
  type        = string
}

variable "dev_backblaze_bucket" {
  description = "Name of the Backblaze bucket where files are stored in dev"
  type        = string
}

variable "staging_s3_bucket" {
  description = "Name of the S3 bucket where files are stored in staging"
  type        = string
}

variable "staging_backblaze_bucket" {
  description = "Name of the Backblaze bucket where files are stored in staging"
  type        = string
}

variable "dev_site_url" {
  description = "URL of the dev site"
  type        = string
  default     = "dev.permanent.org"
}

variable "staging_site_url" {
  description = "URL of the staging site"
  type        = string
  default     = "staging.permanent.org"
}

variable "dev_archivematica_original_location_id" {
  description = "Location ID where original copies are stored for the dev instance of Archivematica"
  type        = string
  default     = "59ca35b5-6cb2-47d2-ab1c-5912d3bb4ce2"
}

variable "staging_archivematica_original_location_id" {
  description = "Location ID where original copies are stored for the staging instance of Archivematica"
  type        = string
  default     = "b3a5a89f-34c0-4ebd-a037-e70140d49ff9"
}
