locals {
  required_dev_images = [
    "access-copy-dev-lambda",
    "account-space-update-dev-lambda",
    "folder-size-update-dev-lambda",
    "archivematica-cleanup-dev",
    "file-url-refresh-dev",
    "metadata-attacher-dev-lambda",
    "record-thumbnail-dev-lambda",
    "stela-dev",
    "thumbnail-refresh-dev",
    "trigger-archivematica-dev-lambda",
  ]
  required_staging_images = [
    "access-copy-staging-lambda",
    "account-space-update-staging-lambda",
    "folder-size-update-staging-lambda",
    "archivematica-cleanup-staging",
    "file-url-refresh-staging",
    "metadata-attacher-staging-lambda",
    "record-thumbnail-staging-lambda",
    "stela-staging",
    "thumbnail-refresh-staging",
    "trigger-archivematica-staging-lambda",
  ]

  need_dev_images     = length(setsubtract(local.required_dev_images, keys(var.image_overrides))) > 0
  need_staging_images = length(setsubtract(local.required_staging_images, keys(var.image_overrides))) > 0

  current_kubernetes_images = merge(
    try({ for container in data.kubernetes_resource.stela_dev[0].object.spec.template.spec.containers : container.name => container.image }, {}),
    try({ for container in data.kubernetes_resource.stela_staging[0].object.spec.template.spec.containers : container.name => container.image }, {}),
    try({ for container in data.kubernetes_resource.archivematica_cleanup_dev[0].object.spec.jobTemplate.spec.template.spec.containers : container.name => container.image }, {}),
    try({ for container in data.kubernetes_resource.archivematica_cleanup_staging[0].object.spec.jobTemplate.spec.template.spec.containers : container.name => container.image }, {}),
    try({ for container in data.kubernetes_resource.thumbnail_refresh_dev[0].object.spec.jobTemplate.spec.template.spec.containers : container.name => container.image }, {}),
    try({ for container in data.kubernetes_resource.thumbnail_refresh_staging[0].object.spec.jobTemplate.spec.template.spec.containers : container.name => container.image }, {}),
    try({ for container in data.kubernetes_resource.file_url_refresh_dev[0].object.spec.jobTemplate.spec.template.spec.containers : container.name => container.image }, {}),
    try({ for container in data.kubernetes_resource.file_url_refresh_staging[0].object.spec.jobTemplate.spec.template.spec.containers : container.name => container.image }, {}),
  )
  current_lambda_images = {
    account-space-update-dev-lambda      = try(data.aws_lambda_function.account_space_update_dev_lambda[0].image_uri, null)
    account-space-update-staging-lambda  = try(data.aws_lambda_function.account_space_update_staging_lambda[0].image_uri, null)
    folder-size-update-dev-lambda        = try(data.aws_lambda_function.folder_size_update_dev_lambda[0].image_uri, null)
    folder-size-update-staging-lambda    = try(data.aws_lambda_function.folder_size_update_staging_lambda[0].image_uri, null)
    access-copy-dev-lambda               = try(data.aws_lambda_function.access_copy_dev_lambda[0].image_uri, null)
    access-copy-staging-lambda           = try(data.aws_lambda_function.access_copy_staging_lambda[0].image_uri, null)
    metadata-attacher-dev-lambda         = try(data.aws_lambda_function.metadata_attacher_dev_lambda[0].image_uri, null)
    metadata-attacher-staging-lambda     = try(data.aws_lambda_function.metadata_attacher_staging_lambda[0].image_uri, null)
    record-thumbnail-dev-lambda          = try(data.aws_lambda_function.record_thumbnail_dev_lambda[0].image_uri, null)
    record-thumbnail-staging-lambda      = try(data.aws_lambda_function.record_thumbnail_staging_lambda[0].image_uri, null)
    trigger-archivematica-dev-lambda     = try(data.aws_lambda_function.trigger_archivematica_dev_lambda[0].image_uri, null)
    trigger-archivematica-staging-lambda = try(data.aws_lambda_function.trigger_archivematica_staging_lambda[0].image_uri, null)
  }
  current_images = merge(local.current_kubernetes_images, local.current_lambda_images)

  desired_images = merge(local.current_images, var.image_overrides)
}
