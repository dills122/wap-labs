#[path = "src/command_contract.rs"]
#[allow(dead_code, unused_imports)]
mod command_contract;

fn main() {
    tauri_build::try_build(tauri_build::Attributes::new().app_manifest(
        tauri_build::AppManifest::new().commands(command_contract::TAURI_COMMAND_NAMES),
    ))
    .expect("failed to build Tauri host metadata")
}
