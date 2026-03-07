#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum WspAssignedNumberKind {
    PduType,
    AbortReason,
    WellKnownParameter,
    HeaderFieldName,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum UnknownAssignedNumberBehavior {
    Error,
    Ignore,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct WspAssignedNumberPolicy {
    pub pdu_type: UnknownAssignedNumberBehavior,
    pub abort_reason: UnknownAssignedNumberBehavior,
    pub well_known_parameter: UnknownAssignedNumberBehavior,
    pub header_field_name: UnknownAssignedNumberBehavior,
}

impl WspAssignedNumberPolicy {
    pub const STRICT: Self = Self {
        pdu_type: UnknownAssignedNumberBehavior::Error,
        abort_reason: UnknownAssignedNumberBehavior::Error,
        well_known_parameter: UnknownAssignedNumberBehavior::Error,
        header_field_name: UnknownAssignedNumberBehavior::Error,
    };

    pub const HEADER_LENIENT: Self = Self {
        pdu_type: UnknownAssignedNumberBehavior::Error,
        abort_reason: UnknownAssignedNumberBehavior::Error,
        well_known_parameter: UnknownAssignedNumberBehavior::Error,
        header_field_name: UnknownAssignedNumberBehavior::Ignore,
    };

    fn behavior_for(self, kind: WspAssignedNumberKind) -> UnknownAssignedNumberBehavior {
        match kind {
            WspAssignedNumberKind::PduType => self.pdu_type,
            WspAssignedNumberKind::AbortReason => self.abort_reason,
            WspAssignedNumberKind::WellKnownParameter => self.well_known_parameter,
            WspAssignedNumberKind::HeaderFieldName => self.header_field_name,
        }
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct WspAssignedNumberError {
    pub kind: WspAssignedNumberKind,
    pub code: u8,
}

impl std::fmt::Display for WspAssignedNumberError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "unknown {:?} assigned number: 0x{:02X}",
            self.kind, self.code
        )
    }
}

impl std::error::Error for WspAssignedNumberError {}

pub fn decode_pdu_type(
    code: u8,
    policy: WspAssignedNumberPolicy,
) -> Result<Option<&'static str>, WspAssignedNumberError> {
    decode_assigned_number(code, WspAssignedNumberKind::PduType, PDU_TYPES, policy)
}

pub fn decode_abort_reason(
    code: u8,
    policy: WspAssignedNumberPolicy,
) -> Result<Option<&'static str>, WspAssignedNumberError> {
    decode_assigned_number(
        code,
        WspAssignedNumberKind::AbortReason,
        ABORT_REASONS,
        policy,
    )
}

pub fn decode_well_known_parameter(
    code: u8,
    policy: WspAssignedNumberPolicy,
) -> Result<Option<&'static str>, WspAssignedNumberError> {
    decode_assigned_number(
        code,
        WspAssignedNumberKind::WellKnownParameter,
        WELL_KNOWN_PARAMETERS,
        policy,
    )
}

pub fn decode_header_field_name(
    code: u8,
    policy: WspAssignedNumberPolicy,
) -> Result<Option<&'static str>, WspAssignedNumberError> {
    decode_assigned_number(
        code,
        WspAssignedNumberKind::HeaderFieldName,
        HEADER_FIELD_NAMES,
        policy,
    )
}

pub fn encode_pdu_type(name: &str) -> Option<u8> {
    encode_assigned_number(name, PDU_TYPES)
}

pub fn encode_abort_reason(name: &str) -> Option<u8> {
    encode_assigned_number(name, ABORT_REASONS)
}

pub fn encode_well_known_parameter(name: &str) -> Option<u8> {
    encode_assigned_number(name, WELL_KNOWN_PARAMETERS)
}

pub fn encode_header_field_name(name: &str) -> Option<u8> {
    encode_assigned_number(name, HEADER_FIELD_NAMES)
}

fn decode_assigned_number(
    code: u8,
    kind: WspAssignedNumberKind,
    table: &[(u8, &'static str)],
    policy: WspAssignedNumberPolicy,
) -> Result<Option<&'static str>, WspAssignedNumberError> {
    if let Some((_, name)) = table.iter().find(|(entry_code, _)| *entry_code == code) {
        return Ok(Some(*name));
    }

    match policy.behavior_for(kind) {
        UnknownAssignedNumberBehavior::Ignore => Ok(None),
        UnknownAssignedNumberBehavior::Error => Err(WspAssignedNumberError { kind, code }),
    }
}

fn encode_assigned_number(name: &str, table: &[(u8, &'static str)]) -> Option<u8> {
    table
        .iter()
        .find(|(_, entry_name)| entry_name.eq_ignore_ascii_case(name))
        .map(|(code, _)| *code)
}

// WAP-230 Table 34: PDU Type Assignments
const PDU_TYPES: &[(u8, &str)] = &[
    (0x00, "Reserved"),
    (0x01, "Connect"),
    (0x02, "ConnectReply"),
    (0x03, "Redirect"),
    (0x04, "Reply"),
    (0x05, "Disconnect"),
    (0x06, "Push"),
    (0x07, "ConfirmedPush"),
    (0x08, "Suspend"),
    (0x09, "Resume"),
    (0x40, "Get"),
    (0x41, "Options"),
    (0x42, "Head"),
    (0x43, "Delete"),
    (0x44, "Trace"),
    (0x60, "Post"),
    (0x61, "Put"),
    (0x80, "DataFragment"),
];

// WAP-230 Table 35: Abort Reason Code Assignments
const ABORT_REASONS: &[(u8, &str)] = &[
    (0xE0, "PROTOERR"),
    (0xE1, "DISCONNECT"),
    (0xE2, "SUSPEND"),
    (0xE3, "RESUME"),
    (0xE4, "CONGESTION"),
    (0xE5, "CONNECTERR"),
    (0xE6, "MRUEXCEEDED"),
    (0xE7, "MOREXCEEDED"),
    (0xE8, "PEERREQ"),
    (0xE9, "NETERR"),
    (0xEA, "USERREQ"),
    (0xEB, "USERRFS"),
    (0xEC, "USERPND"),
    (0xED, "USERDCR"),
    (0xEE, "USERDCU"),
];

// WAP-230 Table 38: Well-Known Parameter Assignments
const WELL_KNOWN_PARAMETERS: &[(u8, &str)] = &[
    (0x00, "Q"),
    (0x01, "Charset"),
    (0x02, "Level"),
    (0x03, "Type"),
    (0x05, "Name-Deprecated"),
    (0x06, "Filename-Deprecated"),
    (0x07, "Differences"),
    (0x08, "Padding"),
    (0x09, "Multipart-Related-Type"),
    (0x0A, "Start-Deprecated"),
    (0x0B, "Start-Info-Deprecated"),
    (0x0C, "Comment-Deprecated"),
    (0x0D, "Domain-Deprecated"),
    (0x0E, "Max-Age"),
    (0x0F, "Path-Deprecated"),
    (0x10, "Secure"),
    (0x11, "SEC"),
    (0x12, "MAC"),
    (0x13, "Creation-Date"),
    (0x14, "Modification-Date"),
    (0x15, "Read-Date"),
    (0x16, "Size"),
    (0x17, "Name"),
    (0x18, "Filename"),
    (0x19, "Start"),
    (0x1A, "Start-Info"),
    (0x1B, "Comment"),
    (0x1C, "Domain"),
    (0x1D, "Path"),
];

// WAP-230 Table 39: Header Field Name Assignments
const HEADER_FIELD_NAMES: &[(u8, &str)] = &[
    (0x00, "Accept"),
    (0x01, "Accept-Charset-Deprecated"),
    (0x02, "Accept-Encoding-Deprecated"),
    (0x03, "Accept-Language"),
    (0x04, "Accept-Ranges"),
    (0x05, "Age"),
    (0x06, "Allow"),
    (0x07, "Authorization"),
    (0x08, "Cache-Control-Deprecated"),
    (0x09, "Connection"),
    (0x0A, "Content-Base-Deprecated"),
    (0x0B, "Content-Encoding"),
    (0x0C, "Content-Language"),
    (0x0D, "Content-Length"),
    (0x0E, "Content-Location"),
    (0x0F, "Content-MD5"),
    (0x10, "Content-Range-Deprecated"),
    (0x11, "Content-Type"),
    (0x12, "Date"),
    (0x13, "Etag"),
    (0x14, "Expires"),
    (0x15, "From"),
    (0x16, "Host"),
    (0x17, "If-Modified-Since"),
    (0x18, "If-Match"),
    (0x19, "If-None-Match"),
    (0x1A, "If-Range"),
    (0x1B, "If-Unmodified-Since"),
    (0x1C, "Location"),
    (0x1D, "Last-Modified"),
    (0x1E, "Max-Forwards"),
    (0x1F, "Pragma"),
    (0x20, "Proxy-Authenticate"),
    (0x21, "Proxy-Authorization"),
    (0x22, "Public"),
    (0x23, "Range"),
    (0x24, "Referer"),
    (0x25, "Retry-After"),
    (0x26, "Server"),
    (0x27, "Transfer-Encoding"),
    (0x28, "Upgrade"),
    (0x29, "User-Agent"),
    (0x2A, "Vary"),
    (0x2B, "Via"),
    (0x2C, "Warning"),
    (0x2D, "WWW-Authenticate"),
    (0x2F, "X-Wap-Application-Id"),
    (0x30, "X-Wap-Content-URI"),
    (0x31, "X-Wap-Initiator-URI"),
    (0x32, "Accept-Application"),
    (0x33, "Bearer-Indication"),
    (0x34, "Push-Flag"),
    (0x35, "Profile"),
    (0x36, "Profile-Diff"),
    (0x37, "Profile-Warning-Deprecated"),
    (0x38, "Expect"),
    (0x39, "TE"),
    (0x3A, "Trailer"),
    (0x3B, "Accept-Charset"),
    (0x3C, "Accept-Encoding"),
    (0x3D, "Cache-Control"),
    (0x3E, "Content-Range"),
    (0x3F, "X-Wap-Tod"),
    (0x40, "Content-ID"),
    (0x41, "Set-Cookie"),
    (0x42, "Cookie"),
    (0x43, "Encoding-Version"),
    (0x44, "Profile-Warning"),
    (0x45, "Content-Disposition"),
    (0x46, "X-WAP-Security"),
    (0x47, "Cache-Control-1.4"),
];

#[cfg(test)]
mod tests {
    use super::*;
    use serde::Deserialize;
    use std::fs;
    use std::path::PathBuf;

    #[derive(Debug, Deserialize)]
    struct RegistryFixture {
        pdu_types: Vec<RegistryEntry>,
        abort_reasons: Vec<RegistryEntry>,
        well_known_parameters: Vec<RegistryEntry>,
        header_field_names: Vec<RegistryEntry>,
        unknown_cases: Vec<UnknownCase>,
    }

    #[derive(Debug, Deserialize)]
    struct RegistryEntry {
        code: u8,
        name: String,
    }

    #[derive(Debug, Deserialize)]
    struct UnknownCase {
        category: String,
        code: u8,
        policy: String,
        expected: String,
    }

    fn load_fixture() -> RegistryFixture {
        let fixture_path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("tests")
            .join("fixtures")
            .join("transport")
            .join("wsp_assigned_number_registry_mapped")
            .join("registry_fixture.json");
        let raw = fs::read_to_string(&fixture_path)
            .unwrap_or_else(|_| panic!("failed reading {}", fixture_path.display()));
        serde_json::from_str(&raw)
            .unwrap_or_else(|_| panic!("failed parsing {}", fixture_path.display()))
    }

    fn decode_for_category(
        category: &str,
        code: u8,
        policy: WspAssignedNumberPolicy,
    ) -> Result<Option<&'static str>, WspAssignedNumberError> {
        match category {
            "pduType" => decode_pdu_type(code, policy),
            "abortReason" => decode_abort_reason(code, policy),
            "wellKnownParameter" => decode_well_known_parameter(code, policy),
            "headerFieldName" => decode_header_field_name(code, policy),
            other => panic!("unsupported category: {other}"),
        }
    }

    fn encode_for_category(category: &str, name: &str) -> Option<u8> {
        match category {
            "pduType" => encode_pdu_type(name),
            "abortReason" => encode_abort_reason(name),
            "wellKnownParameter" => encode_well_known_parameter(name),
            "headerFieldName" => encode_header_field_name(name),
            other => panic!("unsupported category: {other}"),
        }
    }

    fn assert_roundtrip(entries: &[RegistryEntry], category: &str) {
        for entry in entries {
            let decoded =
                decode_for_category(category, entry.code, WspAssignedNumberPolicy::STRICT)
                    .expect("known assigned number should decode");
            assert_eq!(decoded, Some(entry.name.as_str()));
            assert_eq!(encode_for_category(category, &entry.name), Some(entry.code));
        }
    }

    #[test]
    fn wsp_assigned_number_fixture_roundtrips_across_registry_groups() {
        let fixture = load_fixture();
        assert_roundtrip(&fixture.pdu_types, "pduType");
        assert_roundtrip(&fixture.abort_reasons, "abortReason");
        assert_roundtrip(&fixture.well_known_parameters, "wellKnownParameter");
        assert_roundtrip(&fixture.header_field_names, "headerFieldName");
    }

    #[test]
    fn wsp_assigned_number_unknown_behavior_is_profile_deterministic() {
        let fixture = load_fixture();
        for case in &fixture.unknown_cases {
            let policy = match case.policy.as_str() {
                "strict" => WspAssignedNumberPolicy::STRICT,
                "header-lenient" => WspAssignedNumberPolicy::HEADER_LENIENT,
                other => panic!("unsupported policy: {other}"),
            };
            let result = decode_for_category(&case.category, case.code, policy);
            match case.expected.as_str() {
                "error" => assert!(result.is_err(), "expected error for {:?}", case),
                "ignored" => assert_eq!(result.expect("expected ignore"), None),
                other => panic!("unsupported expected outcome: {other}"),
            }
        }
    }

    #[test]
    fn wsp_assigned_number_lookups_are_pure_and_repeatable() {
        let first = decode_pdu_type(0x01, WspAssignedNumberPolicy::STRICT).unwrap_or(None);
        let second = decode_pdu_type(0x01, WspAssignedNumberPolicy::STRICT).unwrap_or(None);
        assert_eq!(first, second);
        assert_eq!(first, Some("Connect"));
    }
}
