#![allow(dead_code)]

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum WtlsMode {
    Disabled,
    ActiveMinimal,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WtlsRecordLayerPolicy {
    pub mode: WtlsMode,
    pub version_major: u8,
    pub version_minor: u8,
}

impl WtlsRecordLayerPolicy {
    pub const DISABLED: Self = Self {
        mode: WtlsMode::Disabled,
        version_major: 1,
        version_minor: 0,
    };

    pub const ACTIVE_MINIMAL: Self = Self {
        mode: WtlsMode::ActiveMinimal,
        version_major: 1,
        version_minor: 0,
    };
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum WtlsContentType {
    ChangeCipherSpec,
    Alert,
    Handshake,
    ApplicationData,
}

impl WtlsContentType {
    fn to_u8(self) -> u8 {
        match self {
            WtlsContentType::ChangeCipherSpec => 20,
            WtlsContentType::Alert => 21,
            WtlsContentType::Handshake => 22,
            WtlsContentType::ApplicationData => 23,
        }
    }

    fn from_u8(raw: u8) -> Option<Self> {
        match raw {
            20 => Some(Self::ChangeCipherSpec),
            21 => Some(Self::Alert),
            22 => Some(Self::Handshake),
            23 => Some(Self::ApplicationData),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct WtlsRecord {
    pub content_type: WtlsContentType,
    pub version_major: u8,
    pub version_minor: u8,
    pub seq_number: u16,
    pub payload: Vec<u8>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum WtlsRecordDecodeError {
    TruncatedHeader,
    InvalidContentType(u8),
    TruncatedPayload { expected: usize, actual: usize },
    TrailingBytes { extra: usize },
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct WtlsOutboundPacket {
    pub mode: WtlsMode,
    pub bytes: Vec<u8>,
    pub record: Option<WtlsRecord>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct WtlsInboundPacket {
    pub mode: WtlsMode,
    pub plaintext: Vec<u8>,
    pub record: Option<WtlsRecord>,
}

pub fn encode_record(record: &WtlsRecord) -> Vec<u8> {
    let length = u16::try_from(record.payload.len()).unwrap_or(u16::MAX);
    let mut out = Vec::with_capacity(7 + record.payload.len());
    out.push(record.content_type.to_u8());
    out.push(record.version_major);
    out.push(record.version_minor);
    out.extend_from_slice(&record.seq_number.to_be_bytes());
    out.extend_from_slice(&length.to_be_bytes());
    out.extend_from_slice(&record.payload);
    out
}

pub fn decode_record(input: &[u8]) -> Result<WtlsRecord, WtlsRecordDecodeError> {
    if input.len() < 7 {
        return Err(WtlsRecordDecodeError::TruncatedHeader);
    }

    let content_type = WtlsContentType::from_u8(input[0])
        .ok_or(WtlsRecordDecodeError::InvalidContentType(input[0]))?;
    let version_major = input[1];
    let version_minor = input[2];
    let seq_number = u16::from_be_bytes([input[3], input[4]]);
    let declared_len = usize::from(u16::from_be_bytes([input[5], input[6]]));
    let actual_len = input.len().saturating_sub(7);
    if actual_len < declared_len {
        return Err(WtlsRecordDecodeError::TruncatedPayload {
            expected: declared_len,
            actual: actual_len,
        });
    }
    if actual_len > declared_len {
        return Err(WtlsRecordDecodeError::TrailingBytes {
            extra: actual_len - declared_len,
        });
    }

    Ok(WtlsRecord {
        content_type,
        version_major,
        version_minor,
        seq_number,
        payload: input[7..].to_vec(),
    })
}

pub fn apply_outbound_record_layer(
    policy: WtlsRecordLayerPolicy,
    content_type: WtlsContentType,
    seq_number: u16,
    payload: &[u8],
) -> WtlsOutboundPacket {
    match policy.mode {
        WtlsMode::Disabled => WtlsOutboundPacket {
            mode: policy.mode,
            bytes: payload.to_vec(),
            record: None,
        },
        WtlsMode::ActiveMinimal => {
            let record = WtlsRecord {
                content_type,
                version_major: policy.version_major,
                version_minor: policy.version_minor,
                seq_number,
                payload: payload.to_vec(),
            };
            WtlsOutboundPacket {
                mode: policy.mode,
                bytes: encode_record(&record),
                record: Some(record),
            }
        }
    }
}

pub fn apply_inbound_record_layer(
    policy: WtlsRecordLayerPolicy,
    bytes: &[u8],
) -> Result<WtlsInboundPacket, WtlsRecordDecodeError> {
    match policy.mode {
        WtlsMode::Disabled => Ok(WtlsInboundPacket {
            mode: policy.mode,
            plaintext: bytes.to_vec(),
            record: None,
        }),
        WtlsMode::ActiveMinimal => {
            let record = decode_record(bytes)?;
            Ok(WtlsInboundPacket {
                mode: policy.mode,
                plaintext: record.payload.clone(),
                record: Some(record),
            })
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_support::load_json_fixture;

    #[derive(Debug, Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct RecordFixture {
        cases: Vec<RecordFixtureCase>,
    }

    #[derive(Debug, Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct RecordFixtureCase {
        name: String,
        mode: WtlsMode,
        content_type: WtlsContentType,
        seq_number: u16,
        payload: Vec<u8>,
        expected_wire: Vec<u8>,
        expected_plaintext: Vec<u8>,
    }

    fn load_fixture() -> RecordFixture {
        load_json_fixture(&[
            "tests",
            "fixtures",
            "transport",
            "wtls_record_boundary_mapped",
            "record_fixture.json",
        ])
    }

    #[test]
    fn wtls_record_fixture_covers_disabled_and_active_minimal_modes() {
        let fixture = load_fixture();
        for case in fixture.cases {
            let policy = WtlsRecordLayerPolicy {
                mode: case.mode,
                version_major: 1,
                version_minor: 0,
            };
            let outbound = apply_outbound_record_layer(
                policy,
                case.content_type,
                case.seq_number,
                &case.payload,
            );
            assert_eq!(outbound.bytes, case.expected_wire, "case {}", case.name);

            let inbound =
                apply_inbound_record_layer(policy, &outbound.bytes).expect("inbound should parse");
            assert_eq!(
                inbound.plaintext, case.expected_plaintext,
                "case {} plaintext mismatch",
                case.name
            );
            match case.mode {
                WtlsMode::Disabled => assert!(inbound.record.is_none(), "case {}", case.name),
                WtlsMode::ActiveMinimal => {
                    let record = inbound.record.expect("active mode should parse record");
                    assert_eq!(record.content_type, case.content_type, "case {}", case.name);
                    assert_eq!(record.seq_number, case.seq_number, "case {}", case.name);
                }
            }
        }
    }

    #[test]
    fn decode_record_rejects_invalid_content_type_and_trailing_bytes() {
        assert_eq!(
            decode_record(&[99, 1, 0, 0, 1, 0, 0]),
            Err(WtlsRecordDecodeError::InvalidContentType(99))
        );
        assert_eq!(
            decode_record(&[23, 1, 0, 0, 1, 0, 1, 0, 0]),
            Err(WtlsRecordDecodeError::TrailingBytes { extra: 1 })
        );
    }
}
