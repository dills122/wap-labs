use crate::FetchCancellationToken;
use std::future::Future;
use std::time::Duration;

pub(crate) enum ReadBodyError {
    ReadFailed(String),
    TooLarge { limit_bytes: usize },
    Cancelled,
}

/// Wait for cancellation without requiring a new public async cancellation API.
pub(crate) async fn wait_for_cancellation(token: Option<&FetchCancellationToken>) {
    let Some(token) = token else {
        std::future::pending::<()>().await;
        return;
    };
    while !token.is_cancelled() {
        tokio::time::sleep(Duration::from_millis(25)).await;
    }
}

/// Check again after the operation completes: the token can be cancelled
/// between the timer poll and a ready network result in the same select.
pub(crate) async fn run_until_cancelled<F: Future>(
    future: F,
    cancellation: Option<&FetchCancellationToken>,
) -> Result<F::Output, ()> {
    let result = tokio::select! {
        biased;
        _ = wait_for_cancellation(cancellation) => return Err(()),
        result = future => result,
    };
    if cancellation.is_some_and(FetchCancellationToken::is_cancelled) {
        Err(())
    } else {
        Ok(result)
    }
}

pub(crate) async fn read_response_body_limited(
    response: &mut reqwest::Response,
    max_bytes: usize,
    cancellation: Option<&FetchCancellationToken>,
) -> Result<Vec<u8>, ReadBodyError> {
    let mut body = Vec::new();
    loop {
        let chunk = run_until_cancelled(response.chunk(), cancellation)
            .await
            .map_err(|()| ReadBodyError::Cancelled)?
            .map_err(|err| ReadBodyError::ReadFailed(format!("transport read failed: {err}")))?;
        let Some(chunk) = chunk else { return Ok(body) };
        if chunk.len() > max_bytes.saturating_sub(body.len()) {
            return Err(ReadBodyError::TooLarge {
                limit_bytes: max_bytes,
            });
        }
        body.extend_from_slice(&chunk);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn cancellation_wins_when_an_operation_completes_during_the_poll_interval() {
        let runtime = tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .unwrap();
        runtime.block_on(async {
            for result in [Ok(123), Err("network error")] {
                let token = FetchCancellationToken::default();
                let cancel = token.clone();
                let outcome = run_until_cancelled(
                    async move {
                        cancel.cancel();
                        result
                    },
                    Some(&token),
                )
                .await;
                assert!(
                    outcome.is_err(),
                    "cancellation must supersede the ready result"
                );
            }
            assert_eq!(run_until_cancelled(async { 123 }, None).await, Ok(123));
        });
    }
}
