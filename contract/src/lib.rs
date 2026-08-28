#![warn(clippy::style)]

extern crate alloc;

pub const CONTRACT_VERSION: &str = "0.1.0";

wit_bindgen::generate!({
    world: "research-brief",
    path: "wit",
    additional_derives: [
        serde::Deserialize,
        serde::Serialize,
    ],
    generate_all,
});

pub mod draft;

#[allow(dead_code)]
struct Component;

#[cfg(target_arch = "wasm32")]
impl exports::z::research_brief::contracts::Guest for Component {
    fn draft_brief(
        req: exports::z::research_brief::contracts::GenericInput,
    ) -> Result<alloc::vec::Vec<u8>, alloc::string::String> {
        let input = req.input.ok_or("draft-brief: missing input")?;
        draft::draft_brief(&input)
    }

    fn get_brief(
        req: exports::z::research_brief::contracts::GenericInput,
    ) -> Result<alloc::vec::Vec<u8>, alloc::string::String> {
        let input = req.input.ok_or("get-brief: missing input")?;
        draft::get_brief(&input)
    }

    fn list_briefs(
        req: exports::z::research_brief::contracts::GenericInput,
    ) -> Result<alloc::vec::Vec<u8>, alloc::string::String> {
        let input = req.input.unwrap_or_default();
        draft::list_briefs(&input)
    }
}

#[cfg(target_arch = "wasm32")]
export!(Component);

#[cfg(test)]
mod tests {
    use super::CONTRACT_VERSION;

    #[test]
    fn contract_version_is_semver() {
        let parts: Vec<&str> = CONTRACT_VERSION.split('.').collect();
        assert_eq!(parts.len(), 3);
    }
}
