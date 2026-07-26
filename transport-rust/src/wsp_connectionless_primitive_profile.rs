use crate::network::wdp::{TDUnitdataIndication, TDUnitdataRequest, WdpAddress};
use crate::network::wsp::connectionless::{
    decode_connectionless_pdu, encode_connectionless_pdu, DecodedWspContentType,
    WspConnectionlessDecodeError, WspConnectionlessEncodeError, WspConnectionlessMethod,
    WspConnectionlessPdu,
};

/// The endpoint using the connectionless WSP service.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum WspEndpointRole {
    Client,
    Server,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum WspPrimitiveDirection {
    Req,
    Ind,
    Res,
    Cnf,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum WspServicePrimitive {
    MethodInvoke,
    MethodResult,
    Push,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum WspPrimitiveDecision {
    Accept,
    RejectPrimitive,
    RejectDirection,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct WspPrimitiveTrace {
    pub role: WspEndpointRole,
    pub primitive: WspServicePrimitive,
    pub direction: WspPrimitiveDirection,
    pub decision: WspPrimitiveDecision,
}

/// Applies the WAP-203 section 6.4.3 endpoint-role matrix.
///
/// Connectionless service primitives are deliberately stateless: a client may
/// issue method-invoke requests and receive method-result indications, while a
/// server receives method-invoke indications and issues method-result requests.
pub fn decide_wsp_primitive(
    role: WspEndpointRole,
    primitive: WspServicePrimitive,
    direction: WspPrimitiveDirection,
) -> (WspPrimitiveDecision, WspPrimitiveTrace) {
    let decision = if primitive == WspServicePrimitive::Push {
        WspPrimitiveDecision::RejectPrimitive
    } else if matches!(
        (role, primitive, direction),
        (
            WspEndpointRole::Client,
            WspServicePrimitive::MethodInvoke,
            WspPrimitiveDirection::Req
        ) | (
            WspEndpointRole::Client,
            WspServicePrimitive::MethodResult,
            WspPrimitiveDirection::Ind
        ) | (
            WspEndpointRole::Server,
            WspServicePrimitive::MethodInvoke,
            WspPrimitiveDirection::Ind
        ) | (
            WspEndpointRole::Server,
            WspServicePrimitive::MethodResult,
            WspPrimitiveDirection::Req
        )
    ) {
        WspPrimitiveDecision::Accept
    } else {
        WspPrimitiveDecision::RejectDirection
    };
    (
        decision,
        WspPrimitiveTrace {
            role,
            primitive,
            direction,
            decision,
        },
    )
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct WspConnectionlessEndpoint {
    pub address: WdpAddress,
    pub port: u16,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct WspMethodInvokePrimitive {
    pub direction: WspPrimitiveDirection,
    pub server: WspConnectionlessEndpoint,
    pub client: WspConnectionlessEndpoint,
    pub transaction_id: u8,
    pub method: WspConnectionlessMethod,
    pub uri: String,
    pub content_type: Option<DecodedWspContentType>,
    pub headers: Vec<u8>,
    pub body: Vec<u8>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct WspMethodResultPrimitive {
    pub direction: WspPrimitiveDirection,
    pub client: WspConnectionlessEndpoint,
    pub server: WspConnectionlessEndpoint,
    pub transaction_id: u8,
    pub status_code: u16,
    pub content_type: DecodedWspContentType,
    pub headers: Vec<u8>,
    pub body: Vec<u8>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum WspConnectionlessPrimitive {
    MethodInvoke(WspMethodInvokePrimitive),
    MethodResult(WspMethodResultPrimitive),
}

impl WspConnectionlessPrimitive {
    fn primitive(&self) -> WspServicePrimitive {
        match self {
            Self::MethodInvoke(_) => WspServicePrimitive::MethodInvoke,
            Self::MethodResult(_) => WspServicePrimitive::MethodResult,
        }
    }

    fn direction(&self) -> WspPrimitiveDirection {
        match self {
            Self::MethodInvoke(value) => value.direction,
            Self::MethodResult(value) => value.direction,
        }
    }
}

/// Identifies the Unitdata SAP without changing the one-request/one-PDU mapping.
/// `SecuritySap` models the optional equivalent SAP only; it does not activate a
/// WTLS implementation or a secure transport profile.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum WspUnitdataProvider {
    Wdp,
    SecuritySap,
}

/// Parameters that WAP-203 permits peers to agree out of band. They are retained
/// with the mapping trace and never serialized into a selected PDU.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct WspOutOfBandParameters {
    pub maximum_receive_unit: Option<u32>,
    pub persistent_headers: bool,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct WspConnectionlessUnitdataRequest {
    pub provider: WspUnitdataProvider,
    pub out_of_band: WspOutOfBandParameters,
    pub request: TDUnitdataRequest,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum WspPrimitiveMappingError {
    IllegalPrimitive(WspPrimitiveDecision),
    MissingDestinationAddress,
    MissingDestinationPort,
    UnexpectedPduForRole {
        role: WspEndpointRole,
        pdu: &'static str,
    },
    Encode(WspConnectionlessEncodeError),
    Decode(WspConnectionlessDecodeError),
}

impl std::fmt::Display for WspPrimitiveMappingError {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::IllegalPrimitive(decision) => {
                write!(
                    formatter,
                    "connectionless WSP primitive rejected: {decision:?}"
                )
            }
            Self::MissingDestinationAddress => {
                write!(
                    formatter,
                    "WDP indication is missing its destination address"
                )
            }
            Self::MissingDestinationPort => {
                write!(formatter, "WDP indication is missing its destination port")
            }
            Self::UnexpectedPduForRole { role, pdu } => {
                write!(formatter, "{pdu} is not an indication for {role:?}")
            }
            Self::Encode(error) => write!(formatter, "{error}"),
            Self::Decode(error) => write!(formatter, "{error}"),
        }
    }
}

impl std::error::Error for WspPrimitiveMappingError {}

/// Maps one legal local request primitive directly to one WDP Unitdata request.
pub fn primitive_request_to_unitdata(
    role: WspEndpointRole,
    provider: WspUnitdataProvider,
    out_of_band: WspOutOfBandParameters,
    primitive: &WspConnectionlessPrimitive,
) -> Result<WspConnectionlessUnitdataRequest, WspPrimitiveMappingError> {
    let (decision, _) = decide_wsp_primitive(role, primitive.primitive(), primitive.direction());
    if decision != WspPrimitiveDecision::Accept {
        return Err(WspPrimitiveMappingError::IllegalPrimitive(decision));
    }

    let (source, destination, pdu) = match primitive {
        WspConnectionlessPrimitive::MethodInvoke(value) => {
            let pdu = match value.method {
                WspConnectionlessMethod::Get => {
                    if !value.body.is_empty() {
                        return Err(WspPrimitiveMappingError::Encode(
                            WspConnectionlessEncodeError::GetBodyNotAllowed,
                        ));
                    }
                    WspConnectionlessPdu::Get {
                        transaction_id: value.transaction_id,
                        uri: value.uri.clone(),
                        headers: value.headers.clone(),
                    }
                }
                WspConnectionlessMethod::Post => WspConnectionlessPdu::Post {
                    transaction_id: value.transaction_id,
                    uri: value.uri.clone(),
                    content_type: value.content_type.clone().ok_or(
                        WspPrimitiveMappingError::Encode(
                            WspConnectionlessEncodeError::MissingPostContentType,
                        ),
                    )?,
                    headers: value.headers.clone(),
                    body: value.body.clone(),
                },
            };
            (&value.client, &value.server, pdu)
        }
        WspConnectionlessPrimitive::MethodResult(value) => (
            &value.server,
            &value.client,
            WspConnectionlessPdu::Reply {
                transaction_id: value.transaction_id,
                status_code: value.status_code,
                content_type: value.content_type.clone(),
                headers: value.headers.clone(),
                body: value.body.clone(),
            },
        ),
    };
    let user_data = encode_connectionless_pdu(&pdu).map_err(WspPrimitiveMappingError::Encode)?;
    Ok(WspConnectionlessUnitdataRequest {
        provider,
        out_of_band,
        request: TDUnitdataRequest {
            source_address: source.address.clone(),
            source_port: source.port,
            destination_address: destination.address.clone(),
            destination_port: destination.port,
            user_data,
        },
    })
}

/// Maps one received WDP Unitdata indication to the legal peer indication for
/// the local endpoint. No connectionless WSP state is created or mutated.
pub fn unitdata_indication_to_primitive(
    role: WspEndpointRole,
    indication: TDUnitdataIndication,
) -> Result<WspConnectionlessPrimitive, WspPrimitiveMappingError> {
    let destination_address = indication
        .destination_address
        .ok_or(WspPrimitiveMappingError::MissingDestinationAddress)?;
    let destination_port = indication
        .destination_port
        .ok_or(WspPrimitiveMappingError::MissingDestinationPort)?;
    let source = WspConnectionlessEndpoint {
        address: indication.source_address,
        port: indication.source_port,
    };
    let destination = WspConnectionlessEndpoint {
        address: destination_address,
        port: destination_port,
    };
    let pdu = decode_connectionless_pdu(&indication.user_data)
        .map_err(WspPrimitiveMappingError::Decode)?;

    match (role, pdu) {
        (
            WspEndpointRole::Server,
            WspConnectionlessPdu::Get {
                transaction_id,
                uri,
                headers,
            },
        ) => Ok(WspConnectionlessPrimitive::MethodInvoke(
            WspMethodInvokePrimitive {
                direction: WspPrimitiveDirection::Ind,
                server: destination,
                client: source,
                transaction_id,
                method: WspConnectionlessMethod::Get,
                uri,
                content_type: None,
                headers,
                body: Vec::new(),
            },
        )),
        (
            WspEndpointRole::Server,
            WspConnectionlessPdu::Post {
                transaction_id,
                uri,
                content_type,
                headers,
                body,
            },
        ) => Ok(WspConnectionlessPrimitive::MethodInvoke(
            WspMethodInvokePrimitive {
                direction: WspPrimitiveDirection::Ind,
                server: destination,
                client: source,
                transaction_id,
                method: WspConnectionlessMethod::Post,
                uri,
                content_type: Some(content_type),
                headers,
                body,
            },
        )),
        (
            WspEndpointRole::Client,
            WspConnectionlessPdu::Reply {
                transaction_id,
                status_code,
                content_type,
                headers,
                body,
            },
        ) => Ok(WspConnectionlessPrimitive::MethodResult(
            WspMethodResultPrimitive {
                direction: WspPrimitiveDirection::Ind,
                client: destination,
                server: source,
                transaction_id,
                status_code,
                content_type,
                headers,
                body,
            },
        )),
        (role, pdu) => Err(WspPrimitiveMappingError::UnexpectedPduForRole {
            role,
            pdu: match pdu {
                WspConnectionlessPdu::Get { .. } => "Get",
                WspConnectionlessPdu::Post { .. } => "Post",
                WspConnectionlessPdu::Reply { .. } => "Reply",
            },
        }),
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum WspConnectionlessUnitdataEvent {
    Indication {
        provider: WspUnitdataProvider,
        indication: TDUnitdataIndication,
    },
    TransportError {
        provider: WspUnitdataProvider,
    },
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum WspConnectionlessDispatch {
    Primitive {
        provider: WspUnitdataProvider,
        primitive: Box<WspConnectionlessPrimitive>,
    },
    IgnoredTransportError {
        provider: WspUnitdataProvider,
    },
}

/// Dispatches Unitdata input. WAP-203 connectionless transport error
/// indications are intentionally ignored at the WSP protocol layer.
pub fn dispatch_unitdata_event(
    role: WspEndpointRole,
    event: WspConnectionlessUnitdataEvent,
) -> Result<WspConnectionlessDispatch, WspPrimitiveMappingError> {
    match event {
        WspConnectionlessUnitdataEvent::Indication {
            provider,
            indication,
        } => Ok(WspConnectionlessDispatch::Primitive {
            provider,
            primitive: Box::new(unitdata_indication_to_primitive(role, indication)?),
        }),
        WspConnectionlessUnitdataEvent::TransportError { provider } => {
            Ok(WspConnectionlessDispatch::IgnoredTransportError { provider })
        }
    }
}
