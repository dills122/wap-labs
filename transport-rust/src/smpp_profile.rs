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
    use serde::Deserialize;
    use std::fs;
    use std::path::PathBuf;

    #[derive(Debug, Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct SmppFixture {
        scope: String,
        guardrails: Vec<String>,
    }

    fn load_fixture() -> SmppFixture {
        let fixture_path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("tests")
            .join("fixtures")
            .join("transport")
            .join("smpp_adaptation_scope_mapped")
            .join("scope_fixture.json");
        let raw = fs::read_to_string(&fixture_path)
            .unwrap_or_else(|_| panic!("failed reading {}", fixture_path.display()));
        serde_json::from_str(&raw)
            .unwrap_or_else(|_| panic!("failed parsing {}", fixture_path.display()))
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
