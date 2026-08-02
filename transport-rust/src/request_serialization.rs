use crate::{
    FetchRequestIntent, FetchRequestMethod, FetchRequestPolicy, FetchRequestPostField,
    MAX_ENCODED_REQUEST_BODY_BYTES,
};
use encoding_rs::{Encoding, UTF_8};
use mime::CHARSET;
use std::collections::HashMap;
use url::Url;

const FORM_URLENCODED: &str = "application/x-www-form-urlencoded";
const MULTIPART_FORM_DATA: &str = "multipart/form-data";

#[derive(Clone, Debug, PartialEq, Eq)]
pub(crate) struct SerializedFetchRequest {
    pub(crate) url: String,
    pub(crate) method: String,
    pub(crate) headers: HashMap<String, String>,
    pub(crate) body: Option<Vec<u8>>,
    pub(crate) content_type: Option<String>,
}

pub(crate) fn serialize_fetch_request(
    url: &str,
    fallback_method: String,
    mut headers: HashMap<String, String>,
    policy: Option<&FetchRequestPolicy>,
) -> Result<SerializedFetchRequest, String> {
    let Some(intent) = policy.and_then(|policy| policy.request_intent.as_ref()) else {
        return serialize_legacy_request(url, fallback_method, headers, policy);
    };

    let mut parsed = Url::parse(url).map_err(|_| "URL must include a scheme".to_string())?;
    let method = match intent.method {
        FetchRequestMethod::Get => "GET",
        FetchRequestMethod::Post => "POST",
    };
    let enctype = intent.enctype.trim().to_ascii_lowercase();
    if !matches!(enctype.as_str(), FORM_URLENCODED | MULTIPART_FORM_DATA) {
        return Err(format!("Unsupported WML form enctype: {}", intent.enctype));
    }
    if method == "GET" && enctype == MULTIPART_FORM_DATA {
        return Err("GET does not support multipart/form-data".to_string());
    }

    let charset = select_submission_encoding(intent)?;
    let fields = if intent.same_deck && !is_no_cache(policy) {
        &[][..]
    } else {
        intent.post_fields.as_slice()
    };
    if intent.send_referer {
        let referer = policy
            .and_then(|policy| policy.referer_url.as_deref())
            .ok_or_else(|| "sendreferer requires a referring deck URL".to_string())?;
        let referer = smallest_usable_referer(&parsed, referer)?;
        set_header(&mut headers, "Referer", referer);
    } else {
        remove_header(&mut headers, "Referer");
    }

    match method {
        "GET" => {
            let encoded_fields = encode_form_fields(fields, &charset)?;
            if !encoded_fields.is_empty() {
                let query = match parsed.query() {
                    Some(existing) if !existing.is_empty() => {
                        format!("{existing}&{encoded_fields}")
                    }
                    _ => encoded_fields,
                };
                parsed.set_query(Some(&query));
            }
            remove_header(&mut headers, "Content-Type");
            Ok(SerializedFetchRequest {
                url: parsed.to_string(),
                method: method.to_string(),
                headers,
                body: None,
                content_type: None,
            })
        }
        "POST" => {
            let (body, content_type) = match enctype.as_str() {
                FORM_URLENCODED => (
                    encode_form_fields(fields, &charset)?.into_bytes(),
                    format!("{FORM_URLENCODED}; charset={}", charset.label),
                ),
                MULTIPART_FORM_DATA => {
                    let (body, boundary) = encode_multipart_fields(fields, &charset)?;
                    (body, format!("{MULTIPART_FORM_DATA}; boundary={boundary}"))
                }
                _ => unreachable!("validated WML enctypes are closed"),
            };
            set_header(&mut headers, "Content-Type", content_type.clone());
            Ok(SerializedFetchRequest {
                url: parsed.to_string(),
                method: method.to_string(),
                headers,
                body: Some(body),
                content_type: Some(content_type),
            })
        }
        _ => unreachable!("typed WML request methods are closed"),
    }
}

fn serialize_legacy_request(
    url: &str,
    method: String,
    mut headers: HashMap<String, String>,
    policy: Option<&FetchRequestPolicy>,
) -> Result<SerializedFetchRequest, String> {
    let (body, content_type) = if method == "POST" {
        let post_context = policy.and_then(|policy| policy.post_context.as_ref());
        let body = post_context
            .and_then(|post| post.payload.as_ref())
            .map(|payload| {
                if payload.len() > MAX_ENCODED_REQUEST_BODY_BYTES {
                    return Err(format!(
                        "legacy POST body exceeds the {MAX_ENCODED_REQUEST_BODY_BYTES}-byte limit"
                    ));
                }
                Ok(payload.as_bytes().to_vec())
            })
            .transpose()?;
        let content_type = post_context
            .and_then(|post| post.content_type.clone())
            .or_else(|| body.as_ref().map(|_| FORM_URLENCODED.to_string()));
        if let Some(content_type) = content_type.as_ref() {
            set_header(&mut headers, "Content-Type", content_type.clone());
        }
        (body, content_type)
    } else {
        (None, None)
    };
    Ok(SerializedFetchRequest {
        url: url.to_string(),
        method,
        headers,
        body,
        content_type,
    })
}

fn is_no_cache(policy: Option<&FetchRequestPolicy>) -> bool {
    matches!(
        policy.and_then(|policy| policy.cache_control.as_ref()),
        Some(crate::FetchCacheControlPolicy::NoCache)
    )
}

struct SubmissionEncoding {
    encoder: SubmissionEncoder,
    label: String,
}

enum SubmissionEncoder {
    Ascii,
    Latin1,
    Encoding(&'static Encoding),
}

fn select_submission_encoding(intent: &FetchRequestIntent) -> Result<SubmissionEncoding, String> {
    if let Some(accepted) = intent
        .accept_charset
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
    {
        let mut saw_explicit_label = false;
        for label in accepted.split(|character: char| character == ',' || character.is_whitespace())
        {
            let label = label.trim();
            if label.is_empty() || label.eq_ignore_ascii_case("unknown") {
                continue;
            }
            saw_explicit_label = true;
            if let Some(encoder) = submission_encoder(label) {
                return Ok(SubmissionEncoding {
                    encoder,
                    label: label.to_ascii_lowercase(),
                });
            }
        }
        if saw_explicit_label {
            return Err(format!("Unsupported accept-charset list: {accepted}"));
        }
    }

    let source_charset = intent
        .source_content_type
        .as_deref()
        .and_then(source_content_type_charset);
    match source_charset {
        Some(label) => submission_encoder(&label)
            .map(|encoder| SubmissionEncoding {
                encoder,
                label: label.to_ascii_lowercase(),
            })
            .ok_or_else(|| format!("Unsupported referring deck charset: {label}")),
        None => Ok(SubmissionEncoding {
            encoder: SubmissionEncoder::Encoding(UTF_8),
            label: "utf-8".to_string(),
        }),
    }
}

fn submission_encoder(label: &str) -> Option<SubmissionEncoder> {
    match label.trim().to_ascii_lowercase().as_str() {
        "us-ascii" | "ascii" => Some(SubmissionEncoder::Ascii),
        "iso-8859-1" | "latin1" => Some(SubmissionEncoder::Latin1),
        _ => Encoding::for_label(label.as_bytes()).map(SubmissionEncoder::Encoding),
    }
}

fn source_content_type_charset(content_type: &str) -> Option<String> {
    content_type
        .parse::<mime::Mime>()
        .ok()?
        .get_param(CHARSET)
        .map(|value| value.as_str().to_string())
}

fn encode_form_fields(
    fields: &[FetchRequestPostField],
    encoding: &SubmissionEncoding,
) -> Result<String, String> {
    let mut output = String::new();
    for (index, field) in fields.iter().enumerate() {
        let encoded_name = encode_form_component(&field.name, encoding)?;
        let encoded_value = encode_form_component(&field.value, encoding)?;
        let added = usize::from(index > 0)
            .checked_add(encoded_name.len())
            .and_then(|sum| sum.checked_add(1))
            .and_then(|sum| sum.checked_add(encoded_value.len()))
            .ok_or_else(encoded_body_limit_error)?;
        if output
            .len()
            .checked_add(added)
            .is_none_or(|total| total > MAX_ENCODED_REQUEST_BODY_BYTES)
        {
            return Err(encoded_body_limit_error());
        }
        if index > 0 {
            output.push('&');
        }
        output.push_str(&encoded_name);
        output.push('=');
        output.push_str(&encoded_value);
    }
    Ok(output)
}

fn encoded_body_limit_error() -> String {
    format!("encoded request body exceeds the {MAX_ENCODED_REQUEST_BODY_BYTES}-byte limit")
}

pub(crate) fn encoded_request_body_exceeds_limit(policy: Option<&FetchRequestPolicy>) -> bool {
    let Some(intent) = policy.and_then(|policy| policy.request_intent.as_ref()) else {
        return false;
    };
    let Ok(charset) = select_submission_encoding(intent) else {
        return false;
    };
    let fields = if intent.same_deck && !is_no_cache(policy) {
        &[][..]
    } else {
        intent.post_fields.as_slice()
    };
    let result = if intent
        .enctype
        .trim()
        .eq_ignore_ascii_case(MULTIPART_FORM_DATA)
    {
        encode_multipart_fields(fields, &charset).map(|(body, _)| body)
    } else {
        encode_form_fields(fields, &charset).map(String::into_bytes)
    };
    matches!(result, Err(error) if error == encoded_body_limit_error())
}

fn encode_form_component(value: &str, encoding: &SubmissionEncoding) -> Result<String, String> {
    let encoded = encode_submission_bytes(value, encoding)?;
    Ok(url::form_urlencoded::byte_serialize(&encoded).collect())
}

fn encode_submission_bytes(value: &str, encoding: &SubmissionEncoding) -> Result<Vec<u8>, String> {
    match encoding.encoder {
        SubmissionEncoder::Ascii => value
            .chars()
            .map(|character| {
                u8::try_from(character as u32)
                    .ok()
                    .filter(u8::is_ascii)
                    .ok_or_else(|| unrepresentable_charset_error(&encoding.label))
            })
            .collect::<Result<Vec<_>, _>>(),
        SubmissionEncoder::Latin1 => value
            .chars()
            .map(|character| {
                u8::try_from(character as u32)
                    .map_err(|_| unrepresentable_charset_error(&encoding.label))
            })
            .collect::<Result<Vec<_>, _>>(),
        SubmissionEncoder::Encoding(encoder) => {
            let (encoded, _, had_errors) = encoder.encode(value);
            if had_errors {
                return Err(unrepresentable_charset_error(&encoding.label));
            }
            Ok(encoded.into_owned())
        }
    }
}

fn encode_multipart_fields(
    fields: &[FetchRequestPostField],
    encoding: &SubmissionEncoding,
) -> Result<(Vec<u8>, String), String> {
    let encoded_parts = fields
        .iter()
        .map(|field| {
            Ok((
                encode_multipart_name(&field.name, encoding)?,
                encode_submission_bytes(&field.value, encoding)?,
                !field.value.is_ascii(),
            ))
        })
        .collect::<Result<Vec<_>, String>>()?;
    let boundary = choose_multipart_boundary(&encoded_parts)?;
    let mut body = Vec::new();

    for (name, value, needs_charset) in &encoded_parts {
        append_multipart_bytes(&mut body, format!("--{boundary}\r\n").as_bytes())?;
        append_multipart_bytes(&mut body, b"Content-Disposition: form-data; name=\"")?;
        append_multipart_bytes(&mut body, name)?;
        append_multipart_bytes(&mut body, b"\"\r\nContent-Type: text/plain")?;
        if *needs_charset {
            append_multipart_bytes(
                &mut body,
                format!("; charset={}", encoding.label).as_bytes(),
            )?;
        }
        append_multipart_bytes(&mut body, b"\r\n\r\n")?;
        append_multipart_bytes(&mut body, value)?;
        append_multipart_bytes(&mut body, b"\r\n")?;
    }
    append_multipart_bytes(&mut body, format!("--{boundary}--\r\n").as_bytes())?;

    Ok((body, boundary))
}

fn encode_multipart_name(value: &str, encoding: &SubmissionEncoding) -> Result<Vec<u8>, String> {
    let encoded = encode_submission_bytes(value, encoding)?;
    if encoded.iter().any(|byte| matches!(byte, b'\r' | b'\n')) {
        return Err("Multipart field name contains an unsupported line break".to_string());
    }
    let mut escaped = Vec::with_capacity(encoded.len());
    for byte in encoded {
        if matches!(byte, b'\\' | b'\"') {
            escaped.push(b'\\');
        }
        escaped.push(byte);
    }
    Ok(escaped)
}

fn choose_multipart_boundary(parts: &[(Vec<u8>, Vec<u8>, bool)]) -> Result<String, String> {
    for counter in 0..=1024 {
        let candidate = format!("waves-wml-304-{counter}");
        let candidate_bytes = candidate.as_bytes();
        let collides = parts.iter().any(|(name, value, _)| {
            contains_bytes(name, candidate_bytes) || contains_bytes(value, candidate_bytes)
        });
        if !collides {
            return Ok(candidate);
        }
    }
    Err("Unable to construct a collision-free multipart boundary".to_string())
}

fn contains_bytes(haystack: &[u8], needle: &[u8]) -> bool {
    !needle.is_empty()
        && haystack
            .windows(needle.len())
            .any(|window| window == needle)
}

fn append_multipart_bytes(body: &mut Vec<u8>, bytes: &[u8]) -> Result<(), String> {
    if body
        .len()
        .checked_add(bytes.len())
        .is_none_or(|total| total > MAX_ENCODED_REQUEST_BODY_BYTES)
    {
        return Err(encoded_body_limit_error());
    }
    body.extend_from_slice(bytes);
    Ok(())
}

fn unrepresentable_charset_error(label: &str) -> String {
    format!("Value cannot be represented in submission charset {label}")
}

fn smallest_usable_referer(target: &Url, referring_url: &str) -> Result<String, String> {
    let mut referer = Url::parse(referring_url)
        .map_err(|_| "sendreferer requires an absolute referring deck URL".to_string())?;
    let _ = referer.set_username("");
    let _ = referer.set_password(None);
    referer.set_fragment(None);

    if let Some(relative) = target.make_relative(&referer) {
        if !relative.is_empty() {
            return Ok(relative);
        }
        return Ok(referer
            .path_segments()
            .and_then(|mut segments| segments.rfind(|segment| !segment.is_empty()))
            .filter(|segment| !segment.is_empty())
            .unwrap_or("./")
            .to_string());
    }
    Ok(referer.to_string())
}

fn set_header(headers: &mut HashMap<String, String>, name: &str, value: String) {
    remove_header(headers, name);
    headers.insert(name.to_string(), value);
}

fn remove_header(headers: &mut HashMap<String, String>, name: &str) {
    headers.retain(|candidate, _| !candidate.eq_ignore_ascii_case(name));
}

#[cfg(test)]
mod tests;
