locals {
  bootstrap_script = templatefile("${path.module}/../../cloud-init/bootstrap.sh.tftpl", {
    admin_ufw_rules = ""
    wap_ufw_rules   = ""
  })

  user_data = templatefile("${path.module}/../../cloud-init/user-data.yaml.tftpl", {
    admin_public_key   = jsonencode("ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOfflineValidationOnly")
    bootstrap_script   = indent(6, local.bootstrap_script)
    tailscale_auth_key = jsonencode("tskey-auth-offline-validation")
  })

  cloud_config   = yamldecode(local.user_data)
  bootstrap_file = one([for file in local.cloud_config.write_files : file if file.path == "/usr/local/sbin/waves-bootstrap"])
  auth_key_file  = one([for file in local.cloud_config.write_files : file if file.path == "/run/waves-tailscale-auth-key"])
}

check "rendered_cloud_init_contract" {
  assert {
    condition = (
      startswith(local.bootstrap_file.content, "#!/usr/bin/env sh\n") &&
      strcontains(local.bootstrap_file.content, "tailscale up") &&
      strcontains(local.bootstrap_file.content, "tag:waves-preview") &&
      local.auth_key_file.permissions == "0600"
    )
    error_message = "rendered cloud-init must contain a valid bootstrap script and protected one-off Tailscale key"
  }
}
