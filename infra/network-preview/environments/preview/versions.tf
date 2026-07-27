terraform {
  required_version = "= 1.12.5"

  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "= 2.96.0"
    }
  }
}
