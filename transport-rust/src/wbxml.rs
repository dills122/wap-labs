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
