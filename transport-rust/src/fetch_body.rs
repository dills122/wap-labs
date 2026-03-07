use std::io::Read;

pub(crate) enum ReadBodyError {
    ReadFailed(String),
    TooLarge { limit_bytes: usize },
}

pub(crate) fn read_response_body_limited(
    response: &mut reqwest::blocking::Response,
    max_bytes: usize,
) -> Result<Vec<u8>, ReadBodyError> {
    let mut body = Vec::new();
    let mut reader = response.take((max_bytes as u64).saturating_add(1));
    reader
        .read_to_end(&mut body)
        .map_err(|err| ReadBodyError::ReadFailed(format!("transport read failed: {err}")))?;
    if body.len() > max_bytes {
        return Err(ReadBodyError::TooLarge {
            limit_bytes: max_bytes,
        });
    }
    Ok(body)
}
