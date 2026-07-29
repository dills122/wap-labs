use crate::{FetchRequestIntent, FetchRequestMethod, FetchRequestPolicy, FetchRequestPostField};
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
    let encoded_fields = encode_form_fields(fields, &charset)?;

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
            // WAP-191_105 permits clients without multipart support to submit
            // application/x-www-form-urlencoded for a multipart declaration.
            let content_type = format!("{FORM_URLENCODED}; charset={}", charset.label);
            set_header(&mut headers, "Content-Type", content_type.clone());
            Ok(SerializedFetchRequest {
                url: parsed.to_string(),
                method: method.to_string(),
                headers,
                body: Some(encoded_fields.into_bytes()),
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
            .map(|payload| payload.as_bytes().to_vec());
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
        if index > 0 {
            output.push('&');
        }
        output.push_str(&encode_form_component(&field.name, encoding)?);
        output.push('=');
        output.push_str(&encode_form_component(&field.value, encoding)?);
    }
    Ok(output)
}

fn encode_form_component(value: &str, encoding: &SubmissionEncoding) -> Result<String, String> {
    let encoded = match encoding.encoder {
        SubmissionEncoder::Ascii => value
            .chars()
            .map(|character| {
                u8::try_from(character as u32)
                    .ok()
                    .filter(u8::is_ascii)
                    .ok_or_else(|| unrepresentable_charset_error(&encoding.label))
            })
            .collect::<Result<Vec<_>, _>>()?,
        SubmissionEncoder::Latin1 => value
            .chars()
            .map(|character| {
                u8::try_from(character as u32)
                    .map_err(|_| unrepresentable_charset_error(&encoding.label))
            })
            .collect::<Result<Vec<_>, _>>()?,
        SubmissionEncoder::Encoding(encoder) => {
            let (encoded, _, had_errors) = encoder.encode(value);
            if had_errors {
                return Err(unrepresentable_charset_error(&encoding.label));
            }
            encoded.into_owned()
        }
    };
    Ok(url::form_urlencoded::byte_serialize(&encoded).collect())
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
