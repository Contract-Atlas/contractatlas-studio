# What you see

- Overall status, counts, observation time and an explicit **stale** warning when the report is older than 24 hours.
- Provenance: producing tool and version, RPC origin, latest ledger, network identity check, manifest SHA-256.
- Per contract: live vs declared WASM hash, findings with their codes, audit references (does each list the live artifact?), and project declarations (privileges, dependencies, limitations) under a label that says they are not verified.
- A fixed "what this report does not establish" section from the report.
- **Compare**: for the bundled recorded runs, a before/after table showing fixture A going from match to drift because the live WASM changed.

The two bundled reports are real runs against testnet around a real on-chain upgrade, copied from contractatlas-core's fixtures. The page labels them "recorded, not live".

Evidence (real browser, 2026-10-07): [comparison on desktop](https://github.com/Contract-Atlas/contractatlas-studio/blob/main/docs/evidence/comparison-desktop.jpg), [drift card at 375 px](https://github.com/Contract-Atlas/contractatlas-studio/blob/main/docs/evidence/drift-card-mobile-375.jpg).
