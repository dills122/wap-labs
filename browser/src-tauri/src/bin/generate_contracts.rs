use std::fs;
use std::path::PathBuf;

use lowband_transport_rust::{
    EngineDeckInputPayload, FetchCacheControlPolicy, FetchDeckRequest, FetchDeckResponse,
    FetchDestinationPolicy, FetchErrorInfo, FetchPostContext, FetchRequestIntent,
    FetchRequestMethod, FetchRequestPolicy, FetchRequestPostField, FetchTiming,
    FetchUaCapabilityProfile,
};
use ts_rs::{Config, TS};
use wavenav_engine::engine_debug_typescript_contract;
use wavenav_engine::SCRIPT_ERROR_CATEGORY_METADATA;
use wavenav_host_lib::command_contract::{
    render_default_capability, render_host_permission, TauriCommandDescriptor, TAURI_COMMANDS,
};
use wavenav_host_lib::contract_types::{
    AdvanceTimeRequest, DeckNavigationKind, DrawCmd, EngineDebugBufferSnapshot,
    EngineDebugCapabilities, EngineDebugCloseSessionOutcome, EngineDebugCloseSessionRequest,
    EngineDebugCloseSessionResult, EngineDebugCollectionSummary, EngineDebugError,
    EngineDebugErrorCode, EngineDebugEvent, EngineDebugEventBatch, EngineDebugEventKind,
    EngineDebugEventPayload, EngineDebugExternalNavigationSnapshot, EngineDebugMaskingPolicy,
    EngineDebugNamedValue, EngineDebugOpenSessionOutcome, EngineDebugOpenSessionRequest,
    EngineDebugPollEventsOutcome, EngineDebugPollEventsRequest, EngineDebugPostfieldResolution,
    EngineDebugPostfieldResolutionSource, EngineDebugRedactionReason, EngineDebugSession,
    EngineDebugSnapshot, EngineDebugSnapshotOutcome, EngineDebugSnapshotRequest,
    EngineDebugTimerSnapshot, EngineDebugTimestampKind, EngineDebugValue, EngineFrame, EngineKey,
    EngineRuntimeSnapshot, ExternalNavigationCacheControlPolicySnapshot,
    ExternalNavigationMethodSnapshot, ExternalNavigationPostContextSnapshot,
    ExternalNavigationPostFieldSnapshot, ExternalNavigationRequestIntentSnapshot,
    ExternalNavigationRequestPolicySnapshot, HandleKeyRequest, LoadDeckContextRequest,
    LoadDeckRequest, MoveFocusedSelectEditRequest, NavigateToCardRequest, RenderList,
    ScriptDialogRequestSnapshot, ScriptTimerRequestSnapshot, SetFocusedInputEditDraftRequest,
    SetViewportColsRequest,
};

fn push_decl<T: TS>(out: &mut String) {
    let cfg = Config::default();
    out.push_str("export ");
    out.push_str(&T::decl(&cfg));
    out.push_str("\n\n");
}

fn contracts_out_dir() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../contracts/generated")
}

fn command_type_json(
    command_type: wavenav_host_lib::command_contract::CommandType,
) -> serde_json::Value {
    serde_json::json!({
        "name": command_type.name,
        "source": command_type.source.as_str(),
    })
}

fn command_descriptor_json(descriptor: &TauriCommandDescriptor) -> serde_json::Value {
    serde_json::json!({
        "command": descriptor.command,
        "clientMethod": descriptor.client_method,
        "parameter": descriptor.parameter.map(|parameter| serde_json::json!({
            "name": parameter.name,
            "type": command_type_json(parameter.ty),
        })),
        "response": command_type_json(descriptor.response),
        "facadeMethod": descriptor.facade_method.map(|facade| serde_json::json!({
            "facade": facade.facade.as_str(),
            "method": facade.method,
        })),
    })
}

fn write_tauri_command_contract() -> Result<(), Box<dyn std::error::Error>> {
    let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let descriptor_path = contracts_out_dir().join("tauri-command-contract.json");
    let descriptor = serde_json::json!({
        "schemaVersion": 1,
        "generatedBy": "cargo run --bin generate_contracts",
        "source": "browser/src-tauri/src/command_contract.rs",
        "commands": TAURI_COMMANDS
            .iter()
            .map(command_descriptor_json)
            .collect::<Vec<_>>(),
    });
    fs::write(
        &descriptor_path,
        format!("{}\n", serde_json::to_string_pretty(&descriptor)?),
    )?;
    println!("generated {}", descriptor_path.display());

    let permission_path = manifest_dir.join("permissions/waves-host.toml");
    if let Some(parent) = permission_path.parent() {
        fs::create_dir_all(parent)?;
    }
    fs::write(&permission_path, render_host_permission())?;
    println!("generated {}", permission_path.display());

    let capability_path = manifest_dir.join("capabilities/default.json");
    fs::write(&capability_path, render_default_capability())?;
    println!("generated {}", capability_path.display());
    Ok(())
}

fn render_script_error_category_labels(
    categories: &[(&str, Option<&str>)],
) -> Result<String, String> {
    let mut output = String::from(
        "export const SCRIPT_ERROR_CATEGORY_LABELS: Readonly<Record<string, string>> = {\n",
    );
    for (literal, label) in categories {
        let Some(label) = label else {
            if *literal == "none" {
                continue;
            }
            return Err(format!(
                "script error category `{literal}` is missing a label"
            ));
        };
        let literal = serde_json::to_string(literal).map_err(|err| err.to_string())?;
        let label = serde_json::to_string(label).map_err(|err| err.to_string())?;
        output.push_str(&format!("  {literal}: {label},\n"));
    }
    output.push_str("};\n\n");
    Ok(output)
}

fn render_engine_contracts() -> Result<String, Box<dyn std::error::Error>> {
    let mut output = String::new();
    output.push_str("// AUTO-GENERATED FILE. DO NOT EDIT.\n");
    output.push_str("// Generated by: cargo run --bin generate_contracts\n\n");

    push_decl::<EngineKey>(&mut output);
    push_decl::<DeckNavigationKind>(&mut output);
    push_decl::<LoadDeckRequest>(&mut output);
    push_decl::<LoadDeckContextRequest>(&mut output);
    push_decl::<HandleKeyRequest>(&mut output);
    push_decl::<NavigateToCardRequest>(&mut output);
    push_decl::<SetViewportColsRequest>(&mut output);
    push_decl::<AdvanceTimeRequest>(&mut output);
    push_decl::<SetFocusedInputEditDraftRequest>(&mut output);
    push_decl::<MoveFocusedSelectEditRequest>(&mut output);
    push_decl::<ScriptDialogRequestSnapshot>(&mut output);
    push_decl::<ScriptTimerRequestSnapshot>(&mut output);
    push_decl::<ExternalNavigationCacheControlPolicySnapshot>(&mut output);
    push_decl::<ExternalNavigationMethodSnapshot>(&mut output);
    push_decl::<ExternalNavigationPostFieldSnapshot>(&mut output);
    push_decl::<ExternalNavigationRequestIntentSnapshot>(&mut output);
    push_decl::<ExternalNavigationPostContextSnapshot>(&mut output);
    push_decl::<ExternalNavigationRequestPolicySnapshot>(&mut output);
    push_decl::<EngineRuntimeSnapshot>(&mut output);
    push_decl::<EngineFrame>(&mut output);
    push_decl::<EngineDebugMaskingPolicy>(&mut output);
    push_decl::<EngineDebugTimestampKind>(&mut output);
    push_decl::<EngineDebugRedactionReason>(&mut output);
    push_decl::<EngineDebugValue>(&mut output);
    push_decl::<EngineDebugNamedValue>(&mut output);
    push_decl::<EngineDebugPostfieldResolutionSource>(&mut output);
    push_decl::<EngineDebugPostfieldResolution>(&mut output);
    push_decl::<EngineDebugEventKind>(&mut output);
    push_decl::<EngineDebugEventPayload>(&mut output);
    push_decl::<EngineDebugEvent>(&mut output);
    push_decl::<EngineDebugBufferSnapshot>(&mut output);
    push_decl::<EngineDebugCollectionSummary>(&mut output);
    push_decl::<EngineDebugTimerSnapshot>(&mut output);
    push_decl::<EngineDebugExternalNavigationSnapshot>(&mut output);
    push_decl::<EngineDebugSnapshot>(&mut output);
    push_decl::<EngineDebugCapabilities>(&mut output);
    push_decl::<EngineDebugOpenSessionRequest>(&mut output);
    push_decl::<EngineDebugSession>(&mut output);
    push_decl::<EngineDebugPollEventsRequest>(&mut output);
    push_decl::<EngineDebugEventBatch>(&mut output);
    push_decl::<EngineDebugSnapshotRequest>(&mut output);
    push_decl::<EngineDebugCloseSessionRequest>(&mut output);
    push_decl::<EngineDebugCloseSessionResult>(&mut output);
    push_decl::<EngineDebugErrorCode>(&mut output);
    push_decl::<EngineDebugError>(&mut output);
    push_decl::<EngineDebugOpenSessionOutcome>(&mut output);
    push_decl::<EngineDebugPollEventsOutcome>(&mut output);
    push_decl::<EngineDebugSnapshotOutcome>(&mut output);
    push_decl::<EngineDebugCloseSessionOutcome>(&mut output);
    output.push_str(&engine_debug_typescript_contract());
    output.push('\n');
    push_decl::<DrawCmd>(&mut output);
    push_decl::<RenderList>(&mut output);
    output.push_str(
        &render_script_error_category_labels(SCRIPT_ERROR_CATEGORY_METADATA)
            .map_err(std::io::Error::other)?,
    );

    Ok(output)
}

fn write_engine_contracts() -> Result<(), Box<dyn std::error::Error>> {
    let out_path = contracts_out_dir().join("engine-host.ts");
    if let Some(parent) = out_path.parent() {
        fs::create_dir_all(parent)?;
    }

    fs::write(&out_path, render_engine_contracts()?)?;
    println!("generated {}", out_path.display());
    Ok(())
}

fn write_transport_contracts() -> Result<(), Box<dyn std::error::Error>> {
    let out_path = contracts_out_dir().join("transport-host.ts");
    let mut output = String::new();
    output.push_str("// AUTO-GENERATED FILE. DO NOT EDIT.\n");
    output.push_str("// Generated by: cargo run --bin generate_contracts\n\n");

    push_decl::<FetchCacheControlPolicy>(&mut output);
    push_decl::<FetchDestinationPolicy>(&mut output);
    push_decl::<FetchPostContext>(&mut output);
    push_decl::<FetchRequestMethod>(&mut output);
    push_decl::<FetchRequestPostField>(&mut output);
    push_decl::<FetchRequestIntent>(&mut output);
    push_decl::<FetchUaCapabilityProfile>(&mut output);
    push_decl::<FetchRequestPolicy>(&mut output);
    push_decl::<FetchDeckRequest>(&mut output);
    push_decl::<FetchTiming>(&mut output);
    push_decl::<FetchErrorInfo>(&mut output);
    push_decl::<EngineDeckInputPayload>(&mut output);
    push_decl::<FetchDeckResponse>(&mut output);

    fs::write(&out_path, output)?;
    println!("generated {}", out_path.display());
    Ok(())
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    write_engine_contracts()?;
    write_transport_contracts()?;
    write_tauri_command_contract()?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn renders_rust_owned_script_error_category_labels() {
        let output = render_script_error_category_labels(SCRIPT_ERROR_CATEGORY_METADATA)
            .expect("the engine category metadata must generate");

        assert_eq!(
            output,
            concat!(
                "export const SCRIPT_ERROR_CATEGORY_LABELS: ",
                "Readonly<Record<string, string>> = {\n",
                "  \"computational\": \"computation error\",\n",
                "  \"integrity\": \"data integrity error\",\n",
                "  \"resource\": \"resource limit error\",\n",
                "  \"host-binding\": \"host binding error\",\n",
                "};\n\n"
            )
        );
    }

    #[test]
    fn rejects_non_fallback_script_error_category_without_label() {
        let error =
            render_script_error_category_labels(&[("none", None), ("future-category", None)])
                .expect_err("an unlabeled non-fallback category must fail contract generation");

        assert_eq!(
            error.to_string(),
            "script error category `future-category` is missing a label"
        );
    }

    #[test]
    fn generates_debug_contract_without_adding_host_commands() {
        let output = render_engine_contracts().expect("engine contracts should render");

        assert!(output.contains("export const ENGINE_DEBUG_CONTRACT_BASELINE"));
        assert!(output.contains("export interface EngineDebugConnector"));
        assert!(output.contains("EngineDebugOpenSessionOutcome"));
        assert!(output.contains("EngineDebugSnapshotOutcome"));
        assert!(TAURI_COMMANDS
            .iter()
            .all(|descriptor| !descriptor.command.contains("debug")));
    }
}
