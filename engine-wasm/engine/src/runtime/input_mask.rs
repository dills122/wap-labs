#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum FormatCode {
    LowerAlpha,
    UpperAlpha,
    Numeric,
    UpperAlphaNumeric,
    NumericPunctuation,
    LowerAlphaNumeric,
    General,
}

impl FormatCode {
    fn parse(value: char) -> Option<Self> {
        match value {
            'a' => Some(Self::LowerAlpha),
            'A' => Some(Self::UpperAlpha),
            'N' => Some(Self::Numeric),
            'X' => Some(Self::UpperAlphaNumeric),
            'n' => Some(Self::NumericPunctuation),
            'x' => Some(Self::LowerAlphaNumeric),
            'M' | 'm' => Some(Self::General),
            _ => None,
        }
    }

    fn accepts(self, value: char) -> bool {
        let punctuation_or_symbol = value.is_ascii_punctuation();
        match self {
            Self::LowerAlpha => value.is_ascii_lowercase() || punctuation_or_symbol,
            Self::UpperAlpha => value.is_ascii_uppercase() || punctuation_or_symbol,
            Self::Numeric => value.is_ascii_digit(),
            Self::UpperAlphaNumeric => {
                value.is_ascii_uppercase() || value.is_ascii_digit() || punctuation_or_symbol
            }
            Self::NumericPunctuation => value.is_ascii_digit() || punctuation_or_symbol,
            Self::LowerAlphaNumeric => {
                value.is_ascii_lowercase() || value.is_ascii_digit() || punctuation_or_symbol
            }
            Self::General => value == ' ' || value.is_ascii_graphic(),
        }
    }
}

#[derive(Clone, Debug, PartialEq, Eq)]
enum MaskPart {
    Required(FormatCode),
    Literal(char),
    Repeat {
        code: FormatCode,
        minimum: usize,
        maximum: Option<usize>,
    },
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub(crate) struct InputMask {
    parts: Vec<MaskPart>,
}

impl Default for InputMask {
    fn default() -> Self {
        Self {
            parts: vec![MaskPart::Repeat {
                code: FormatCode::General,
                minimum: 0,
                maximum: None,
            }],
        }
    }
}

impl InputMask {
    pub(crate) fn parse(raw: &str) -> Option<Self> {
        if raw.is_empty() {
            return None;
        }

        let mut chars = raw.chars().peekable();
        let mut parts = Vec::new();
        while let Some(current) = chars.next() {
            match current {
                '\\' => {
                    let literal = chars.next()?;
                    parts.push(MaskPart::Literal(literal));
                }
                '*' => {
                    let code = FormatCode::parse(chars.next()?)?;
                    if chars.peek().is_some() {
                        return None;
                    }
                    parts.push(MaskPart::Repeat {
                        code,
                        minimum: 0,
                        maximum: None,
                    });
                }
                '1'..='9' => {
                    let code = FormatCode::parse(chars.next()?)?;
                    if chars.peek().is_some() {
                        return None;
                    }
                    parts.push(MaskPart::Repeat {
                        code,
                        minimum: 1,
                        maximum: current.to_digit(10).map(|value| value as usize),
                    });
                }
                value => parts.push(MaskPart::Required(FormatCode::parse(value)?)),
            }
        }

        Some(Self { parts })
    }

    pub(crate) fn accepts(&self, value: &str) -> bool {
        let mut chars = value.chars();
        for part in &self.parts {
            match part {
                MaskPart::Required(code) => {
                    if !chars.next().is_some_and(|value| code.accepts(value)) {
                        return false;
                    }
                }
                MaskPart::Literal(expected) => {
                    if chars.next() != Some(*expected) {
                        return false;
                    }
                }
                MaskPart::Repeat {
                    code,
                    minimum,
                    maximum,
                } => {
                    let remaining = chars.by_ref().collect::<Vec<_>>();
                    if remaining.len() < *minimum
                        || maximum.is_some_and(|maximum| remaining.len() > maximum)
                    {
                        return false;
                    }
                    return remaining.into_iter().all(|value| code.accepts(value));
                }
            }
        }
        chars.next().is_none()
    }

    pub(crate) fn allows_empty(&self) -> bool {
        self.accepts("")
    }

    pub(crate) fn obscure(&self, value: &str) -> String {
        let mut chars = value.chars();
        let mut obscured = String::new();
        for part in &self.parts {
            match part {
                MaskPart::Required(_) => {
                    if chars.next().is_some() {
                        obscured.push('*');
                    }
                }
                MaskPart::Literal(expected) => match chars.next() {
                    Some(actual) if actual == *expected => obscured.push(actual),
                    Some(_) => obscured.push('*'),
                    None => {}
                },
                MaskPart::Repeat { .. } => {
                    obscured.extend(chars.by_ref().map(|_| '*'));
                    return obscured;
                }
            }
        }
        obscured.extend(chars.map(|_| '*'));
        obscured
    }
}

#[cfg(test)]
mod tests {
    use super::InputMask;

    #[test]
    fn format_codes_partition_the_required_basic_latin_repertoire() {
        let cases = [
            ('a', "a!?", "A09 "),
            ('A', "A!?", "a09 "),
            ('N', "09", "aA!? "),
            ('X', "A09!?", "a "),
            ('n', "09!?", "aA "),
            ('x', "a09!?", "A "),
            ('M', "aA09!? ", "\n"),
            ('m', "aA09!? ", "\n"),
        ];

        for (code, accepted, rejected) in cases {
            let mask = InputMask::parse(&code.to_string()).expect("code should be valid");
            for value in accepted.chars() {
                assert!(
                    mask.accepts(&value.to_string()),
                    "{code} rejected {value:?}"
                );
            }
            for value in rejected.chars() {
                assert!(
                    !mask.accepts(&value.to_string()),
                    "{code} accepted {value:?}"
                );
            }
        }
    }

    #[test]
    fn generated_numeric_values_obey_terminal_repeat_bounds() {
        for maximum in 1..=9 {
            let mask =
                InputMask::parse(&format!("{maximum}N")).expect("numeric repeat should be valid");
            for length in 0..=10 {
                let value = "7".repeat(length);
                assert_eq!(
                    mask.accepts(&value),
                    (1..=maximum).contains(&length),
                    "maximum={maximum}, length={length}"
                );
            }
        }
    }

    #[test]
    fn invalid_masks_are_rejected_for_defaulting_by_the_parser() {
        for invalid in ["", "\\", "*", "*NMore", "0N", "2", "2N3N", "-", "NN*"] {
            assert_eq!(InputMask::parse(invalid), None, "mask {invalid:?}");
        }
    }

    #[test]
    fn escaped_literals_are_required_and_preserved_in_accepted_values() {
        let mask = InputMask::parse(r"NNNNN\-3N").expect("mask should be valid");
        assert!(mask.accepts("12345-1"));
        assert!(mask.accepts("12345-123"));
        assert!(!mask.accepts("12345123"));
        assert!(!mask.accepts("12345-"));
        assert!(!mask.accepts("12345-1234"));
        assert_eq!(mask.obscure("12345-123"), "*****-***");
    }
}
