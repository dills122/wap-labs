mod codec;
mod handler;
mod icmpv4;
mod message;
mod profile;

pub use codec::{decode_wcmp, encode_wcmp, encoded_wcmp_len, WcmpDecodeError, WcmpEncodeError};
pub use handler::{
    generate_wcmp_error, handle_wcmp, WcmpErrorGenerationRequest, WcmpGenerationFailure,
    WcmpGenerationOutcome, WcmpHandlingError, WcmpHandlingOutcome, WcmpHandlingPolicy,
    WcmpOriginalDatagram, WcmpReportedError, WcmpSuppressionReason,
};
pub use icmpv4::{
    decode_icmpv4, encode_icmpv4, generate_icmpv4_error, handle_icmpv4, Icmpv4DecodeError,
    Icmpv4DestinationUnreachableCode, Icmpv4EncodeError, Icmpv4ErrorGenerationError,
    Icmpv4GeneratedError, Icmpv4HandlingError, Icmpv4HandlingOutcome, Icmpv4HandlingPolicy,
    Icmpv4Message, Icmpv4ReportedError, Icmpv4SuppressionReason, ICMPV4_PROTOCOL_NUMBER,
    ICMPV4_TYPE_DESTINATION_UNREACHABLE, ICMPV4_TYPE_ECHO_REPLY, ICMPV4_TYPE_ECHO_REQUEST,
};
pub use message::{
    WcmpAddress, WcmpDestinationUnreachableCode, WcmpMessage, WcmpTypeClass,
    WCMP_TYPE_DESTINATION_UNREACHABLE, WCMP_TYPE_ECHO_REPLY, WCMP_TYPE_ECHO_REQUEST,
    WCMP_TYPE_MESSAGE_TOO_BIG, WDP_ADDRESS_TYPE_CDPD_IPV4, WDP_ADDRESS_TYPE_IPV4,
    WDP_ADDRESS_TYPE_IPV6,
};
pub use profile::{
    decode_wdp_control_message, encode_wdp_control_message, handle_wdp_control_message,
    WdpControlDecodeError, WdpControlEncodeError, WdpControlHandlingError,
    WdpControlHandlingOutcome, WdpControlHandlingPolicy, WdpControlMessage, WdpControlProfile,
};

// Shared by `codec` and `icmpv4`, whose decoders each require a minimum
// input length before reading fixed-width fields, only differing in which
// `Truncated`-shaped error variant they report.
pub(super) fn require_min_len<E>(
    input: &[u8],
    needed: usize,
    truncated: impl FnOnce(usize, usize) -> E,
) -> Result<(), E> {
    if input.len() < needed {
        return Err(truncated(needed, input.len()));
    }
    Ok(())
}

#[cfg(test)]
mod tests;
