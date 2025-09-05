locals {
	current_images = {
		stela_dev_image = data.kubernetes_deployment.stela_dev.spec[0].template[0].spec[0].container[0].image
		stela_staging_image = data.kubernetes_deployment.stela_staging.spec[0].template[0].spec[0].container[0].image
	}
	desired_images = merge(local.current_image, var.image_overrides)
}
