import { h } from "../dom.ts";
import { CLI_CHECK, INSTALL, LINKS } from "../site.ts";
import { codeBlock, ext, link } from "../ui.ts";
import { p, prose, section } from "./common.ts";

const FROM_SOURCE = `git clone https://github.com/Contract-Atlas/contractatlas-core.git
cd contractatlas-core
pnpm install --frozen-lockfile
pnpm build
node dist/cli.js check fixtures/testnet/manifest.json --rpc https://soroban-testnet.stellar.org`;

const MANIFEST = `{
  "schemaVersion": "1",
  "protocol": { "name": "My protocol" },
  "network": { "name": "testnet", "passphrase": "Test SDF Network ; September 2015" },
  "contracts": [{
    "id": "C...",
    "name": "Vault",
    "declaredWasmHash": "<64 hex>",
    "audits": [{
      "id": "audit-2026-01", "auditor": "...", "report": "https://...", "date": "2026-01-15",
      "reviewedWasmHashes": ["<64 hex>"]
    }]
  }]
}`;

export function renderDocs(): HTMLElement {
  return prose(
    "Getting started",
    "Run the core on a manifest, then open the report here. This page has the commands from the core README.",
    section("need", "What you need", h("ul", {}, h("li", {}, "Node 22 or newer."), h("li", {}, "pnpm, if you work from source."), h("li", {}, "A manifest for your contracts, and a Soroban RPC URL for the network you check."))),
    section(
      "run",
      "Run the core locally",
      p("Install the published package:"),
      codeBlock(INSTALL, "the install command"),
      p("Or work from source:"),
      codeBlock(FROM_SOURCE, "the source commands"),
      p("Check your own manifest and write a report file:"),
      codeBlock(CLI_CHECK, "the check command"),
      p("Other commands: ", h("code", {}, "contractatlas validate manifest.json"), " checks a manifest offline. Exit codes: 0 ok, 1 a failing status found, 2 invalid manifest or usage, 3 unexpected error. ", h("code", {}, "--strict"), " also fails on incomplete."),
    ),
    section("manifest", "A minimal manifest", codeBlock(MANIFEST, "the manifest example"), p("The full schema is in the core repository: ", ext(LINKS.core, "contractatlas-core"), ".")),
    section("ci", "CI checks and public examples", p("The ", ext(`${LINKS.core}/blob/main/action.yml`, "source GitHub Action"), " records a JSON report and status badge. By default it fails drift, incomplete evidence and unavailable reads. These changes are not yet in the published 0.1.1 package."), p("See the ", link("/registry", "public deployment registry"), " for official-source addresses and the recorded mainnet observations. All eight contracts are incomplete: the live reads worked, but no audit mapping was established."), p("sdkt verify compares live code with a local build. ContractAtlas compares it with explicit declarations and audit-reviewed hashes, and distinguishes missing evidence from code drift. An address alone cannot establish a match.")),
    section(
      "load",
      "Load your own data into this app",
      h("ol", {}, h("li", {}, "Produce a report with ", h("code", {}, "--out report.json"), "."), h("li", {}, "Open ", link("/app", "the app"), "."), h("li", {}, "Use \"Your report file\" or paste the JSON.")),
      p("The app validates the report against the report v1 schema and refuses unknown versions. The file is read in your browser and is not uploaded."),
    ),
    section(
      "live",
      "Live testnet check",
      p("The ", link("/check", "Live check"), " page reads contract instances from Stellar testnet through https://soroban-testnet.stellar.org after you press a button. It does not read mainnet. Use the CLI for mainnet."),
    ),
    section("more", "Full documentation", h("ul", {}, h("li", {}, ext(LINKS.coreDocs, "ContractAtlas core docs")), h("li", {}, ext(LINKS.studioDocs, "ContractAtlas app docs")))),
  );
}
