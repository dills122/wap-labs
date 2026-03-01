pub const MAX_COMPILATION_UNIT_BYTES: usize = 64 * 1024;

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
    if bytes.is_empty() {
        return Err(DecodeError::EmptyUnit);
    }

    if bytes.len() > MAX_COMPILATION_UNIT_BYTES {
        return Err(DecodeError::UnitTooLarge {
            size: bytes.len(),
            limit: MAX_COMPILATION_UNIT_BYTES,
        });
    }

    Ok(DecodedUnit {
        bytes: bytes.to_vec(),
    })
}

#[cfg(test)]
mod tests {
    use super::{decode_compilation_unit, DecodeError, DecodedUnit, MAX_COMPILATION_UNIT_BYTES};

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
}
