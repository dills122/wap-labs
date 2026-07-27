variable "state_encryption_passphrase" {
  description = "Offline-only passphrase used to prove plan encryption."
  type        = string
  sensitive   = true
}

terraform {
  encryption {
    key_provider "pbkdf2" "offline" {
      passphrase = var.state_encryption_passphrase
    }

    method "aes_gcm" "offline" {
      keys = key_provider.pbkdf2.offline
    }

    plan {
      method   = method.aes_gcm.offline
      enforced = true
    }
  }
}
