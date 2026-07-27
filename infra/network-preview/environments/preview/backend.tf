variable "state_encryption_passphrase" {
  description = "Protected passphrase used to encrypt OpenTofu state and plan data."
  type        = string
  sensitive   = true
  ephemeral   = true
}

terraform {
  backend "s3" {
    region                      = "auto"
    use_lockfile                = true
    use_path_style              = true
    skip_credentials_validation = true
    skip_metadata_api_check     = true
    skip_region_validation      = true
    skip_requesting_account_id  = true
    skip_s3_checksum            = true
  }

  encryption {
    key_provider "pbkdf2" "network_preview" {
      passphrase               = var.state_encryption_passphrase
      key_length               = 32
      iterations               = 600000
      encrypted_metadata_alias = "network-preview-v1"
    }

    method "aes_gcm" "network_preview" {
      keys = key_provider.pbkdf2.network_preview
    }

    state {
      method   = method.aes_gcm.network_preview
      enforced = true
    }

    plan {
      method   = method.aes_gcm.network_preview
      enforced = true
    }
  }
}
