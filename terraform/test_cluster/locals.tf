locals {
  current_stela_dev_containers     = try(data.kubernetes_resource.stela_dev.manifest.spec.template.spec.containers)
  current_stela_staging_containers = try(data.kubernetes_resource.stela_staging.manifest.spec.template.spec.containers)

  current_stela_dev_images     = { for container in local.current_stela_dev_containers : container.name => container.image }
  current_stela_staging_images = { for container in local.current_stela_staging_containers : container.name => container.image }

  desired_stela_dev_images = {
    for name, image in local.current_stela_dev_images :
    name => (contains(keys(var.image_overrides), name)
      ? var.image_overrides[name]
      : local.current_stela_dev_images[name]
    )
  }
  desired_stela_staging_images = {
    for name, image in local.current_stela_staging_images :
    name => (contains(keys(var.image_overrides), name)
      ? var.image_overrides[name]
      : local.current_stela_staging_images[name]
    )
  }
}
