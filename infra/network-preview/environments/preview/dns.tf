locals {
  preview_hostnames = toset([
    "forms.shrimpworks.dev",
    "home.shrimpworks.dev",
    "interop.shrimpworks.dev",
  ])
}

resource "cloudflare_dns_record" "preview" {
  for_each = var.publish_preview ? local.preview_hostnames : toset([])

  zone_id = var.cloudflare_zone_id
  name    = each.value
  type    = "A"
  content = digitalocean_reserved_ip.preview.ip_address
  ttl     = 300
  proxied = false
  comment = "Waves network preview; managed by OpenTofu"
}
