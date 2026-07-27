use crate::network::wsp::encoding_version::WspEncodingVersion;

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

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum WspHeaderCodePageClass {
    Default,
    WapReserved,
    Application,
    FutureReserved,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum WspHeaderValueGrammar {
    Accept,
    AcceptCharset,
    AcceptEncoding,
    AcceptLanguage,
    AcceptRanges,
    Age,
    Allow,
    Authorization,
    CacheControl,
    Connection,
    ContentBase,
    ContentEncoding,
    ContentLanguage,
    ContentLength,
    ContentLocation,
    ContentMd5,
    ContentRange,
    ContentType,
    Date,
    Etag,
    Expires,
    From,
    Host,
    IfModifiedSince,
    IfMatch,
    IfNoneMatch,
    IfRange,
    IfUnmodifiedSince,
    Location,
    LastModified,
    MaxForwards,
    Pragma,
    ProxyAuthenticate,
    ProxyAuthorization,
    Public,
    Range,
    Referer,
    RetryAfter,
    Server,
    TransferEncoding,
    Upgrade,
    UserAgent,
    Vary,
    Via,
    Warning,
    WwwAuthenticate,
    ContentDisposition,
    ApplicationId,
    ContentUri,
    InitiatorUri,
    AcceptApplication,
    BearerIndication,
    PushFlag,
    Profile,
    ProfileDiff,
    ProfileWarning,
    ExpectSin001,
    Te,
    Trailer,
    XWapTod,
    ContentId,
    SetCookie,
    Cookie,
    EncodingVersion,
    ApplicationSpecific,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct WspHeaderFieldDefinition {
    pub code: u8,
    pub name: &'static str,
    pub minimum_version: WspEncodingVersion,
    pub grammar: WspHeaderValueGrammar,
    pub deprecated: bool,
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
    if page == DEFAULT_HEADER_CODE_PAGE {
        if let Some(definition) = default_header_definition(code) {
            return Ok(Some(definition.name));
        }
        return match policy.behavior_for(WspAssignedNumberKind::HeaderFieldName) {
            UnknownAssignedNumberBehavior::Ignore => Ok(None),
            UnknownAssignedNumberBehavior::Error => Err(WspAssignedNumberError {
                kind: WspAssignedNumberKind::HeaderFieldName,
                code,
            }),
        };
    }
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
    if page == DEFAULT_HEADER_CODE_PAGE {
        return default_header_definition_for_encoding(name, WspEncodingVersion::V1_4)
            .map(|definition| definition.code);
    }
    header_code_page(page).and_then(|page| encode_assigned_number(name, page.headers))
}

pub fn default_header_definitions() -> &'static [WspHeaderFieldDefinition] {
    DEFAULT_HEADER_FIELD_DEFINITIONS
}

pub fn default_header_definition(code: u8) -> Option<&'static WspHeaderFieldDefinition> {
    DEFAULT_HEADER_FIELD_DEFINITIONS
        .iter()
        .find(|definition| definition.code == code)
}

pub fn default_header_definition_for_encoding(
    name: &str,
    recipient_version: WspEncodingVersion,
) -> Option<&'static WspHeaderFieldDefinition> {
    DEFAULT_HEADER_FIELD_DEFINITIONS
        .iter()
        .rev()
        .find(|definition| {
            !definition.deprecated
                && definition.name.eq_ignore_ascii_case(name)
                && definition.minimum_version <= recipient_version
        })
}

pub fn resolve_header_field_page(name: &str) -> Option<u8> {
    if DEFAULT_HEADER_FIELD_DEFINITIONS
        .iter()
        .any(|definition| definition.name.eq_ignore_ascii_case(name))
    {
        return Some(DEFAULT_HEADER_CODE_PAGE);
    }
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
    matches!(
        header_code_page_class(page),
        WspHeaderCodePageClass::Application
    )
}

pub const fn header_code_page_class(page: u8) -> WspHeaderCodePageClass {
    match page {
        DEFAULT_HEADER_CODE_PAGE => WspHeaderCodePageClass::Default,
        0x02..=0x0F => WspHeaderCodePageClass::WapReserved,
        0x10..=0x7F => WspHeaderCodePageClass::Application,
        _ => WspHeaderCodePageClass::FutureReserved,
    }
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

macro_rules! header_definition {
    ($code:literal, $name:literal, $version:ident, $grammar:ident) => {
        WspHeaderFieldDefinition {
            code: $code,
            name: $name,
            minimum_version: WspEncodingVersion::$version,
            grammar: WspHeaderValueGrammar::$grammar,
            deprecated: false,
        }
    };
    ($code:literal, $name:literal, $version:ident, $grammar:ident, deprecated) => {
        WspHeaderFieldDefinition {
            code: $code,
            name: $name,
            minimum_version: WspEncodingVersion::$version,
            grammar: WspHeaderValueGrammar::$grammar,
            deprecated: true,
        }
    };
}

const DEFAULT_HEADER_FIELD_DEFINITIONS: &[WspHeaderFieldDefinition] = &[
    header_definition!(0x00, "Accept", V1_1, Accept),
    header_definition!(0x01, "Accept-Charset", V1_1, AcceptCharset, deprecated),
    header_definition!(0x02, "Accept-Encoding", V1_1, AcceptEncoding, deprecated),
    header_definition!(0x03, "Accept-Language", V1_1, AcceptLanguage),
    header_definition!(0x04, "Accept-Ranges", V1_1, AcceptRanges),
    header_definition!(0x05, "Age", V1_1, Age),
    header_definition!(0x06, "Allow", V1_1, Allow),
    header_definition!(0x07, "Authorization", V1_1, Authorization),
    header_definition!(0x08, "Cache-Control", V1_1, CacheControl, deprecated),
    header_definition!(0x09, "Connection", V1_1, Connection),
    header_definition!(0x0A, "Content-Base", V1_1, ContentBase),
    header_definition!(0x0B, "Content-Encoding", V1_1, ContentEncoding),
    header_definition!(0x0C, "Content-Language", V1_1, ContentLanguage),
    header_definition!(0x0D, "Content-Length", V1_1, ContentLength),
    header_definition!(0x0E, "Content-Location", V1_1, ContentLocation),
    header_definition!(0x0F, "Content-MD5", V1_1, ContentMd5),
    header_definition!(0x10, "Content-Range", V1_1, ContentRange, deprecated),
    header_definition!(0x11, "Content-Type", V1_1, ContentType),
    header_definition!(0x12, "Date", V1_1, Date),
    header_definition!(0x13, "Etag", V1_1, Etag),
    header_definition!(0x14, "Expires", V1_1, Expires),
    header_definition!(0x15, "From", V1_1, From),
    header_definition!(0x16, "Host", V1_1, Host),
    header_definition!(0x17, "If-Modified-Since", V1_1, IfModifiedSince),
    header_definition!(0x18, "If-Match", V1_1, IfMatch),
    header_definition!(0x19, "If-None-Match", V1_1, IfNoneMatch),
    header_definition!(0x1A, "If-Range", V1_1, IfRange),
    header_definition!(0x1B, "If-Unmodified-Since", V1_1, IfUnmodifiedSince),
    header_definition!(0x1C, "Location", V1_1, Location),
    header_definition!(0x1D, "Last-Modified", V1_1, LastModified),
    header_definition!(0x1E, "Max-Forwards", V1_1, MaxForwards),
    header_definition!(0x1F, "Pragma", V1_1, Pragma),
    header_definition!(0x20, "Proxy-Authenticate", V1_1, ProxyAuthenticate),
    header_definition!(0x21, "Proxy-Authorization", V1_1, ProxyAuthorization),
    header_definition!(0x22, "Public", V1_1, Public),
    header_definition!(0x23, "Range", V1_1, Range),
    header_definition!(0x24, "Referer", V1_1, Referer),
    header_definition!(0x25, "Retry-After", V1_1, RetryAfter),
    header_definition!(0x26, "Server", V1_1, Server),
    header_definition!(0x27, "Transfer-Encoding", V1_1, TransferEncoding),
    header_definition!(0x28, "Upgrade", V1_1, Upgrade),
    header_definition!(0x29, "User-Agent", V1_1, UserAgent),
    header_definition!(0x2A, "Vary", V1_1, Vary),
    header_definition!(0x2B, "Via", V1_1, Via),
    header_definition!(0x2C, "Warning", V1_1, Warning),
    header_definition!(0x2D, "WWW-Authenticate", V1_1, WwwAuthenticate),
    header_definition!(0x2E, "Content-Disposition", V1_1, ContentDisposition),
    header_definition!(0x2F, "X-Wap-Application-Id", V1_2, ApplicationId),
    header_definition!(0x30, "X-Wap-Content-URI", V1_2, ContentUri),
    header_definition!(0x31, "X-Wap-Initiator-URI", V1_2, InitiatorUri),
    header_definition!(0x32, "Accept-Application", V1_2, AcceptApplication),
    header_definition!(0x33, "Bearer-Indication", V1_2, BearerIndication),
    header_definition!(0x34, "Push-Flag", V1_2, PushFlag),
    header_definition!(0x35, "Profile", V1_2, Profile),
    header_definition!(0x36, "Profile-Diff", V1_2, ProfileDiff),
    header_definition!(0x37, "Profile-Warning", V1_2, ProfileWarning),
    header_definition!(0x38, "Expect", V1_3, ExpectSin001),
    header_definition!(0x39, "TE", V1_3, Te),
    header_definition!(0x3A, "Trailer", V1_3, Trailer),
    header_definition!(0x3B, "Accept-Charset", V1_3, AcceptCharset),
    header_definition!(0x3C, "Accept-Encoding", V1_3, AcceptEncoding),
    header_definition!(0x3D, "Cache-Control", V1_3, CacheControl),
    header_definition!(0x3E, "Content-Range", V1_3, ContentRange),
    header_definition!(0x3F, "X-Wap-Tod", V1_3, XWapTod),
    header_definition!(0x40, "Content-ID", V1_3, ContentId),
    header_definition!(0x41, "Set-Cookie", V1_3, SetCookie),
    header_definition!(0x42, "Cookie", V1_3, Cookie),
    header_definition!(0x43, "Encoding-Version", V1_3, EncodingVersion),
];

const DEFAULT_HEADER_FIELD_NAMES: &[(u8, &str)] = &[];

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
