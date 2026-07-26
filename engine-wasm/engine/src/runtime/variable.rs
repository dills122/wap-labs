use std::collections::HashMap;

use percent_encoding::{percent_decode_str, utf8_percent_encode, AsciiSet, NON_ALPHANUMERIC};

const RFC2396_ESCAPE_SET: &AsciiSet = &NON_ALPHANUMERIC
    .remove(b'-')
    .remove(b'_')
    .remove(b'.')
    .remove(b'!')
    .remove(b'~')
    .remove(b'*')
    .remove(b'\'')
    .remove(b'(')
    .remove(b')');

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub(crate) enum SubstitutionContext {
    VData,
    Href,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum Conversion {
    Escape,
    NoEscape,
    Unescape,
}

pub(crate) fn validate(raw: &str) -> Result<(), String> {
    scan(raw, |_| Ok(String::new())).map(|_| ())
}

pub(crate) fn validate_literal_only(raw: &str) -> Result<(), String> {
    scan(raw, |_| {
        Err("variable references are not allowed in this attribute".to_string())
    })
    .map(|_| ())
}

pub(crate) fn decode_literal_dollars(raw: &str) -> Result<String, String> {
    scan(raw, |_| {
        Err("variable references are not allowed in this attribute".to_string())
    })
}

pub(crate) fn evaluate(
    raw: &str,
    vars: &HashMap<String, String>,
    context: SubstitutionContext,
) -> Result<String, String> {
    scan(raw, |reference| {
        let value = vars
            .get(reference.name)
            .map(String::as_str)
            .unwrap_or_default();
        let conversion = reference.conversion.unwrap_or(match context {
            SubstitutionContext::VData => Conversion::NoEscape,
            SubstitutionContext::Href => Conversion::Escape,
        });
        Ok(match conversion {
            Conversion::Escape => utf8_percent_encode(value, RFC2396_ESCAPE_SET).to_string(),
            Conversion::NoEscape => value.to_string(),
            Conversion::Unescape => percent_decode_str(value).decode_utf8_lossy().into_owned(),
        })
    })
}

#[derive(Clone, Copy)]
struct Reference<'a> {
    name: &'a str,
    conversion: Option<Conversion>,
}

fn scan(
    raw: &str,
    mut resolve: impl FnMut(Reference<'_>) -> Result<String, String>,
) -> Result<String, String> {
    let mut out = String::with_capacity(raw.len());
    let mut cursor = 0usize;
    while cursor < raw.len() {
        let Some(relative_dollar) = raw[cursor..].find('$') else {
            out.push_str(&raw[cursor..]);
            break;
        };
        let dollar = cursor + relative_dollar;
        out.push_str(&raw[cursor..dollar]);
        let after_dollar = dollar + 1;
        let remainder = &raw[after_dollar..];

        if remainder.starts_with('$') {
            out.push('$');
            cursor = after_dollar + 1;
            continue;
        }

        if let Some(parenthesized) = remainder.strip_prefix('(') {
            let close = parenthesized
                .find(')')
                .ok_or_else(|| "unterminated parenthesized variable reference".to_string())?;
            let body = &parenthesized[..close];
            let (name, conversion) = parse_parenthesized(body)?;
            out.push_str(&resolve(Reference { name, conversion })?);
            cursor = after_dollar + 1 + close + 1;
            continue;
        }

        let name_len = variable_name_len(remainder)?;
        let name = &remainder[..name_len];
        out.push_str(&resolve(Reference {
            name,
            conversion: None,
        })?);
        cursor = after_dollar + name_len;
    }
    Ok(out)
}

fn parse_parenthesized(body: &str) -> Result<(&str, Option<Conversion>), String> {
    let (name, conversion) = match body.split_once(':') {
        Some((name, conversion)) => (name, Some(parse_conversion(conversion)?)),
        None => (body, None),
    };
    if variable_name_len(name)? != name.len() {
        return Err("variable name contains an illegal character".to_string());
    }
    Ok((name, conversion))
}

fn variable_name_len(value: &str) -> Result<usize, String> {
    let mut bytes = value.bytes();
    let first = bytes
        .next()
        .ok_or_else(|| "variable name must not be empty".to_string())?;
    if !(first.is_ascii_alphabetic() || first == b'_') {
        return Err("variable name must start with an ASCII letter or underscore".to_string());
    }
    Ok(1 + bytes
        .take_while(|byte| byte.is_ascii_alphanumeric() || *byte == b'_')
        .count())
}

fn parse_conversion(value: &str) -> Result<Conversion, String> {
    if value.eq_ignore_ascii_case("escape") || value.eq_ignore_ascii_case("e") {
        return Ok(Conversion::Escape);
    }
    if value.eq_ignore_ascii_case("noesc") || value.eq_ignore_ascii_case("n") {
        return Ok(Conversion::NoEscape);
    }
    if value.eq_ignore_ascii_case("unesc") || value.eq_ignore_ascii_case("u") {
        return Ok(Conversion::Unescape);
    }
    Err(format!("unsupported variable conversion '{value}'"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn evaluates_reference_forms_defaults_and_deprecated_conversions() {
        let vars = HashMap::from([
            ("Raw".to_string(), "A B/C?D=E&F".to_string()),
            ("Encoded".to_string(), "A%20B%2FC%3FD%3DE%26F".to_string()),
        ]);
        assert_eq!(
            evaluate("$Raw", &vars, SubstitutionContext::VData).as_deref(),
            Ok("A B/C?D=E&F")
        );
        assert_eq!(
            evaluate("$(Raw)", &vars, SubstitutionContext::Href).as_deref(),
            Ok("A%20B%2FC%3FD%3DE%26F")
        );
        assert_eq!(
            evaluate("$(Raw:E)", &vars, SubstitutionContext::VData).as_deref(),
            Ok("A%20B%2FC%3FD%3DE%26F")
        );
        assert_eq!(
            evaluate("$(Raw:NoEsC)", &vars, SubstitutionContext::Href).as_deref(),
            Ok("A B/C?D=E&F")
        );
        assert_eq!(
            evaluate("$(Encoded:U)", &vars, SubstitutionContext::VData).as_deref(),
            Ok("A B/C?D=E&F")
        );
        assert_eq!(
            evaluate("x$(Missing)y", &vars, SubstitutionContext::VData).as_deref(),
            Ok("xy")
        );
        assert_eq!(
            evaluate("$$$(Missing)", &vars, SubstitutionContext::VData).as_deref(),
            Ok("$")
        );
    }

    #[test]
    fn validates_names_conversions_and_literal_only_locations() {
        for valid in ["$name", "$_name9", "$(Name_9:escape)", "$$"] {
            assert!(validate(valid).is_ok(), "{valid}");
        }
        for invalid in ["$", "$9bad", "$(bad-name)", "$(name:esc)", "$(name"] {
            assert!(validate(invalid).is_err(), "{invalid}");
        }
        assert!(validate_literal_only("literal $$ value").is_ok());
        assert!(validate_literal_only("literal $value").is_err());
        assert_eq!(
            decode_literal_dollars("literal $$ value").as_deref(),
            Ok("literal $ value")
        );
    }
}
