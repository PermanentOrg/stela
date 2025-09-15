locals {
  current_stela_dev_deploy     = data.kubernetes_resource.stela_dev.object
  current_stela_staging_deploy = data.kubernetes_resource.stela_staging.object

  current_archivematica_cleanup_dev_deploy     = data.kubernetes_resource.archivematica_cleanup_dev.object
  current_archivematica_cleanup_staging_deploy = data.kubernetes_resource.archivematica_cleanup_staging.object

  current_thumbnail_refresh_dev_deploy     = data.kubernetes_resource.thumbnail_refresh_dev.object
  current_thumbnail_refresh_staging_deploy = data.kubernetes_resource.thumbnail_refresh_staging.object

  current_file_url_refresh_dev_deploy     = data.kubernetes_resource.file_url_refresh_dev.object
  current_file_url_refresh_staging_deploy = data.kubernetes_resource.file_url_refresh_staging.object

  current_containers = concat(
    try(local.current_stela_dev_deploy.spec.template.spec.containers),
    try(local.current_stela_staging_deploy.spec.template.spec.containers),
    try(local.current_archivematica_cleanup_dev_deploy.spec.jobTemplate.spec.template.spec.containers),
    try(local.current_archivematica_cleanup_staging_deploy.spec.jobTemplate.spec.template.spec.containers),
    try(local.current_thumbnail_refresh_dev_deploy.spec.jobTemplate.spec.template.spec.containers),
    try(local.current_thumbnail_refresh_staging_deploy.spec.jobTemplate.spec.template.spec.containers),
    try(local.current_file_url_refresh_dev_deploy.spec.jobTemplate.spec.template.spec.containers),
    try(local.current_file_url_refresh_staging_deploy.spec.jobTemplate.spec.template.spec.containers)
  )

  current_kubernetes_images = { for container in local.current_containers : container.name => container.image }
  current_lambda_images = {
    account-space-update-dev-lambda      = try(data.aws_lambda_function.account_space_update_dev_lambda.image_uri, null)
    account-space-update-staging-lambda  = try(data.aws_lambda_function.account_space_update_staging_lambda.image_uri, null)
    access-copy-dev-lambda               = try(data.aws_lambda_function.access_copy_dev_lambda.image_uri, null)
    access-copy-staging-lambda           = try(data.aws_lambda_function.access_copy_staging_lambda.image_uri, null)
    record-thumbnail-dev-lambda          = try(data.aws_lambda_function.record_thumbnail_dev_lambda.image_uri, null)
    record-thumbnail-staging-lambda      = try(data.aws_lambda_function.record_thumbnail_staging_lambda.image_uri, null)
    trigger-archivematica-dev-lambda     = try(data.aws_lambda_function.trigger_archivematica_dev_lambda.image_uri, null)
    trigger-archivematica-staging-lambda = try(data.aws_lambda_function.trigger_archivematica_staging_lambda.image_uri, null)
  }
  current_images = merge(local.current_kubernetes_images, local.current_lambda_images)

  desired_images = {
    for name, image in local.current_images :
    name => (contains(keys(var.image_overrides), name)
      ? var.image_overrides[name]
      : local.current_images[name]
    )
  }
}
