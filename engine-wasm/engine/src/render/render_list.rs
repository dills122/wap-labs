use serde::Serialize;

#[derive(Clone, Debug, Serialize, Default)]
pub struct RenderList {
    pub draw: Vec<DrawCmd>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(tag = "type")]
pub enum DrawCmd {
    #[serde(rename = "text")]
    Text { x: u32, y: u32, text: String },
    #[serde(rename = "link")]
    Link {
        x: u32,
        y: u32,
        text: String,
        focused: bool,
        href: String,
    },
}
