locals {
  monitor_alerts = {
    cpu = {
      description = "Waves preview CPU above 80% for 10 minutes"
      type        = "v1/insights/droplet/cpu"
      value       = 80
    }
    disk = {
      description = "Waves preview disk use above 80% for 10 minutes"
      type        = "v1/insights/droplet/disk_utilization_percent"
      value       = 80
    }
    memory = {
      description = "Waves preview memory use above 80% for 10 minutes"
      type        = "v1/insights/droplet/memory_utilization_percent"
      value       = 80
    }
  }
}

resource "digitalocean_monitor_alert" "preview" {
  for_each = local.monitor_alerts

  alerts {
    email = [var.monitoring_alert_email]
  }

  compare     = "GreaterThan"
  description = each.value.description
  enabled     = true
  entities    = [digitalocean_droplet.preview.id]
  type        = each.value.type
  value       = each.value.value
  window      = "10m"
}
