use serde::{Deserialize, Serialize};

pub const WCMP_TYPE_DESTINATION_UNREACHABLE: u8 = 51;
pub const WCMP_TYPE_MESSAGE_TOO_BIG: u8 = 60;
pub const WCMP_TYPE_ECHO_REQUEST: u8 = 178;
pub const WCMP_TYPE_ECHO_REPLY: u8 = 179;

pub const WDP_ADDRESS_TYPE_IPV4: u8 = 0x00;
pub const WDP_ADDRESS_TYPE_IPV6: u8 = 0x01;
pub const WDP_ADDRESS_TYPE_CDPD_IPV4: u8 = 0x0D;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum WcmpTypeClass {
    Error,
    Informational,
    Reserved,
}

impl WcmpTypeClass {
    pub const fn from_message_type(message_type: u8) -> Self {
        match message_type {
            0..=127 => Self::Error,
            128..=191 => Self::Informational,
            192..=255 => Self::Reserved,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum WcmpDestinationUnreachableCode {
    NoRouteToDestination,
    CommunicationAdministrativelyProhibited,
    AddressUnreachable,
    PortUnreachable,
}

impl WcmpDestinationUnreachableCode {
    pub const fn to_u8(self) -> u8 {
        match self {
            Self::NoRouteToDestination => 0,
            Self::CommunicationAdministrativelyProhibited => 1,
            Self::AddressUnreachable => 3,
            Self::PortUnreachable => 4,
        }
    }

    pub const fn from_u8(value: u8) -> Option<Self> {
        match value {
            0 => Some(Self::NoRouteToDestination),
            1 => Some(Self::CommunicationAdministrativelyProhibited),
            3 => Some(Self::AddressUnreachable),
            4 => Some(Self::PortUnreachable),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WcmpAddress {
    pub address_type: u8,
    pub data: Vec<u8>,
}

impl WcmpAddress {
    pub fn new(address_type: u8, data: Vec<u8>) -> Self {
        Self { address_type, data }
    }

    pub fn cdpd_ipv4(octets: [u8; 4]) -> Self {
        Self::new(WDP_ADDRESS_TYPE_CDPD_IPV4, octets.to_vec())
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum WcmpMessage {
    DestinationUnreachable {
        code: WcmpDestinationUnreachableCode,
        destination_port: u16,
        originator_port: u16,
        address: WcmpAddress,
    },
    MessageTooBig {
        destination_port: u16,
        originator_port: u16,
        address: WcmpAddress,
        maximum_message_size: u16,
    },
    EchoRequest {
        identifier: u16,
        sequence_number: u16,
        data: Vec<u8>,
    },
    EchoReply {
        identifier: u16,
        sequence_number: u16,
        data: Vec<u8>,
    },
}

impl WcmpMessage {
    pub const fn message_type(&self) -> u8 {
        match self {
            Self::DestinationUnreachable { .. } => WCMP_TYPE_DESTINATION_UNREACHABLE,
            Self::MessageTooBig { .. } => WCMP_TYPE_MESSAGE_TOO_BIG,
            Self::EchoRequest { .. } => WCMP_TYPE_ECHO_REQUEST,
            Self::EchoReply { .. } => WCMP_TYPE_ECHO_REPLY,
        }
    }

    pub const fn code(&self) -> u8 {
        match self {
            Self::DestinationUnreachable { code, .. } => code.to_u8(),
            Self::MessageTooBig { .. } | Self::EchoRequest { .. } | Self::EchoReply { .. } => 0,
        }
    }

    pub const fn type_class(&self) -> WcmpTypeClass {
        WcmpTypeClass::from_message_type(self.message_type())
    }

    pub const fn is_error(&self) -> bool {
        matches!(self.type_class(), WcmpTypeClass::Error)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn destination_unreachable_code_roundtrips_every_variant() {
        let codes = [
            WcmpDestinationUnreachableCode::NoRouteToDestination,
            WcmpDestinationUnreachableCode::CommunicationAdministrativelyProhibited,
            WcmpDestinationUnreachableCode::AddressUnreachable,
            WcmpDestinationUnreachableCode::PortUnreachable,
        ];
        for code in codes {
            let byte = code.to_u8();
            assert_eq!(WcmpDestinationUnreachableCode::from_u8(byte), Some(code));
        }
        assert_eq!(WcmpDestinationUnreachableCode::from_u8(2), None);
    }

    #[test]
    fn message_type_class_matches_error_and_informational_ranges() {
        let unreachable = WcmpMessage::DestinationUnreachable {
            code: WcmpDestinationUnreachableCode::NoRouteToDestination,
            destination_port: 1,
            originator_port: 2,
            address: WcmpAddress::cdpd_ipv4([10, 0, 0, 1]),
        };
        assert_eq!(unreachable.type_class(), WcmpTypeClass::Error);
        assert!(unreachable.is_error());

        let echo_request = WcmpMessage::EchoRequest {
            identifier: 1,
            sequence_number: 1,
            data: vec![],
        };
        assert_eq!(echo_request.type_class(), WcmpTypeClass::Informational);
        assert!(!echo_request.is_error());
    }
}
