variable "project_name" {
  description = "Existing DigitalOcean project that will own the preview resources."
  type        = string

  validation {
    condition     = length(trimspace(var.project_name)) > 0
    error_message = "project_name must not be empty"
  }
}

variable "region" {
  description = "Accepted Northeast-US DigitalOcean region."
  type        = string

  validation {
    condition     = contains(["nyc3", "nyc1"], var.region)
    error_message = "region must be nyc3 or nyc1"
  }
}

variable "droplet_size" {
  description = "Explicit preview Droplet size; the 1 GiB fallback is never selected automatically."
  type        = string
  default     = "s-1vcpu-512mb-10gb"

  validation {
    condition     = contains(["s-1vcpu-512mb-10gb", "s-1vcpu-1gb"], var.droplet_size)
    error_message = "droplet_size must be the approved 512 MiB size or explicit 1 GiB fallback"
  }
}

variable "droplet_image" {
  description = "Pinned DigitalOcean base image slug for the disposable preview host."
  type        = string
  default     = "ubuntu-24-04-x64"

  validation {
    condition     = var.droplet_image == "ubuntu-24-04-x64"
    error_message = "droplet_image must remain ubuntu-24-04-x64 until an intentional image update"
  }
}

variable "ssh_key_name" {
  description = "Name of the existing DigitalOcean SSH key injected for the non-root waves operator."
  type        = string

  validation {
    condition     = length(trimspace(var.ssh_key_name)) > 0
    error_message = "ssh_key_name must not be empty"
  }
}

variable "admin_cidrs" {
  description = "IPv4 CIDRs allowed to administer the preview over SSH; public or broad ranges are rejected."
  type        = set(string)

  validation {
    condition = length(var.admin_cidrs) > 0 && alltrue([
      for cidr in var.admin_cidrs :
      can(cidrnetmask(cidr)) && can(regex("/(2[4-9]|3[0-2])$", cidr)) && cidr != "0.0.0.0/0"
    ])
    error_message = "admin_cidrs must contain only valid IPv4 /24 through /32 networks and must never be public"
  }
}

variable "wap_test_cidrs" {
  description = "Optional narrow IPv4 CIDRs allowed to test UDP 9200 before public publication."
  type        = set(string)
  default     = []

  validation {
    condition = alltrue([
      for cidr in var.wap_test_cidrs :
      can(cidrnetmask(cidr)) && can(regex("/(2[4-9]|3[0-2])$", cidr)) && cidr != "0.0.0.0/0"
    ])
    error_message = "wap_test_cidrs must contain only valid IPv4 /24 through /32 networks and must never be public"
  }
}

variable "monitoring_alert_email" {
  description = "Owner email for free DigitalOcean CPU, memory, and disk alerts."
  type        = string

  validation {
    condition     = can(regex("^[^@[:space:]]+@[^@[:space:]]+\\.[^@[:space:]]+$", var.monitoring_alert_email))
    error_message = "monitoring_alert_email must be a valid email address"
  }
}

variable "cloudflare_zone_id" {
  description = "Cloudflare zone ID for shrimpworks.dev; required only when publishing the preview."
  type        = string
  default     = ""

  validation {
    condition     = !var.publish_preview || can(regex("^[0-9a-f]{32}$", var.cloudflare_zone_id))
    error_message = "cloudflare_zone_id must be a 32-character lowercase hexadecimal ID when publish_preview is true"
  }
}

variable "publish_preview" {
  description = "Explicitly opens public UDP 9200 and creates the three DNS-only preview records."
  type        = bool
  default     = false
}
