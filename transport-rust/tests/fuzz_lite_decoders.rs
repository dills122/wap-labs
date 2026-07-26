//! Fuzz-lite regression probe for the untrusted-input decoders, per
//! `docs/agents/RUST_TRANSPORT_STEERING.md` #12 ("Add property-based or
//! fuzz coverage for new byte parsers when it materially improves malformed
//! input coverage"). No `cargo-fuzz`/`proptest` toolchain is set up in this
//! repo, so this is a dependency-free, deterministic substitute: it
//! mutation-fuzzes every public decoder that accepts untrusted network
//! input, seeded from real encoded bytes already in this repo's fixtures
//! (bit flips, byte substitutions, truncation, extension), asserting only
//! that none of them panic. Pure-random bytes rarely get past a format's
//! leading type/length checks; mutating a valid packet exercises much
//! deeper decoder logic.
//!
//! `#[ignore]`d (manual-only, like the other exploratory/slow tests in this
//! crate) because ~9.5M decode calls take a couple of seconds even in
//! release mode and add no value to the default `cargo test` loop. Run
//! explicitly with:
//! `cargo test --release --test fuzz_lite_decoders -- --ignored`

use lowband_transport_rust::network::wcmp::{
    decode_wcmp, decode_wdp_control_message, WdpControlProfile,
};
use lowband_transport_rust::network::wdp::decode_cdpd_ipv4_udp;
use lowband_transport_rust::network::wsp::{decode_wsp_pdu, WspHeaderBlockDecodePolicy};

struct Xorshift64(u64);

impl Xorshift64 {
    fn next(&mut self) -> u64 {
        let mut x = self.0;
        x ^= x << 13;
        x ^= x >> 7;
        x ^= x << 17;
        self.0 = x;
        x
    }

    fn range(&mut self, bound: usize) -> usize {
        if bound == 0 {
            0
        } else {
            (self.next() as usize) % bound
        }
    }
}

fn mutate(rng: &mut Xorshift64, seed: &[u8]) -> Vec<u8> {
    let mut out = seed.to_vec();
    let steps = rng.range(4) + 1;
    for _ in 0..steps {
        out = mutate_once(rng, &out);
    }
    out
}

fn mutate_once(rng: &mut Xorshift64, seed: &[u8]) -> Vec<u8> {
    let mut out = seed.to_vec();
    match rng.range(4) {
        0 if !out.is_empty() => {
            // Flip a random bit.
            let idx = rng.range(out.len());
            let bit = 1u8 << rng.range(8);
            out[idx] ^= bit;
        }
        1 if !out.is_empty() => {
            // Overwrite a random byte with a random value.
            let idx = rng.range(out.len());
            out[idx] = (rng.next() % 256) as u8;
        }
        2 if !out.is_empty() => {
            // Truncate at a random point.
            let cut = rng.range(out.len());
            out.truncate(cut);
        }
        _ => {
            // Insert random bytes at a random position.
            let idx = rng.range(out.len() + 1);
            let extra = rng.range(8) + 1;
            let mut bytes = Vec::with_capacity(extra);
            for _ in 0..extra {
                bytes.push((rng.next() % 256) as u8);
            }
            out.splice(idx..idx, bytes);
        }
    }
    out
}

fn load_seeds(fixture_relative_path: &str, cases_key: &str) -> Vec<Vec<u8>> {
    let manifest_dir = std::env::var("CARGO_MANIFEST_DIR").unwrap();
    let path = std::path::Path::new(&manifest_dir)
        .join("tests/fixtures/transport")
        .join(fixture_relative_path);
    let text = std::fs::read_to_string(&path)
        .unwrap_or_else(|err| panic!("failed to read {}: {err}", path.display()));
    let value: serde_json::Value =
        serde_json::from_str(&text).unwrap_or_else(|err| panic!("failed to parse {path:?}: {err}"));
    value[cases_key]
        .as_array()
        .unwrap_or_else(|| panic!("{cases_key} missing or not an array in {path:?}"))
        .iter()
        .filter_map(|case| case.get("encoded"))
        .filter_map(|encoded| encoded.as_array())
        .map(|bytes| {
            bytes
                .iter()
                .map(|b| b.as_u64().expect("byte value") as u8)
                .collect()
        })
        .collect()
}

#[test]
#[ignore = "slow fuzz-lite pass (~9.5M decode calls); run manually with --release"]
fn decoders_never_panic_on_mutated_valid_packets() {
    let wcmp_seeds = load_seeds("wcmp_core_mapped/wcmp_fixture.json", "cases");
    let icmp_seeds = load_seeds("wcmp_cdpd_icmp_profile/icmp_fixture.json", "cases");
    let wdp_seeds = load_seeds("wdp_cdpd_ipv4_mapped/wdp_fixture.json", "cases");
    let wsp_pdu_seeds = load_seeds("wsp_pdu_baseline_mapped/pdu_fixture.json", "successCases");

    assert!(!wcmp_seeds.is_empty());
    assert!(!icmp_seeds.is_empty());
    assert!(!wdp_seeds.is_empty());
    assert!(!wsp_pdu_seeds.is_empty());

    let mut rng = Xorshift64(0x9E3779B97F4A7C15);
    let mut panics: Vec<String> = Vec::new();
    const MUTATIONS_PER_SEED: usize = 500_000;

    macro_rules! fuzz {
        ($label:literal, $seeds:expr, $call:expr) => {
            for seed in &$seeds {
                for _ in 0..MUTATIONS_PER_SEED {
                    let input = mutate(&mut rng, seed);
                    let call = &$call;
                    let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
                        call(&input);
                    }));
                    if let Err(payload) = result {
                        let message = payload
                            .downcast_ref::<&str>()
                            .map(|s| s.to_string())
                            .or_else(|| payload.downcast_ref::<String>().cloned())
                            .unwrap_or_else(|| "<non-string panic payload>".to_string());
                        panics.push(format!("{}: panicked on {input:?}: {message}", $label));
                    }
                }
            }
        };
    }

    fuzz!("decode_wcmp", wcmp_seeds, |b: &[u8]| {
        let _ = decode_wcmp(b);
    });
    fuzz!(
        "decode_wdp_control_message(CdpdIpv4Strict)",
        icmp_seeds,
        |b: &[u8]| {
            let _ = decode_wdp_control_message(WdpControlProfile::CdpdIpv4Strict, b);
        }
    );
    fuzz!(
        "decode_wdp_control_message(GeneralWcmpNonIp)",
        wcmp_seeds,
        |b: &[u8]| {
            let _ = decode_wdp_control_message(WdpControlProfile::GeneralWcmpNonIp, b);
        }
    );
    fuzz!("decode_cdpd_ipv4_udp", wdp_seeds, |b: &[u8]| {
        let _ = decode_cdpd_ipv4_udp(b);
    });
    fuzz!("decode_wsp_pdu", wsp_pdu_seeds, |b: &[u8]| {
        let _ = decode_wsp_pdu(b, WspHeaderBlockDecodePolicy::STRICT);
    });

    assert!(
        panics.is_empty(),
        "found {} panics (showing up to 20):\n{}",
        panics.len(),
        panics
            .iter()
            .take(20)
            .cloned()
            .collect::<Vec<_>>()
            .join("\n")
    );
}
