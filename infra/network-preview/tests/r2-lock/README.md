# R2 Lock Integration Fixture

This fixture is not part of ordinary local or pull-request verification. It exists to prove
Cloudflare R2 behavior with OpenTofu's native S3 lock file after `PRE-003` supplies a protected,
bucket-scoped test environment.

The driver copies the production backend/encryption contract into an isolated temporary root and
uses only a built-in `terraform_data` resource with a bounded local sleep. It must use a unique
key below the configured test prefix and must never target the preview state key. The protected
runner must supply `NETWORK_PREVIEW_R2_TEST_RUN_ID` as a newly generated lowercase UUID for every
execution. The driver refuses to proceed if that UUID's prefix already contains any object.

The protected test must demonstrate:

1. an OpenTofu operation acquires the lock;
2. a contender fails while the lock is held;
3. graceful completion releases the lock;
4. a terminated holder leaves a recoverable stale lock;
5. `tofu force-unlock` clears that exact lock ID;
6. a later plan succeeds and cleanup removes test state/lock objects.

The checked-in script validates its inputs and fails closed, but it has intentionally not been run
by `INF-101`. Running it mutates only its isolated R2 test prefix and requires explicit protected-
environment authorization.
