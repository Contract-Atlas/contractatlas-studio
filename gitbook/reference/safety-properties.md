# Safety properties

- Report content is untrusted. Everything is inserted as text nodes; audit links are clickable only if they are `https:`; no `innerHTML`.
- Strict Content-Security-Policy (`script-src 'self'`, no `unsafe-eval`). The report validator is precompiled from the schema at build time (`pnpm gen`), because runtime schema compilation would need `unsafe-eval`; this was found by testing in a real browser, not in jsdom.
- No RPC access, no URL fetching, no server component: a visitor cannot make the host reach any address.
- Unknown report versions are refused. A report from a different core version that still matches the v1 schema is shown with a note.
