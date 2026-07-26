#[cfg(test)]
use crate::wbxml_decoder::decode_wml13;
use crate::wbxml_decoder::{decode_wml13_with_charset, WML13_DECODER_ID};
use mime::{Mime, CHARSET};

const MAX_DECODED_WBXML_BYTES: usize = 2 * 1024 * 1024;

#[cfg(test)]
pub(crate) fn decode_wmlc(payload: &[u8]) -> Result<String, String> {
    decode_wml13(payload, MAX_DECODED_WBXML_BYTES)
}

pub(crate) fn decode_wbxml_for_content_type(
    payload: &[u8],
    content_type: &str,
) -> Result<String, String> {
    let media_type = content_type
        .parse::<Mime>()
        .map_err(|error| format!("WBXML decode failed: invalid MIME media type: {error}"))?;
    if media_type.essence_str() != "application/vnd.wap.wmlc" {
        return Err(format!(
            "WBXML decode failed: MIME media type {:?} has no selected token table",
            media_type.essence_str()
        ));
    }
    let external_charset = media_type.get_param(CHARSET).map(|value| value.as_str());
    decode_wml13_with_charset(payload, MAX_DECODED_WBXML_BYTES, external_charset)
}

pub fn preflight_wbxml_decoder() -> Result<String, String> {
    Ok(WML13_DECODER_ID.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn decode_wbxml_for_content_type_rejects_media_types_without_a_token_table() {
        let error = decode_wbxml_for_content_type(&[], "application/json")
            .expect_err("unsupported media type should be rejected before decoding");
        assert!(error.contains("no selected token table"));
    }

    // Fuzz-lite regression probe, per `docs/agents/RUST_TRANSPORT_STEERING.md`
    // #12. `decode_wbxml_for_content_type` is `pub(crate)`, so it can't be
    // reached from an integration test under `tests/` (see
    // `tests/fuzz_lite_decoders.rs` for the sibling probe over the fully
    // `pub` WCMP/WDP/WSP decoders, which duplicates this file's small
    // mutate/RNG helpers rather than exposing them as public API just to
    // share ~30 lines of test-only scaffolding). This is the crate's
    // largest and lowest-coverage untrusted-input decoder, so it gets its
    // own copy here instead.
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

    fn mutate_once(rng: &mut Xorshift64, seed: &[u8]) -> Vec<u8> {
        let mut out = seed.to_vec();
        match rng.range(4) {
            0 if !out.is_empty() => {
                let idx = rng.range(out.len());
                out[idx] ^= 1u8 << rng.range(8);
            }
            1 if !out.is_empty() => {
                let idx = rng.range(out.len());
                out[idx] = (rng.next() % 256) as u8;
            }
            2 if !out.is_empty() => {
                let cut = rng.range(out.len());
                out.truncate(cut);
            }
            _ => {
                let idx = rng.range(out.len() + 1);
                let extra = rng.range(8) + 1;
                let bytes: Vec<u8> = (0..extra).map(|_| (rng.next() % 256) as u8).collect();
                out.splice(idx..idx, bytes);
            }
        }
        out
    }

    fn mutate(rng: &mut Xorshift64, seed: &[u8]) -> Vec<u8> {
        let steps = rng.range(4) + 1;
        let mut out = seed.to_vec();
        for _ in 0..steps {
            out = mutate_once(rng, &out);
        }
        out
    }

    fn wbxml_sample_corpus() -> Vec<Vec<u8>> {
        let root = std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("wbxml_samples");
        let mut samples: Vec<Vec<u8>> = std::fs::read_dir(&root)
            .expect("wbxml_samples directory should be readable")
            .filter_map(Result::ok)
            .map(|entry| entry.path())
            .filter(|path| path.extension().and_then(|ext| ext.to_str()) == Some("wbxml"))
            .map(|path| std::fs::read(&path).unwrap_or_else(|_| panic!("failed reading {path:?}")))
            .collect();
        samples.sort();
        samples
    }

    #[test]
    #[ignore = "slow fuzz-lite pass (~9.5M decode calls); run manually with --release"]
    fn decode_wbxml_for_content_type_never_panics_on_mutated_valid_wbxml() {
        let seeds = wbxml_sample_corpus();
        assert!(!seeds.is_empty(), "expected at least one .wbxml sample");

        let mut rng = Xorshift64(0x9E3779B97F4A7C15);
        let mut panics: Vec<String> = Vec::new();
        const MUTATIONS_PER_SEED: usize = 500_000;

        for seed in &seeds {
            for _ in 0..MUTATIONS_PER_SEED {
                let input = mutate(&mut rng, seed);
                let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
                    let _ = decode_wbxml_for_content_type(&input, "application/vnd.wap.wmlc");
                }));
                if let Err(payload) = result {
                    let message = payload
                        .downcast_ref::<&str>()
                        .map(|s| s.to_string())
                        .or_else(|| payload.downcast_ref::<String>().cloned())
                        .unwrap_or_else(|| "<non-string panic payload>".to_string());
                    panics.push(format!("panicked on {input:?}: {message}"));
                }
            }
        }

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
}
