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

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct WspHeaderCodePage {
    pub page: u8,
    pub name: &'static str,
    pub headers: &'static [(u8, &'static str)],
}

pub const DEFAULT_HEADER_CODE_PAGE: u8 = 0x01;
pub const HEADER_CODE_PAGE_SHIFT: u8 = 0x7F;

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

pub fn decode_header_field_name_on_page(
    page: u8,
    code: u8,
    policy: WspAssignedNumberPolicy,
) -> Result<Option<&'static str>, WspAssignedNumberError> {
    let headers = match header_code_page(page) {
        Some(page) => page.headers,
        None => {
            return Err(WspAssignedNumberError {
                kind: WspAssignedNumberKind::HeaderFieldName,
                code,
            })
        }
    };
    decode_assigned_number(
        code,
        WspAssignedNumberKind::HeaderFieldName,
        headers,
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

pub fn encode_header_field_name_on_page(name: &str, page: u8) -> Option<u8> {
    header_code_page(page).and_then(|page| encode_assigned_number(name, page.headers))
}

pub fn resolve_header_field_page(name: &str) -> Option<u8> {
    HEADER_CODE_PAGES
        .iter()
        .find(|page| {
            page.headers
                .iter()
                .any(|(_, header)| header.eq_ignore_ascii_case(name))
        })
        .map(|page| page.page)
}

pub fn header_code_page_name(page: u8) -> Option<&'static str> {
    header_code_page(page).map(|page| page.name)
}

pub fn is_negotiated_extension_page(page: u8) -> bool {
    page >= 0x10
}

fn header_code_page(page: u8) -> Option<&'static WspHeaderCodePage> {
    HEADER_CODE_PAGES.iter().find(|entry| entry.page == page)
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

const DEFAULT_HEADER_FIELD_NAMES: &[(u8, &str)] = &[
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

const APP_HEADER_FIELD_NAMES: &[(u8, &str)] = &[(0x10, "X-App-Trace"), (0x11, "X-App-Checksum")];

const ACK_HEADER_FIELD_NAMES: &[(u8, &str)] = &[(0x10, "X-Wap-Ack"), (0x11, "X-Wap-Ack-Id")];

const HEADER_CODE_PAGES: &[WspHeaderCodePage] = &[
    WspHeaderCodePage {
        page: DEFAULT_HEADER_CODE_PAGE,
        name: "default",
        headers: DEFAULT_HEADER_FIELD_NAMES,
    },
    WspHeaderCodePage {
        page: 0x10,
        name: "x-app",
        headers: APP_HEADER_FIELD_NAMES,
    },
    WspHeaderCodePage {
        page: 0x40,
        name: "x-wap-ack",
        headers: ACK_HEADER_FIELD_NAMES,
    },
];
