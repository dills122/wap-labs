#[cfg(test)]
use crate::wbxml_decoder::decode_wml13;
use crate::wbxml_decoder::{decode_wbxml_with_charset, Vocabulary, WML13_DECODER_ID};
use mime::{Mime, CHARSET};

const MAX_DECODED_WBXML_BYTES: usize = 2 * 1024 * 1024;

#[cfg(test)]
pub(crate) fn decode_wmlc(payload: &[u8]) -> Result<String, String> {
    decode_wml13(payload, MAX_DECODED_WBXML_BYTES)
}

#[cfg(test)]
pub(crate) fn decode_wbxml_for_content_type(
    payload: &[u8],
    content_type: &str,
) -> Result<String, String> {
    decode_for_content_type(payload, content_type, None)
}

pub(crate) fn decode_wml_wbxml_for_content_type(
    payload: &[u8],
    content_type: &str,
) -> Result<String, String> {
    decode_for_content_type(payload, content_type, Some(Vocabulary::Wml13))
}

fn decode_for_content_type(
    payload: &[u8],
    content_type: &str,
    generic_vocabulary: Option<Vocabulary>,
) -> Result<String, String> {
    let media_type = content_type
        .parse::<Mime>()
        .map_err(|error| format!("WBXML decode failed: invalid MIME media type: {error}"))?;
    let expected_vocabulary = match media_type.essence_str() {
        "application/vnd.wap.wmlc" => Some(Vocabulary::Wml13),
        "application/vnd.wap.sic" => Some(Vocabulary::ServiceIndication10),
        "application/vnd.wap.wbxml" => generic_vocabulary,
        unsupported => {
            return Err(format!(
                "WBXML decode failed: MIME media type {unsupported:?} has no selected token table"
            ))
        }
    };
    let external_charset = media_type.get_param(CHARSET).map(|value| value.as_str());
    decode_wbxml_with_charset(
        payload,
        MAX_DECODED_WBXML_BYTES,
        external_charset,
        expected_vocabulary,
    )
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

    #[test]
    fn wml_307_generic_wbxml_routes_to_non_wml_si_token_table_and_defaults() {
        let si = b"\x03\x05\x6a\x00\x45\x46\x03hello\x00\x01\x01";
        let decoded = decode_wbxml_for_content_type(si, "application/vnd.wap.wbxml")
            .expect("generic media type should use the SI public identifier");
        assert_eq!(
            decoded,
            "<si><indication action=\"signal-medium\">hello</indication></si>"
        );

        let typed = decode_wbxml_for_content_type(si, "application/vnd.wap.sic")
            .expect("SI media type should select the same table");
        assert_eq!(typed, decoded);
    }

    #[test]
    fn wml_307_si_binary_and_literal_tokens_are_equivalent() {
        let binary = b"\x03\x05\x6a\x00\x45\xc6\x07\x01\x03hello\x00\x01\x01";
        let mut literal =
            b"\x03\x05\x6a\x23si\x00indication\x00action\x00signal-medium\x00".to_vec();
        literal.extend_from_slice(b"\x44\x00\xc4\x03\x04\x0e\x83\x15\x01\x03hello\x00\x01\x01");

        let binary_xml = decode_wbxml_for_content_type(binary, "application/vnd.wap.sic")
            .expect("binary SI tokens should decode");
        let literal_xml = decode_wbxml_for_content_type(&literal, "application/vnd.wap.sic")
            .expect("literal SI tokens should decode");
        assert_eq!(binary_xml, literal_xml);
        assert_eq!(
            binary_xml,
            "<si><indication action=\"signal-medium\">hello</indication></si>"
        );
    }

    #[test]
    fn wml_307_typed_wbxml_rejects_conflicting_public_identifier() {
        let si = b"\x03\x05\x6a\x00\x05";
        let error = decode_wbxml_for_content_type(si, "application/vnd.wap.wmlc")
            .expect_err("WMLC MIME typing must not decode with the SI token table");
        assert!(error.contains("MIME media type selects WML 1.3"));
        assert!(error.contains("public identifier selects SI 1.0"));
    }

    #[test]
    fn wml_307_wbxml_shift_jis_charset_maps_strings_to_unicode() {
        let (encoded, _, had_errors) = encoding_rs::SHIFT_JIS.encode("テスト");
        assert!(!had_errors);
        let mut si = b"\x03\x05\x11\x00\x45\x46\x03".to_vec();
        si.extend_from_slice(encoded.as_ref());
        si.extend_from_slice(b"\x00\x01\x01");

        let decoded = decode_wbxml_for_content_type(&si, "application/vnd.wap.wbxml")
            .expect("source-pinned Shift_JIS MIBenum should decode");
        assert_eq!(
            decoded,
            "<si><indication action=\"signal-medium\">テスト</indication></si>"
        );
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
