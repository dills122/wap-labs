pub(super) fn extract_wml_body(xml: &str) -> Result<&str, String> {
    let open_start = find_tag_from(xml, "wml", 0)
        .ok_or_else(|| "Missing required <wml> root element".to_string())?;

    let open_end = xml[open_start..]
        .find('>')
        .map(|idx| open_start + idx)
        .ok_or_else(|| "Malformed <wml> opening tag".to_string())?;

    let close_start = xml[open_end + 1..]
        .find("</wml>")
        .map(|idx| open_end + 1 + idx)
        .ok_or_else(|| "Missing closing </wml> root element".to_string())?;

    Ok(&xml[open_end + 1..close_start])
}

pub(super) fn find_tag_from(xml: &str, tag_name: &str, from: usize) -> Option<usize> {
    let needle = format!("<{tag_name}");
    let mut search = from;
    while let Some(rel_idx) = xml[search..].find(&needle) {
        let idx = search + rel_idx;
        let next = xml[idx + needle.len()..].chars().next();
        match next {
            Some(ch) if ch.is_whitespace() || ch == '>' || ch == '/' => return Some(idx),
            _ => {
                search = idx + needle.len();
            }
        }
    }
    None
}

pub(super) fn starts_with_tag_at(xml: &str, from: usize, tag_name: &str) -> bool {
    if from >= xml.len() {
        return false;
    }
    let tail = &xml[from..];
    let needle = format!("<{tag_name}");
    let Some(rest) = tail.strip_prefix(&needle) else {
        return false;
    };
    match rest.chars().next() {
        Some(ch) => ch.is_whitespace() || ch == '>' || ch == '/',
        None => true,
    }
}

pub(super) fn extract_attr(tag: &str, attr: &str) -> Option<String> {
    let needle = format!("{attr}=\"");
    let start = tag.find(&needle)? + needle.len();
    let rest = &tag[start..];
    let end = rest.find('"')?;
    Some(rest[..end].to_string())
}

pub(super) fn normalize_text(input: &str) -> String {
    let mut out = String::new();
    let mut saw_whitespace = false;

    for ch in decode_entities(input).chars() {
        if ch.is_whitespace() {
            if !saw_whitespace {
                out.push(' ');
                saw_whitespace = true;
            }
        } else {
            out.push(ch);
            saw_whitespace = false;
        }
    }

    out.trim().to_string()
}

fn decode_entities(input: &str) -> String {
    input
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&amp;", "&")
        .replace("&quot;", "\"")
        .replace("&#39;", "'")
}
