# Run

Node 22 or newer and pnpm.

```bash
git clone https://github.com/Contract-Atlas/contractatlas-studio.git
cd contractatlas-studio
pnpm install --frozen-lockfile
pnpm dev            # or: pnpm build && pnpm preview
```

Open the page, pick a **recorded testnet run**, or load your own report:

```bash
contractatlas check manifest.json --rpc https://soroban-testnet.stellar.org --out report.json
```

then use "Your report file" or paste the JSON. Files are read in your browser and never uploaded; the page makes no network requests.
