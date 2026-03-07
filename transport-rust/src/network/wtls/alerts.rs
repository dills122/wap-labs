#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum WtlsAlertLevel {
    Warning,
    Fatal,
}

impl WtlsAlertLevel {
    fn to_u8(self) -> u8 {
        match self {
            WtlsAlertLevel::Warning => 1,
            WtlsAlertLevel::Fatal => 2,
        }
    }

    fn from_u8(raw: u8) -> Option<Self> {
        match raw {
            1 => Some(Self::Warning),
            2 => Some(Self::Fatal),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum WtlsAlertDescription {
    CloseNotify,
    UnexpectedMessage,
    BadRecordMac,
    HandshakeFailure,
    IllegalParameter,
}

impl WtlsAlertDescription {
    fn to_u8(self) -> u8 {
        match self {
            WtlsAlertDescription::CloseNotify => 0,
            WtlsAlertDescription::UnexpectedMessage => 10,
            WtlsAlertDescription::BadRecordMac => 20,
            WtlsAlertDescription::HandshakeFailure => 40,
            WtlsAlertDescription::IllegalParameter => 47,
        }
    }

    fn from_u8(raw: u8) -> Option<Self> {
        match raw {
            0 => Some(Self::CloseNotify),
            10 => Some(Self::UnexpectedMessage),
            20 => Some(Self::BadRecordMac),
            40 => Some(Self::HandshakeFailure),
            47 => Some(Self::IllegalParameter),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct WtlsAlert {
    pub level: WtlsAlertLevel,
    pub description: WtlsAlertDescription,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum WtlsAlertDecodeError {
    Truncated,
    InvalidLevel(u8),
    InvalidDescription(u8),
    TrailingBytes { extra: usize },
}

pub fn encode_alert(alert: WtlsAlert) -> [u8; 2] {
    [alert.level.to_u8(), alert.description.to_u8()]
}

pub fn decode_alert(input: &[u8]) -> Result<WtlsAlert, WtlsAlertDecodeError> {
    if input.len() < 2 {
        return Err(WtlsAlertDecodeError::Truncated);
    }
    if input.len() > 2 {
        return Err(WtlsAlertDecodeError::TrailingBytes {
            extra: input.len() - 2,
        });
    }
    let level =
        WtlsAlertLevel::from_u8(input[0]).ok_or(WtlsAlertDecodeError::InvalidLevel(input[0]))?;
    let description = WtlsAlertDescription::from_u8(input[1])
        .ok_or(WtlsAlertDecodeError::InvalidDescription(input[1]))?;
    Ok(WtlsAlert { level, description })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn alert_roundtrips_known_values() {
        let alert = WtlsAlert {
            level: WtlsAlertLevel::Fatal,
            description: WtlsAlertDescription::HandshakeFailure,
        };
        assert_eq!(decode_alert(&encode_alert(alert)), Ok(alert));
    }

    #[test]
    fn decode_alert_rejects_invalid_shapes() {
        assert_eq!(decode_alert(&[1]), Err(WtlsAlertDecodeError::Truncated));
        assert_eq!(
            decode_alert(&[9, 0]),
            Err(WtlsAlertDecodeError::InvalidLevel(9))
        );
        assert_eq!(
            decode_alert(&[1, 0, 0]),
            Err(WtlsAlertDecodeError::TrailingBytes { extra: 1 })
        );
    }
}
