#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum WspPrimitiveDirection {
    Req,
    Ind,
    Res,
    Cnf,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum WspServicePrimitive {
    MethodInvoke,
    MethodResult,
    Push,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum WspPrimitiveProfileMode {
    ConnectionOriented,
    Connectionless,
    Both,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct WspPrimitiveProfile {
    pub mode: WspPrimitiveProfileMode,
    pub push_allowed: bool,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct WspPrimitiveState {
    pub awaiting_result: bool,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum WspPrimitiveDecision {
    Accept,
    RejectUnsupportedMode,
    RejectPrimitive,
    RejectDirection,
    RejectSequence,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct WspPrimitiveTrace {
    pub mode: WspPrimitiveProfileMode,
    pub primitive: WspServicePrimitive,
    pub direction: WspPrimitiveDirection,
    pub before_state_awaiting_result: bool,
    pub after_state_awaiting_result: bool,
    pub decision: WspPrimitiveDecision,
}

pub fn decide_wsp_primitive_transition(
    profile: &WspPrimitiveProfile,
    state: &WspPrimitiveState,
    primitive: WspServicePrimitive,
    direction: WspPrimitiveDirection,
) -> (WspPrimitiveDecision, WspPrimitiveState, WspPrimitiveTrace) {
    let supports_direction = match profile.mode {
        WspPrimitiveProfileMode::ConnectionOriented => match direction {
            WspPrimitiveDirection::Res | WspPrimitiveDirection::Cnf => true,
            WspPrimitiveDirection::Req | WspPrimitiveDirection::Ind => false,
        },
        WspPrimitiveProfileMode::Connectionless => match direction {
            WspPrimitiveDirection::Req | WspPrimitiveDirection::Ind => true,
            WspPrimitiveDirection::Res | WspPrimitiveDirection::Cnf => false,
        },
        WspPrimitiveProfileMode::Both => true,
    };

    if !supports_direction {
        let trace = WspPrimitiveTrace {
            mode: profile.mode,
            primitive,
            direction,
            before_state_awaiting_result: state.awaiting_result,
            after_state_awaiting_result: state.awaiting_result,
            decision: WspPrimitiveDecision::RejectDirection,
        };
        return (WspPrimitiveDecision::RejectDirection, *state, trace);
    }

    if let WspServicePrimitive::Push = primitive {
        if !profile.push_allowed {
            let trace = WspPrimitiveTrace {
                mode: profile.mode,
                primitive,
                direction,
                before_state_awaiting_result: state.awaiting_result,
                after_state_awaiting_result: state.awaiting_result,
                decision: WspPrimitiveDecision::RejectPrimitive,
            };
            return (WspPrimitiveDecision::RejectPrimitive, *state, trace);
        }
    }

    let next_state = match direction {
        WspPrimitiveDirection::Req | WspPrimitiveDirection::Ind => match primitive {
            WspServicePrimitive::MethodInvoke => {
                if state.awaiting_result {
                    let trace = WspPrimitiveTrace {
                        mode: profile.mode,
                        primitive,
                        direction,
                        before_state_awaiting_result: state.awaiting_result,
                        after_state_awaiting_result: state.awaiting_result,
                        decision: WspPrimitiveDecision::RejectSequence,
                    };
                    return (WspPrimitiveDecision::RejectSequence, *state, trace);
                }
                WspPrimitiveState {
                    awaiting_result: true,
                }
            }
            WspServicePrimitive::MethodResult => {
                if !state.awaiting_result {
                    let trace = WspPrimitiveTrace {
                        mode: profile.mode,
                        primitive,
                        direction,
                        before_state_awaiting_result: state.awaiting_result,
                        after_state_awaiting_result: state.awaiting_result,
                        decision: WspPrimitiveDecision::RejectSequence,
                    };
                    return (WspPrimitiveDecision::RejectSequence, *state, trace);
                }
                WspPrimitiveState {
                    awaiting_result: false,
                }
            }
            WspServicePrimitive::Push => WspPrimitiveState {
                awaiting_result: false,
            },
        },
        WspPrimitiveDirection::Res | WspPrimitiveDirection::Cnf => *state,
    };

    let trace = WspPrimitiveTrace {
        mode: profile.mode,
        primitive,
        direction,
        before_state_awaiting_result: state.awaiting_result,
        after_state_awaiting_result: next_state.awaiting_result,
        decision: WspPrimitiveDecision::Accept,
    };

    (WspPrimitiveDecision::Accept, next_state, trace)
}
