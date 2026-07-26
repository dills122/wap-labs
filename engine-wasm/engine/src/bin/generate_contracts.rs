use wavenav_engine::contract_codegen::{runtime_contract_path, write_runtime_contract};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let output = runtime_contract_path();
    write_runtime_contract(&output)?;
    println!("generated {}", output.display());
    Ok(())
}
