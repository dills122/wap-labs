locals {
  preview_hostnames = toset([
    "forms.wap.shrimpworks.dev",
    "home.wap.shrimpworks.dev",
    "interop.wap.shrimpworks.dev",
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
