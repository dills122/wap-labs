output "bootstrap_status" {
  description = "Reports whether the staged host is private or explicitly published."
  value       = var.publish_preview ? "public-wap-preview" : "hardened-host-only"
}

output "droplet_id" {
  description = "DigitalOcean identifier for the disposable preview host."
  value       = digitalocean_droplet.preview.id
}

output "reserved_ipv4_address" {
  description = "Stable IPv4 address assigned to the preview host."
  value       = digitalocean_reserved_ip.preview.ip_address
}

output "ssh_command" {
  description = "Routine private administration command using Tailscale MagicDNS."
  value       = "ssh waves@waves-network-preview"
}

output "published_hostnames" {
  description = "Exact DNS-only WAP hostnames, empty until publish_preview is explicitly enabled."
  value       = sort(keys(cloudflare_dns_record.preview))
}
