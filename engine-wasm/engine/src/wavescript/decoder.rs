pub const MAX_COMPILATION_UNIT_BYTES: usize = 64 * 1024;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct DecodeLimits {
    pub max_unit_bytes: usize,
}

impl Default for DecodeLimits {
    fn default() -> Self {
        Self {
            max_unit_bytes: MAX_COMPILATION_UNIT_BYTES,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum DecodeError {
    EmptyUnit,
    UnitTooLarge { size: usize, limit: usize },
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct DecodedUnit {
    bytes: Vec<u8>,
}

impl DecodedUnit {
    pub fn bytes(&self) -> &[u8] {
        &self.bytes
    }
}

pub fn decode_compilation_unit(bytes: &[u8]) -> Result<DecodedUnit, DecodeError> {
    decode_compilation_unit_with_limits(bytes, DecodeLimits::default())
}

pub fn decode_compilation_unit_with_limits(
    bytes: &[u8],
    limits: DecodeLimits,
) -> Result<DecodedUnit, DecodeError> {
    if bytes.is_empty() {
        return Err(DecodeError::EmptyUnit);
    }

    if bytes.len() > limits.max_unit_bytes {
        return Err(DecodeError::UnitTooLarge {
            size: bytes.len(),
            limit: limits.max_unit_bytes,
        });
    }

    Ok(DecodedUnit {
        bytes: bytes.to_vec(),
    })
}

#[cfg(test)]
mod tests {
    use super::{
        decode_compilation_unit, decode_compilation_unit_with_limits, DecodeError, DecodeLimits,
        DecodedUnit, MAX_COMPILATION_UNIT_BYTES,
    };

    #[test]
    fn decode_rejects_empty_input() {
        let err = decode_compilation_unit(&[]).expect_err("empty unit must be rejected");
        assert_eq!(err, DecodeError::EmptyUnit);
    }

    #[test]
    fn decode_rejects_oversized_input() {
        let bytes = vec![0; MAX_COMPILATION_UNIT_BYTES + 1];
        let err = decode_compilation_unit(&bytes).expect_err("oversized unit must fail");
        assert_eq!(
            err,
            DecodeError::UnitTooLarge {
                size: MAX_COMPILATION_UNIT_BYTES + 1,
                limit: MAX_COMPILATION_UNIT_BYTES,
            }
        );
    }

    #[test]
    fn decode_preserves_valid_bytes() {
        let expected = vec![0x10, 0x20, 0x00];
        let decoded = decode_compilation_unit(&expected).expect("valid bytes should decode");
        assert_eq!(
            decoded,
            DecodedUnit {
                bytes: expected.clone(),
            }
        );
        assert_eq!(decoded.bytes(), expected.as_slice());
    }

    #[test]
    fn decode_accepts_unit_at_exact_size_limit() {
        let bytes = vec![0xaa; MAX_COMPILATION_UNIT_BYTES];
        let decoded = decode_compilation_unit(&bytes).expect("max-sized unit should decode");
        assert_eq!(decoded.bytes().len(), MAX_COMPILATION_UNIT_BYTES);
    }

    #[test]
    fn decode_respects_custom_bounds() {
        let limits = DecodeLimits { max_unit_bytes: 3 };

        let ok = decode_compilation_unit_with_limits(&[0x00, 0x00, 0x00], limits)
            .expect("unit at custom limit should decode");
        assert_eq!(ok.bytes(), &[0x00, 0x00, 0x00]);

        let err = decode_compilation_unit_with_limits(&[0x00, 0x00, 0x00, 0x00], limits)
            .expect_err("unit above custom limit should fail");
        assert_eq!(err, DecodeError::UnitTooLarge { size: 4, limit: 3 });
    }
}
