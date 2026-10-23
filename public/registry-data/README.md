# Public deployment registry

These are third-party transcriptions of official sources, retrieved 22 October 2026. Protocol maintainers have not reviewed these manifests. This is a small example registry, not a ranking or endorsement.

| Manifest | Contracts | Official source | Evidence declared |
|---|---|---|---|
| [Blend v2.1](manifests/blend-v2-1.json) | Emitter, backstop, pool factory | [Blend deployments](https://docs.blend.capital/mainnet-deployments) | Addresses only |
| [Soroswap](manifests/soroswap.json) | Factory, router | [Soroswap repository](https://github.com/soroswap/core/blob/main/public/mainnet.contracts.json) | Addresses and published WASM hashes |
| [Reflector](manifests/reflector.json) | Stellar DEX, external markets, fiat oracles | [Stellar oracle providers](https://developers.stellar.org/docs/data/oracles/oracle-providers) | Addresses only |

No audit-to-WASM mapping was established from these deployment sources. Audit arrays are empty on purpose. A successful read can still be `incomplete`; a published hash is not an audit reference. Do not copy a live hash into the declared field just to obtain a match.

## Recorded observations

Reports under `reports/` are outputs from the checker, run on 22 October 2026 against a public Stellar mainnet RPC endpoint (`https://mainnet.sorobanrpc.com`, a third-party endpoint that needs no key). All eight contracts returned `incomplete`: the live read worked, but these sources do not provide an audit-to-WASM mapping, so the tool does not report `match`. The Soroswap live hashes equal the hashes Soroswap publishes. Blend and Reflector declare addresses only. `incomplete` is not drift and not a defect in the protocols. These reports are not endorsements or audits.

## Reproduce

Build the current checkout, then provide a mainnet RPC endpoint you can access:

```bash
pnpm install --frozen-lockfile
pnpm run build
node scripts/check-registry.mjs https://YOUR_MAINNET_RPC ./registry-observation
```

The script checks network identity and writes JSON reports and SVG status badges into a new directory (`registry-observation` by default). It refuses to use an existing directory and never overwrites the committed `reports/` observations. Choose a new output directory for every run. It exits 1 for drift, incomplete evidence or unavailable reads, 2 for usage/output-directory errors, and 3 for checker execution failures. The workflow uploads only its fresh run directory; failed builds or invalid inputs cannot upload the committed reports as current evidence. It never signs or submits transactions. A source page may move or change; inspect `index.json`, confirm the addresses with the linked official sources, and review changes to declared hashes before recording again.
