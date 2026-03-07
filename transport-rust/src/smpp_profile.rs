#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum SmppAdaptationScope {
    InScope,
    Deferred,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct SmppAdaptationPolicy {
    pub scope: SmppAdaptationScope,
    pub rationale: &'static str,
}

pub fn smpp_adaptation_policy() -> SmppAdaptationPolicy {
    SmppAdaptationPolicy {
        scope: SmppAdaptationScope::Deferred,
        rationale:
            "WAP-159 SMPP data_sm adaptation is deferred for MVP; no transport-rust parser or mapping path is active.",
    }
}

pub fn smpp_deferred_guardrails() -> &'static [&'static str] {
    &[
        "No data_sm transport mapping is enabled in transport-rust.",
        "No WCMP-over-SMPP payload-type parsing is enabled in transport-rust.",
        "Any future SMPP activation requires explicit T0-13 follow-on ticketing before code-path enablement.",
    ]
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_support::load_json_fixture;
    use serde::Deserialize;

    #[derive(Debug, Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct SmppFixture {
        scope: String,
        guardrails: Vec<String>,
    }

    fn load_fixture() -> SmppFixture {
        load_json_fixture(&[
            "tests",
            "fixtures",
            "transport",
            "smpp_adaptation_scope_mapped",
            "scope_fixture.json",
        ])
    }

    fn scope_to_str(scope: SmppAdaptationScope) -> &'static str {
        match scope {
            SmppAdaptationScope::InScope => "in-scope",
            SmppAdaptationScope::Deferred => "deferred",
        }
    }

    #[test]
    fn smpp_adaptation_scope_matches_declared_fixture() {
        let fixture = load_fixture();
        let policy = smpp_adaptation_policy();
        assert_eq!(scope_to_str(policy.scope), fixture.scope);
        let actual: Vec<String> = smpp_deferred_guardrails()
            .iter()
            .map(|entry| entry.to_string())
            .collect();
        assert_eq!(actual, fixture.guardrails);
    }
}
