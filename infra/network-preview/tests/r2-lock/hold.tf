variable "lock_hold_seconds" {
  description = "Bounded delay used to keep the isolated backend lock observable."
  type        = number
  default     = 20

  validation {
    condition     = var.lock_hold_seconds >= 5 && var.lock_hold_seconds <= 60
    error_message = "lock_hold_seconds must be between 5 and 60"
  }
}

resource "terraform_data" "lock_holder" {
  triggers_replace = timestamp()

  provisioner "local-exec" {
    command     = "sleep ${var.lock_hold_seconds}"
    interpreter = ["/bin/sh", "-c"]
  }
}
