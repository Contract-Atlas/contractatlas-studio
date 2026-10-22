# Changelog

## Unreleased
- Add `/registry` with eight official-source contract addresses, downloadable manifests and actual unavailable checker attempts. Validate every bundled report before displaying it; no live hash or audit mapping is claimed.
- Document the source GitHub Action and the distinction from `sdkt verify`.

## 0.2.0
- Product site: landing page, `/app` (the existing report viewer), `/docs`, `/about`, `/privacy`, `/terms`, and a 404 page, with a History API router and a shared header and footer.
- `/check`: opt-in live read of Stellar testnet contract instances with Soroban RPC `getLedgerEntries` against `https://soroban-testnet.stellar.org`. Shows the live WASM hash and latest ledger, and match or drift against an expected hash. Failed or empty reads are unavailable, never drift. The Stellar XDR code loads only when the button is pressed.
- CSP `connect-src` now lists the testnet RPC host and nothing else; SPA rewrite added to `vercel.json`.
- Logo, favicon, Open Graph image, robots.txt and sitemap.xml.

## 0.1.1
- Reports whose overall status contradicts their contract statuses are now rejected. Re-paired with the published 0.1.1 release of its core (`compat.json` and the vendor stamp record the version and commit). Recorded real-run samples keep the version that recorded them.

## 0.1.0 (unreleased)
- Report viewer for ContractAtlas report v1 with provenance, freshness and limitation sections.
- Before/after comparison of two reports.
- Bundled recorded testnet runs (before and after a real upgrade).
- Precompiled schema validator; strict CSP; untrusted-content-safe rendering.
- Version pairing with contractatlas-core 0.1.0.
