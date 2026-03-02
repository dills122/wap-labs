pub fn default_confirm_result() -> bool {
    false
}

pub fn default_prompt_result(default_value: Option<&str>) -> String {
    default_value.unwrap_or_default().to_string()
}

#[cfg(test)]
mod tests {
    use super::{default_confirm_result, default_prompt_result};

    #[test]
    fn confirm_result_is_deterministic() {
        assert!(!default_confirm_result());
    }

    #[test]
    fn prompt_result_uses_default_when_present() {
        assert_eq!(default_prompt_result(Some("guest")), "guest");
        assert_eq!(default_prompt_result(None), "");
    }
}
