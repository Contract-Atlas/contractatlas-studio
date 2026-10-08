# Version pairing with the core

| studio | contractatlas-core | report version | status |
|---|---|---|---|
| 0.1.1 | 0.1.1 (commit in `vendor/contractatlas-core/VERSION.json`) | 1 | tested |

The report JSON Schema and sample reports are vendored (`pnpm vendor ../contractatlas-core` refreshes them and the stamp); `compat.json`, the tests and CI check the pairing. The repo has no dependency on a sibling path and builds from a clean clone.
