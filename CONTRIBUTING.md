# Contributing

```bash
pnpm install --frozen-lockfile
pnpm run typecheck && pnpm test && pnpm run build
```

- The studio must not decide anything: statuses, findings and provenance come from the report. If you need a new field, add it to contractatlas-core's report schema first, then run `pnpm vendor ../contractatlas-core` and `pnpm gen`.
- Insert report text with `h()`/text nodes only. No `innerHTML`, no new network requests.
- Keep the CSP free of `unsafe-eval` and `unsafe-inline`.
- Test visual changes in a real browser at desktop and 375 px width, not only in jsdom. Measure overflow with `main.scrollWidth` against `clientWidth`; `window.innerWidth` is not reliable on emulated phones because the layout viewport grows with overflowing content.
- One logical change per commit; AI-assisted changes are welcome if you understand and verified them.
