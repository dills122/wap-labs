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

/// Bounds a single `evaluate`/`scan` call's output. Without this, a deck can
/// amplify a variable reference into an unbounded allocation in one
/// evaluation -- either by chaining many substitutions in one attribute
/// (single-pass amplification) or by repeatedly doubling a variable's own
/// value through itself via a repeating timer/refresh (e.g.
/// `<setvar name="X" value="$(X)$(X)"/>`), since each such evaluation only
/// needs to stay under this bound to succeed, capping the growth rate.
pub(crate) const MAX_SUBSTITUTION_OUTPUT_BYTES: usize = 64 * 1024;

/// Bounds the aggregate size (all keys + all values) of the browser-context
/// variable store, independent of any single substitution. Many separately
/// under-`MAX_SUBSTITUTION_OUTPUT_BYTES` values (e.g. a `<select multiple>`
/// with many deck-controlled option values) could otherwise still sum to an
/// unbounded total.
pub(crate) const MAX_AGGREGATE_VAR_STORE_BYTES: usize = 1024 * 1024;

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

pub(crate) fn is_valid_name(name: &str) -> bool {
    variable_name_len(name).is_ok_and(|len| len == name.len())
}

/// Applies `assignments` to `vars` atomically: if the resulting aggregate
/// store size would exceed [`MAX_AGGREGATE_VAR_STORE_BYTES`], none of them
/// are applied and a stable error is returned instead. Used for every
/// deck/script-controlled write into the variable store so many
/// individually-bounded values can't still sum to an unbounded total.
pub(crate) fn checked_apply_assignments(
    vars: &mut HashMap<String, String>,
    assignments: &[(String, String)],
) -> Result<(), String> {
    if assignments.is_empty() {
        return Ok(());
    }
    let mut projected = vars.clone();
    for (name, value) in assignments {
        projected.insert(name.clone(), value.clone());
    }
    let total_bytes: usize = projected.iter().map(|(k, v)| k.len() + v.len()).sum();
    if total_bytes > MAX_AGGREGATE_VAR_STORE_BYTES {
        return Err(format!(
            "variable store would exceed the {MAX_AGGREGATE_VAR_STORE_BYTES}-byte aggregate budget"
        ));
    }
    *vars = projected;
    Ok(())
}

pub(crate) fn checked_insert(
    vars: &mut HashMap<String, String>,
    name: String,
    value: String,
) -> Result<(), String> {
    checked_apply_assignments(vars, &[(name, value)])
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
    let mut out = String::with_capacity(raw.len().min(MAX_SUBSTITUTION_OUTPUT_BYTES));
    let mut cursor = 0usize;
    while cursor < raw.len() {
        let Some(relative_dollar) = raw[cursor..].find('$') else {
            push_bounded(&mut out, &raw[cursor..])?;
            break;
        };
        let dollar = cursor + relative_dollar;
        push_bounded(&mut out, &raw[cursor..dollar])?;
        let after_dollar = dollar + 1;
        let remainder = &raw[after_dollar..];

        if remainder.starts_with('$') {
            push_bounded(&mut out, "$")?;
            cursor = after_dollar + 1;
            continue;
        }

        if let Some(parenthesized) = remainder.strip_prefix('(') {
            let close = parenthesized
                .find(')')
                .ok_or_else(|| "unterminated parenthesized variable reference".to_string())?;
            let body = &parenthesized[..close];
            let (name, conversion) = parse_parenthesized(body)?;
            push_bounded(&mut out, &resolve(Reference { name, conversion })?)?;
            cursor = after_dollar + 1 + close + 1;
            continue;
        }

        let name_len = variable_name_len(remainder)?;
        let name = &remainder[..name_len];
        push_bounded(
            &mut out,
            &resolve(Reference {
                name,
                conversion: None,
            })?,
        )?;
        cursor = after_dollar + name_len;
    }
    Ok(out)
}

/// Appends `piece` to `out`, failing before the append if doing so would
/// cross [`MAX_SUBSTITUTION_OUTPUT_BYTES`] -- the check runs before the
/// push, so the bound is enforced without ever allocating past it.
fn push_bounded(out: &mut String, piece: &str) -> Result<(), String> {
    if out.len().saturating_add(piece.len()) > MAX_SUBSTITUTION_OUTPUT_BYTES {
        return Err(format!(
            "variable substitution exceeds {MAX_SUBSTITUTION_OUTPUT_BYTES}-byte output limit"
        ));
    }
    out.push_str(piece);
    Ok(())
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

    #[test]
    fn evaluate_accepts_output_exactly_at_the_substitution_limit() {
        let value = "x".repeat(MAX_SUBSTITUTION_OUTPUT_BYTES);
        let vars = HashMap::from([("V".to_string(), value.clone())]);
        let result =
            evaluate("$(V)", &vars, SubstitutionContext::VData).expect("exact-limit output ok");
        assert_eq!(result.len(), MAX_SUBSTITUTION_OUTPUT_BYTES);
        assert_eq!(result, value);
    }

    #[test]
    fn evaluate_rejects_output_one_byte_over_the_substitution_limit() {
        let value = "x".repeat(MAX_SUBSTITUTION_OUTPUT_BYTES + 1);
        let vars = HashMap::from([("V".to_string(), value)]);
        let error = evaluate("$(V)", &vars, SubstitutionContext::VData)
            .expect_err("over-limit output must fail deterministically");
        assert!(error.contains(&MAX_SUBSTITUTION_OUTPUT_BYTES.to_string()));
    }

    #[test]
    fn evaluate_rejects_single_pass_amplification_via_many_references() {
        // Below any deck/value-size limit individually, but the fully
        // resolved output (2,000 * 40 bytes = 80,000) crosses the 64 KiB
        // substitution-output bound in one evaluation.
        let vars = HashMap::from([("A".to_string(), "x".repeat(40))]);
        let raw = "$(A)".repeat(2_000);
        let error = evaluate(&raw, &vars, SubstitutionContext::VData)
            .expect_err("single-pass amplification must fail deterministically");
        assert!(error.contains(&MAX_SUBSTITUTION_OUTPUT_BYTES.to_string()));
    }

    #[test]
    fn checked_apply_assignments_is_atomic_and_bounds_the_aggregate_store() {
        let mut vars = HashMap::new();
        checked_apply_assignments(
            &mut vars,
            &[
                ("a".to_string(), "1".to_string()),
                ("b".to_string(), "2".to_string()),
            ],
        )
        .expect("small assignments stay under budget");
        assert_eq!(vars.get("a").map(String::as_str), Some("1"));
        assert_eq!(vars.get("b").map(String::as_str), Some("2"));

        let oversized = "x".repeat(MAX_AGGREGATE_VAR_STORE_BYTES);
        let error = checked_apply_assignments(
            &mut vars,
            &[
                ("c".to_string(), oversized),
                ("d".to_string(), "should not be applied either".to_string()),
            ],
        )
        .expect_err("assignments exceeding the aggregate budget must be rejected");
        assert!(error.contains(&MAX_AGGREGATE_VAR_STORE_BYTES.to_string()));

        // Atomic: neither "c" nor "d" from the rejected batch was applied,
        // and the pre-existing "a"/"b" entries are untouched.
        assert_eq!(vars.len(), 2);
        assert_eq!(vars.get("a").map(String::as_str), Some("1"));
        assert_eq!(vars.get("b").map(String::as_str), Some("2"));
        assert!(!vars.contains_key("c"));
        assert!(!vars.contains_key("d"));
    }
}
