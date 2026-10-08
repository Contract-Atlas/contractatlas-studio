# Develop

```bash
pnpm run typecheck
pnpm test        # validation, rendering, CLI-text agreement, XSS and link safety, pairing, app flow (jsdom)
pnpm run build   # also checks the generated validator is current
```

`test/view.test.ts` parses the CLI's own text output (`vendor/.../*.txt`) and asserts the page shows the same status and the same finding codes for every contract.
