# contractatlas-studio: specification (v0.1)

## User
Someone reading a protocol's deployment disclosure (an integrator, a reviewer, a user) who wants the evidence behind each contract's status, without installing the CLI. Secondary: the maintainer who publishes the report.

## Supported scope
- Load a ContractAtlas report v1 (bundled recorded runs, file, paste), validate it, render it.
- Compare two reports by contract ID.
- Provenance, freshness (stale after 24 h) and limitation statements as given by the report.

## Non-goals
- No RPC access, no live checking, no manifest authoring, no verdict computation, no score.
- No upload or storage of reports; no accounts.

## Data model
Input is exactly `report.v1.schema.json` from contractatlas-core (vendored). The studio adds no fields.

## Failure classes
| Input | Result |
|---|---|
| Not JSON | error alert, previous report cleared |
| `reportVersion` other than "1" | refused with the version named |
| Fails schema (extra fields, bad hash) | refused with the first schema errors |
| Summary counts disagree with contract statuses | refused |
| Valid, different producing-tool version | shown with a note |
| Observation older than 24 h, or in the future | shown with a stale warning |
| Network mismatch / unavailable in the report | shown as "no contracts were compared" |

## Interfaces
Pure render functions (`renderReport`, `renderComparison`) over validated reports; `main.ts` wires file, paste and sample inputs.

## Acceptance criteria (each tested)
1. Status and finding codes per contract equal those in the CLI text output for both recorded runs.
2. Hostile strings in a report render as text; `javascript:` links are not clickable.
3. Before/after comparison flags exactly the contract whose live hash changed.
4. Unknown versions, schema violations and inconsistent summaries are rejected.
5. Pairing file, vendored version stamp, sample reports and generated validator agree.
6. Page works under a CSP with no `unsafe-eval` in a real browser at desktop and 375 px widths (manual evidence in `docs/evidence`).
