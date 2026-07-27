variable "project_name" {
  description = "Accepted DigitalOcean project name from PRE-003."
  type        = string
}

variable "region" {
  description = "Accepted DigitalOcean region from PRE-001."
  type        = string

  validation {
    condition     = length(trimspace(var.region)) > 0
    error_message = "region must not be empty"
  }
}
