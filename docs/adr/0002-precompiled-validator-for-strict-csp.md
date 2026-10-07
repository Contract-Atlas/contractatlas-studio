# ADR 0002: Precompile the report validator

Status: accepted, 2026-10-07.

Ajv's default compile step uses `new Function`, which a CSP without `unsafe-eval` blocks. The first build rendered a blank page in a real browser while the jsdom tests passed. We keep the strict CSP and generate a standalone validator from the vendored JSON Schema with `scripts/gen-validator.mjs`. The generated file is committed and a test plus the build script fail if it is out of date with the vendored schema.
