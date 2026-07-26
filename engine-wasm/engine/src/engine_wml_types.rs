use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "contract-codegen", derive(ts_rs::TS))]
#[cfg_attr(feature = "contract-codegen", ts(rename = "WmlLoadDiagnosticClass"))]
#[serde(rename_all = "kebab-case")]
pub enum WmlLoadDiagnosticClassLiteral {
    Malformed,
    Invalid,
    Unsupported,
    Recoverable,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "contract-codegen", derive(ts_rs::TS))]
#[cfg_attr(feature = "contract-codegen", ts(rename = "WmlLoadDiagnosticCode"))]
pub enum WmlLoadDiagnosticCodeLiteral {
    #[serde(rename = "WML_MALFORMED_XML")]
    MalformedXml,
    #[serde(rename = "WML_INVALID_WML")]
    InvalidWml,
    #[serde(rename = "WML_UNSUPPORTED_OPTIONAL_CONSTRUCT")]
    UnsupportedOptionalConstruct,
    #[serde(rename = "WML_RECOVERABLE_CONTENT")]
    RecoverableContent,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "contract-codegen", derive(ts_rs::TS))]
#[cfg_attr(feature = "contract-codegen", ts(rename = "WmlLoadDiagnosticOutcome"))]
#[serde(rename_all = "kebab-case")]
pub enum WmlLoadDiagnosticOutcomeLiteral {
    Rejected,
    Ignored,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "contract-codegen", derive(ts_rs::TS))]
#[serde(rename_all = "camelCase")]
pub struct WmlLoadDiagnostic {
    pub class: WmlLoadDiagnosticClassLiteral,
    pub code: WmlLoadDiagnosticCodeLiteral,
    pub outcome: WmlLoadDiagnosticOutcomeLiteral,
    pub message: String,
}

impl WmlLoadDiagnostic {
    pub(crate) fn malformed(message: impl Into<String>) -> Self {
        Self::rejected(
            WmlLoadDiagnosticClassLiteral::Malformed,
            WmlLoadDiagnosticCodeLiteral::MalformedXml,
            message,
        )
    }

    pub(crate) fn invalid(message: impl Into<String>) -> Self {
        Self::rejected(
            WmlLoadDiagnosticClassLiteral::Invalid,
            WmlLoadDiagnosticCodeLiteral::InvalidWml,
            message,
        )
    }

    pub(crate) fn unsupported(message: impl Into<String>) -> Self {
        Self::ignored(
            WmlLoadDiagnosticClassLiteral::Unsupported,
            WmlLoadDiagnosticCodeLiteral::UnsupportedOptionalConstruct,
            message,
        )
    }

    pub(crate) fn recoverable(message: impl Into<String>) -> Self {
        Self::ignored(
            WmlLoadDiagnosticClassLiteral::Recoverable,
            WmlLoadDiagnosticCodeLiteral::RecoverableContent,
            message,
        )
    }

    pub(crate) fn recoverable_rejection(message: impl Into<String>) -> Self {
        Self::rejected(
            WmlLoadDiagnosticClassLiteral::Recoverable,
            WmlLoadDiagnosticCodeLiteral::RecoverableContent,
            message,
        )
    }

    fn rejected(
        class: WmlLoadDiagnosticClassLiteral,
        code: WmlLoadDiagnosticCodeLiteral,
        message: impl Into<String>,
    ) -> Self {
        Self {
            class,
            code,
            outcome: WmlLoadDiagnosticOutcomeLiteral::Rejected,
            message: message.into(),
        }
    }

    fn ignored(
        class: WmlLoadDiagnosticClassLiteral,
        code: WmlLoadDiagnosticCodeLiteral,
        message: impl Into<String>,
    ) -> Self {
        Self {
            class,
            code,
            outcome: WmlLoadDiagnosticOutcomeLiteral::Ignored,
            message: message.into(),
        }
    }
}

impl std::fmt::Display for WmlLoadDiagnostic {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        formatter.write_str(&self.message)
    }
}
