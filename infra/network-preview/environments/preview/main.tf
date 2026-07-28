data "digitalocean_project" "selected" {
  name = var.project_name
}

data "digitalocean_ssh_key" "admin" {
  name = var.ssh_key_name
}

locals {
  preview_name = "waves-network-preview"

  admin_ufw_rules = join("\n", [
    for cidr in sort(tolist(var.admin_cidrs)) :
    "ufw allow from ${cidr} to any port 22 proto tcp"
  ])

  wap_ufw_rules = var.publish_preview ? "ufw allow 9200/udp" : join("\n", [
    for cidr in sort(tolist(var.wap_test_cidrs)) :
    "ufw allow from ${cidr} to any port 9200 proto udp"
  ])

  bootstrap_script = templatefile("${path.module}/../../cloud-init/bootstrap.sh.tftpl", {
    admin_ufw_rules = local.admin_ufw_rules
    wap_ufw_rules   = local.wap_ufw_rules
  })

  docker_firewall_script = file("${path.module}/../../../../deploy/network-preview/bin/waves-docker-firewall")
  docker_firewall_unit   = file("${path.module}/../../../../deploy/network-preview/systemd/waves-docker-firewall.service")

  user_data = templatefile("${path.module}/../../cloud-init/user-data.yaml.tftpl", {
    admin_public_key       = jsonencode(data.digitalocean_ssh_key.admin.public_key)
    bootstrap_script       = indent(6, local.bootstrap_script)
    docker_firewall_script = indent(6, local.docker_firewall_script)
    docker_firewall_unit   = indent(6, local.docker_firewall_unit)
    tailscale_auth_key     = jsonencode(var.tailscale_auth_key)
  })
}

resource "digitalocean_tag" "preview" {
  name = local.preview_name
}

resource "digitalocean_droplet" "preview" {
  name              = local.preview_name
  image             = var.droplet_image
  region            = var.region
  size              = var.droplet_size
  ssh_keys          = [data.digitalocean_ssh_key.admin.id]
  tags              = [digitalocean_tag.preview.name]
  user_data         = local.user_data
  backups           = false
  ipv6              = false
  monitoring        = true
  droplet_agent     = true
  graceful_shutdown = true
  public_networking = true
  resize_disk       = false

  lifecycle {
    precondition {
      condition     = data.digitalocean_project.selected.is_default
      error_message = "project_name must resolve to the existing DigitalOcean default project"
    }

    # Cloud-init is creation-only and contains a one-off key that is revoked after enrollment.
    ignore_changes = [user_data]
  }
}

resource "digitalocean_reserved_ip" "preview" {
  region     = digitalocean_droplet.preview.region
  droplet_id = digitalocean_droplet.preview.id
}

resource "digitalocean_firewall" "preview" {
  name        = "${local.preview_name}-firewall"
  droplet_ids = [digitalocean_droplet.preview.id]

  dynamic "inbound_rule" {
    for_each = length(var.admin_cidrs) > 0 ? [true] : []

    content {
      protocol         = "tcp"
      port_range       = "22"
      source_addresses = var.admin_cidrs
    }
  }

  dynamic "inbound_rule" {
    for_each = var.publish_preview || length(var.wap_test_cidrs) > 0 ? [true] : []

    content {
      protocol         = "udp"
      port_range       = "9200"
      source_addresses = var.publish_preview ? ["0.0.0.0/0"] : var.wap_test_cidrs
    }
  }

  outbound_rule {
    protocol              = "tcp"
    port_range            = "53"
    destination_addresses = ["0.0.0.0/0"]
  }

  outbound_rule {
    protocol              = "udp"
    port_range            = "53"
    destination_addresses = ["0.0.0.0/0"]
  }

  outbound_rule {
    protocol              = "tcp"
    port_range            = "80"
    destination_addresses = ["0.0.0.0/0"]
  }

  outbound_rule {
    protocol              = "tcp"
    port_range            = "443"
    destination_addresses = ["0.0.0.0/0"]
  }

  outbound_rule {
    protocol              = "udp"
    port_range            = "123"
    destination_addresses = ["0.0.0.0/0"]
  }

  outbound_rule {
    protocol              = "icmp"
    destination_addresses = ["0.0.0.0/0"]
  }
}
