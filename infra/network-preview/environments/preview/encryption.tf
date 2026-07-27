variable "state_encryption_passphrase" {
  description = "Protected passphrase used to encrypt OpenTofu state and plan data."
  type        = string
  sensitive   = true
  ephemeral   = true
}

terraform {
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
