use crate::network::wdp::datagram::{WdpAddress, WdpDatagram};

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TDUnitdataRequest {
    pub source_address: WdpAddress,
    pub source_port: u16,
    pub destination_address: WdpAddress,
    pub destination_port: u16,
    pub user_data: Vec<u8>,
}

impl TDUnitdataRequest {
    pub fn into_datagram(self) -> WdpDatagram {
        WdpDatagram {
            src_addr: self.source_address,
            dst_addr: self.destination_address,
            src_port: self.source_port,
            dst_port: self.destination_port,
            payload: self.user_data,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TDUnitdataIndication {
    pub source_address: WdpAddress,
    pub source_port: u16,
    pub destination_address: Option<WdpAddress>,
    pub destination_port: Option<u16>,
    pub user_data: Vec<u8>,
}

impl From<WdpDatagram> for TDUnitdataIndication {
    fn from(datagram: WdpDatagram) -> Self {
        Self {
            source_address: datagram.src_addr,
            source_port: datagram.src_port,
            destination_address: Some(datagram.dst_addr),
            destination_port: Some(datagram.dst_port),
            user_data: datagram.payload,
        }
    }
}
