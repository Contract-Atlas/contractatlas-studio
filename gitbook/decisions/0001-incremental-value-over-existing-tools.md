# ADR 0001: Why a separate report page

Status: accepted, 2026-10-07. Based on the Stellar Lab Contract Explorer documentation read on that date; no tool was executed.

Stellar Lab's Contract Explorer is interactive and per contract: contract info (including WASM hash and a source link), spec, storage, restore, and build-verification attestation. It does not read a project's published disclosure or report on whether the live code is covered by an audit reference.

This page therefore does not duplicate an explorer. It presents a ContractAtlas report (a disclosure compared with live data) with provenance and the evidence for each status, and can show what changed between two observations. It deliberately has no live lookup so a public host cannot be used to reach arbitrary RPC endpoints.

If Lab or another tool adopts a manifest-to-live comparison, this page's schema reader could be reused or retired in favor of that.
