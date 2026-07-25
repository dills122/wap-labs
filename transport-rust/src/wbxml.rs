use crate::wbxml_decoder::{decode_wml13, WML13_DECODER_ID};

const MAX_DECODED_WBXML_BYTES: usize = 2 * 1024 * 1024;

pub(crate) fn decode_wmlc(payload: &[u8]) -> Result<String, String> {
    decode_wml13(payload, MAX_DECODED_WBXML_BYTES)
}

pub fn preflight_wbxml_decoder() -> Result<String, String> {
    Ok(WML13_DECODER_ID.to_string())
}
