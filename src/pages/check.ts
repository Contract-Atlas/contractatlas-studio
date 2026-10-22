import { h } from "../dom.ts";
import { FIXTURES, LINKS, MAX_CONTRACTS, TESTNET_HOST, TESTNET_RPC } from "../site.ts";
import type { ContractRead, Outcome } from "../live.ts";

// live.ts pulls in the Stellar XDR library, so it is only loaded when the button is pressed.
const loadLive = () => import("../live.ts");
import { codeBlock, ext, link } from "../ui.ts";
import { p } from "./common.ts";

const LABEL: Record<Outcome, string> = { match: "Match", drift: "Drift", read: "Read", incomplete: "Incomplete", unavailable: "Unavailable" };
const MEANING: Record<Outcome, string> = {
  match: "The live WASM hash equals the expected hash you entered.",
  drift: "The live WASM hash differs from the expected hash you entered.",
  read: "The live code was read. No expected hash was given, so nothing was compared.",
  incomplete: "The executable is not WASM, so it cannot be compared with a WASM hash.",
  unavailable: "The read failed or returned no live entry. This is not evidence of a mismatch.",
};

function row(index: number, id: string): HTMLElement {
  const n = String(index);
  return h(
    "fieldset",
    { class: "crow", "data-row": n },
    h("legend", {}, `Contract ${index + 1}`),
    h("label", { for: `cid-${n}` }, "Contract ID"),
    h("input", { id: `cid-${n}`, class: "cid", type: "text", value: id, autocomplete: "off", spellcheck: "false", placeholder: "C…", "aria-describedby": `cerr-${n}` }),
    h("label", { for: `exp-${n}` }, "Expected WASM hash (optional, 64 hex characters)"),
    h("input", { id: `exp-${n}`, class: "exp", type: "text", autocomplete: "off", spellcheck: "false", placeholder: "leave empty to only read the live hash", "aria-describedby": `cerr-${n}` }),
    h("p", { id: `cerr-${n}`, class: "field-error", role: "alert" }),
  );
}

function resultCard(r: ContractRead, expected: string | null, o: Outcome): HTMLElement {
  const live = r.read;
  const liveText =
    live.kind === "wasm" ? h("code", { class: "hash" }, live.wasmHash)
    : live.kind === "stellar_asset" ? h("span", {}, "Stellar Asset Contract (no WASM to compare)")
    : live.kind === "other_executable" ? h("span", {}, `Non-WASM executable (${live.detail})`)
    : h("span", {}, `Unavailable: ${live.reason}`);
  return h(
    "article",
    { class: `card card-${o === "read" ? "unavailable" : o}`, "data-contract-id": r.contractId, "data-outcome": o },
    h("header", { class: "card-head" }, h("h3", {}, "Contract"), h("span", { class: `badge badge-${o === "read" ? "unavailable" : o}`, title: MEANING[o] }, LABEL[o])),
    h("p", { class: "mono-line" }, h("code", {}, r.contractId)),
    h(
      "dl",
      { class: "facts" },
      h("dt", {}, "Live WASM hash"),
      h("dd", {}, liveText),
      h("dt", {}, "Expected WASM hash"),
      h("dd", {}, expected ? h("code", { class: "hash" }, expected) : h("span", { class: "muted" }, "none given")),
      h("dt", {}, "Latest ledger"),
      h("dd", {}, r.latestLedger === null ? "not reported" : String(r.latestLedger)),
    ),
    h("p", { class: "muted small" }, MEANING[o]),
  );
}

export function renderCheck(): HTMLElement {
  const rows = h("div", { class: "rows" });
  let count = 0;
  const addRow = (id: string) => rows.append(row(count++, id));
  addRow(FIXTURES.a);
  addRow(FIXTURES.b);

  const addBtn = h("button", { type: "button", class: "btn-quiet" }, "Add a contract");
  addBtn.addEventListener("click", () => {
    if (rows.children.length >= MAX_CONTRACTS) return;
    addRow("");
    if (rows.children.length >= MAX_CONTRACTS) addBtn.setAttribute("disabled", "");
  });
  const go = h("button", { type: "submit", class: "btn btn-primary" }, "Read live code");
  const status = h("p", { class: "muted small", role: "status", "aria-live": "polite" });
  const results = h("div", { class: "results" });

  const form = h("form", { class: "check-form", novalidate: true, "aria-labelledby": "check-h" }, rows, h("div", { class: "form-actions" }, addBtn, go), status);
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const { isContractId, isWasmHash, outcomeFor, readContract } = await loadLive();
    const items: Array<{ id: string; expected: string | null }> = [];
    let bad = false;
    for (const r of Array.from(rows.children)) {
      const id = (r.querySelector(".cid") as HTMLInputElement).value.trim();
      const exp = (r.querySelector(".exp") as HTMLInputElement).value.trim().toLowerCase();
      const err = r.querySelector(".field-error") as HTMLElement;
      err.textContent = "";
      if (id === "" && exp === "") continue;
      if (!isContractId(id)) err.textContent = "Enter a valid contract ID: 56 characters starting with C.";
      else if (exp !== "" && !isWasmHash(exp)) err.textContent = "The expected hash must be 64 hexadecimal characters.";
      if (err.textContent) bad = true;
      else items.push({ id, expected: exp === "" ? null : exp });
    }
    results.replaceChildren();
    if (bad) {
      status.textContent = "Fix the highlighted fields. No request was sent.";
      return;
    }
    if (items.length === 0) {
      status.textContent = "Enter at least one contract ID.";
      return;
    }
    go.setAttribute("disabled", "");
    status.textContent = `Contacting ${TESTNET_HOST}…`;
    const reads = await Promise.all(items.map((i) => readContract(i.id)));
    const ledgers = reads.map((r) => r.latestLedger).filter((x): x is number => x !== null);
    const failed = reads.filter((r) => r.read.kind === "unavailable").length;
    results.append(
      h("h2", { id: "res-h" }, "Result"),
      h("p", { class: "muted small" }, `Read from ${TESTNET_HOST} on Stellar testnet at ${new Date().toISOString().slice(0, 19).replace("T", " ")} UTC. Latest ledger: ${ledgers.length ? Math.max(...ledgers) : "not reported"}.`),
      ...(failed > 0 ? [h("div", { class: "error", role: "alert" }, `${failed} of ${reads.length} reads could not be completed. They are shown as unavailable, not as drift.`)] : []),
      ...reads.map((r, i) => resultCard(r, items[i]!.expected, outcomeFor(r.read, items[i]!.expected))),
    );
    status.textContent = "Done.";
    go.removeAttribute("disabled");
  });

  return h(
    "article",
    { class: "prose check" },
    h("h1", { id: "check-h" }, "Live check (testnet)"),
    p("Read the code that is live on Stellar testnet for one or more contracts, and compare it with a WASM hash you expect. The two fixture contracts are filled in."),
    h(
      "div",
      { class: "notice", id: "network-notice" },
      h("p", {}, h("strong", {}, "Network use. "), `This page contacts one host only: ${TESTNET_RPC}. It sends a Soroban RPC getLedgerEntries request containing each contract ID, and only after you press "Read live code". Nothing is sent before that.`),
      h("p", {}, "It reads testnet only. Checks on mainnet are done with the CLI. The operator of the RPC endpoint applies its own policies."),
    ),
    form,
    results,
    h(
      "section",
      { class: "block", "aria-labelledby": "fx-h" },
      h("h2", { id: "fx-h" }, "About the fixture contracts"),
      p("Fixture A was upgraded on testnet from v1 to v2; fixture B was never upgraded. Their IDs and transactions are in ", ext(LINKS.deployment, "DEPLOYMENT.md"), ". Expected hashes to try:"),
      codeBlock(`v1  ${FIXTURES.v1}\nv2  ${FIXTURES.v2}`, "the fixture hashes"),
      p("Today fixture A should read as v2 and fixture B as v1. Enter the v1 hash for A to see drift."),
    ),
    h(
      "section",
      { class: "block", "aria-labelledby": "lim-h" },
      h("h2", { id: "lim-h" }, "What this does not establish"),
      h("ul", {}, h("li", {}, "It compares one hash. It does not tell you what an audit reviewed or covered."), h("li", {}, "An empty or failed read is unavailable. An archived, expired or never deployed instance cannot be told apart."), h("li", {}, "A match is a hash comparison, not a security rating."), h("li", {}, "For audit scope, manifests and mainnet, use the ", link("/docs", "CLI"), ".")),
    ),
  );
}
