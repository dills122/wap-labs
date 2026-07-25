mod codec;
mod handler;
mod message;

pub use codec::{decode_wcmp, encode_wcmp, encoded_wcmp_len, WcmpDecodeError, WcmpEncodeError};
pub use handler::{
    generate_wcmp_error, handle_wcmp, WcmpErrorGenerationRequest, WcmpGenerationFailure,
    WcmpGenerationOutcome, WcmpHandlingError, WcmpHandlingOutcome, WcmpHandlingPolicy,
    WcmpOriginalDatagram, WcmpReportedError, WcmpSuppressionReason,
};
pub use message::{
    WcmpAddress, WcmpDestinationUnreachableCode, WcmpMessage, WcmpTypeClass,
    WCMP_TYPE_DESTINATION_UNREACHABLE, WCMP_TYPE_ECHO_REPLY, WCMP_TYPE_ECHO_REQUEST,
    WCMP_TYPE_MESSAGE_TOO_BIG, WDP_ADDRESS_TYPE_CDPD_IPV4, WDP_ADDRESS_TYPE_IPV4,
    WDP_ADDRESS_TYPE_IPV6,
};

#[cfg(test)]
mod tests;
