import before from "../../vendor/contractatlas-core/reports/01-before-upgrade.json";
import after from "../../vendor/contractatlas-core/reports/02-after-upgrade.json";
import { h } from "../dom.ts";
import { CLI_CHECK, INSTALL, LIMITS, LINKS, PROJECT, VALUE } from "../site.ts";
import { btnLink, codeBlock, ext, link } from "../ui.ts";
import { p, section } from "./common.ts";

interface SampleContract { name: string; status: string; live: { kind: string; wasmHash?: string }; declared: { wasmHash: string | null } }
interface SampleReport { overall: string; observedAt: string; provenance: { latestLedger?: number }; contracts: SampleContract[] }

const short = (x: string) => `${x.slice(0, 10)}…${x.slice(-8)}`;
const label = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function sample(title: string, r: SampleReport): HTMLElement {
  return h(
    "div",
    { class: "sample" },
    h("h3", {}, title),
    h("p", { class: "muted small" }, `Recorded ${r.observedAt.slice(0, 19).replace("T", " ")} UTC against Stellar testnet. Overall: `, h("strong", {}, label(r.overall))),
    h(
      "ul",
      { class: "plain" },
      ...r.contracts.map((c) =>
        h(
          "li",
          { class: "sample-row" },
          h("span", { class: `badge badge-${c.status}` }, label(c.status)),
          " ",
          h("strong", {}, c.name),
          h("div", { class: "mono-small" }, `live ${c.live.wasmHash ? short(c.live.wasmHash) : c.live.kind}  declared ${c.declared.wasmHash ? short(c.declared.wasmHash) : "none"}`),
        ),
      ),
    ),
  );
}

export function renderLanding(): HTMLElement {
  const hero = h(
    "section",
    { class: "hero", "aria-labelledby": "hero-title" },
    h("p", { class: "eyebrow" }, "Soroban deployment and audit scope"),
    h("h1", { id: "hero-title" }, PROJECT),
    h("p", { class: "value" }, VALUE),
    p(
      "A protocol writes a manifest of its contract IDs, the WASM hash it expects for each, and the audits that list reviewed hashes. ContractAtlas reads the live executable from Soroban RPC and reports match, drift, incomplete or unavailable for every contract.",
    ),
    h("div", { class: "cta" }, btnLink("/app", "Open the app"), btnLink("/docs", "Read the docs", "secondary"), btnLink("/check", "Run a live testnet check", "secondary")),
    h("p", { class: "muted small" }, "Runs on Soroban RPC · testnet and mainnet-compatible (mainnet checks use the CLI)"),
  );

  const problem = section(
    "problem",
    "The problem",
    p("An audit reviews one version of a contract. A Soroban contract can be upgraded afterwards, and the audit report still points at the old code."),
    p("A reader of a protocol's disclosure has no quick way to see whether the WASM live on chain is the WASM the audit listed. Many audits name a source commit only, which does not say which compiled artifact was reviewed."),
    p("Tools that treat a failed RPC read as a mismatch, or a missing mapping as a pass, make this worse. ContractAtlas never does either."),
  );

  const steps = section(
    "how",
    "How it works",
    h(
      "ol",
      { class: "steps" },
      h("li", {}, h("strong", {}, "Declare."), " The protocol writes a manifest: contract IDs, expected WASM hashes, audit references with the hashes they reviewed."),
      h("li", {}, h("strong", {}, "Read."), " The core calls Soroban RPC getLedgerEntries for each contract instance and extracts the executable WASM hash."),
      h("li", {}, h("strong", {}, "Classify."), " Each contract becomes match, drift, incomplete or unavailable, with findings that say why."),
      h("li", {}, h("strong", {}, "Show."), " The report renders in a terminal, in CI and in this app, with provenance and a fixed limits section."),
    ),
  );

  const caps = section(
    "caps",
    "What you get",
    h(
      "ul",
      { class: "grid" },
      ...[
        ["Four explicit states", "match, drift, incomplete and unavailable, each with the evidence behind it."],
        ["Failed reads are not drift", "A read that fails, or an instance that is not a live entry, is reported unavailable."],
        ["No mapping, no audit claim", "An audit that names source only leaves coverage unresolved. It is never shown as covering the live code."],
        ["Before and after comparison", "Compare two reports by contract ID to see which live hash changed."],
        ["Provenance and freshness", "Tool version, RPC origin, ledger, network check, manifest hash, and a stale warning after 24 hours."],
        ["Local viewing", "Reports you load are read in your browser. Nothing is uploaded."],
      ].map(([t, d]) => h("li", { class: "card-lite" }, h("h3", {}, t), p(d))),
    ),
  );

  const example = section(
    "example",
    "A real recorded example",
    p("Two fixture contracts on Stellar testnet were checked, upgraded on chain, and checked again. These are recorded reports, not live data. The review labels in the fixture are fictional, not professional audits."),
    h("div", { class: "samples" }, sample("Run 1: before the upgrade", before as unknown as SampleReport), sample("Run 2: after the upgrade", after as unknown as SampleReport)),
    p("The manifest was not edited between runs, so the second report shows what a maintainer would see after upgrading and forgetting to update the disclosure. ", link("/app", "Open both reports in the app"), "."),
  );

  const stellar = section(
    "stellar",
    "Built on Stellar",
    h(
      "ul",
      { class: "plain stack" },
      h("li", {}, h("strong", {}, "Soroban RPC getLedgerEntries."), " The one request the core and the live check make per contract."),
      h("li", {}, h("strong", {}, "Contract instance executable (WASM hash)."), " The value that is compared with the declared hash and the hashes audits list."),
      h("li", {}, h("strong", {}, "Testnet fixture contracts."), " Fixture A was upgraded from v1 to v2 on testnet, fixture B was left unchanged. IDs and transactions are in ", ext(LINKS.deployment, "DEPLOYMENT.md"), "."),
    ),
  );

  const stack = section(
    "stack",
    "Use it in your stack",
    p("Install the core, then check a manifest from the command line or CI."),
    codeBlock(INSTALL, "the install command"),
    codeBlock(CLI_CHECK, "the check command"),
    p("The core is published as ", ext(LINKS.npm, "@anas.abubakar/contractatlas-core"), ". The command exits 1 on drift or unavailable."),
  );

  const limits = section("limits", "What it does not do", h("ul", {}, ...LIMITS.map((l) => h("li", {}, l))), p("There is no safety score and no audited label. See the ", ext(LINKS.coreSpec, "core specification"), "."));

  const oss = section(
    "oss",
    "Open source",
    p("ContractAtlas is MIT licensed and developed in public. The core and this app live in two repositories."),
    h(
      "ul",
      { class: "plain stack" },
      h("li", {}, ext(LINKS.core, "contractatlas-core"), " and ", ext(LINKS.studio, "contractatlas-studio")),
      h("li", {}, ext(LINKS.goodFirstIssue, "Good first issues"), " · ", ext(LINKS.studioIssues, "All issues")),
      h("li", {}, ext(LINKS.contributing, "CONTRIBUTING.md"), " · ", ext(LINKS.discussions, "Discussions")),
    ),
  );

  return h("div", { class: "landing" }, hero, problem, steps, caps, example, stellar, stack, limits, oss);
}
