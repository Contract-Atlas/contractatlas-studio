import { diffReports } from "./diff.ts";
import { h, safeHttpsUrl } from "./dom.ts";
import type { Audit, ContractResult, Finding, Live, Report, Status } from "./types.ts";

export const STATUS_LABEL: Record<Status, string> = {
  match: "Match",
  drift: "Drift",
  incomplete: "Incomplete",
  unavailable: "Unavailable",
};

export const STATUS_MEANING: Record<Status, string> = {
  match: "The live WASM hash equals the declared hash, and an audit reference lists that hash as reviewed.",
  drift: "The live code differs from what the manifest declares, or no referenced audit lists it.",
  incomplete: "There is not enough evidence to compare: no declared hash, no audit, a source-only audit, or a non-WASM executable.",
  unavailable: "The ledger could not be read, or the contract instance is not a live ledger entry. This is not evidence of a mismatch.",
};

export const STALE_AFTER_HOURS = 24;

export interface ViewOptions {
  now: Date;
  /** Where the report came from, e.g. "Recorded sample" or the uploaded file name. */
  sourceLabel: string;
  /** True for bundled recorded runs: they are not live observations. */
  recorded: boolean;
  notes: string[];
}

export function formatAge(observedAt: string, now: Date): { text: string; stale: boolean } {
  const ms = now.getTime() - new Date(observedAt).getTime();
  if (!Number.isFinite(ms)) return { text: "unknown age", stale: true };
  if (ms < 0) return { text: "observed in the future (clock skew?)", stale: true };
  const hours = ms / 3_600_000;
  const text =
    hours < 1 ? `${Math.max(1, Math.round(ms / 60_000))} minutes ago` : hours < 48 ? `${Math.round(hours)} hours ago` : `${Math.round(hours / 24)} days ago`;
  return { text, stale: hours > STALE_AFTER_HOURS };
}

export function shortHash(hash: string): string {
  return `${hash.slice(0, 10)}…${hash.slice(-8)}`;
}

function badge(status: Status): HTMLElement {
  return h("span", { class: `badge badge-${status}`, title: STATUS_MEANING[status] }, STATUS_LABEL[status]);
}

function hashCode(hash: string | null): HTMLElement {
  return hash === null ? h("span", { class: "muted" }, "none declared") : h("code", { class: "hash", title: hash }, hash);
}

function liveDescription(live: Live): HTMLElement {
  switch (live.kind) {
    case "wasm":
      return hashCode(live.wasmHash);
    case "stellar_asset":
      return h("span", {}, "Stellar Asset Contract (no WASM to compare)");
    case "other_executable":
      return h("span", {}, `Non-WASM executable (${live.detail})`);
    case "not_live":
      return h("span", {}, "No live instance entry (archived, expired or never deployed: not distinguishable)");
    case "unavailable":
      return h("span", {}, "Not read from the ledger");
  }
}

function findingItem(f: Finding): HTMLElement {
  return h(
    "li",
    { class: `finding finding-${f.severity}`, "data-code": f.code },
    h("span", { class: "finding-code" }, f.code),
    h("span", { class: "finding-sev" }, ` ${f.severity}: `),
    f.message,
  );
}

function auditItem(a: Audit): HTMLElement {
  const href = safeHttpsUrl(a.report);
  const title = `${a.id}, ${a.auditor}, ${a.date}`;
  return h(
    "li",
    { class: "audit" },
    href ? h("a", { href, rel: "noopener noreferrer", target: "_blank" }, title) : h("span", {}, title),
    " ",
    h(
      "span",
      { class: a.coversLiveArtifact ? "covers yes" : "covers no" },
      a.coversLiveArtifact ? "lists the live artifact" : "does not list the live artifact",
    ),
    a.reviewedSourceCommit && h("div", { class: "muted" }, `Reviewed source commit ${a.reviewedSourceCommit.slice(0, 12)} (source only; not mapped to an artifact)`),
    a.limitations.length > 0 && h("ul", { class: "plain" }, ...a.limitations.map((l) => h("li", { class: "muted" }, `Limitation stated: ${l}`))),
  );
}

function contractCard(c: ContractResult): HTMLElement {
  const declared = c.declarations;
  return h(
    "article",
    { class: `card card-${c.status}`, "data-contract-id": c.id, "data-status": c.status },
    h("header", { class: "card-head" }, h("h3", {}, c.name), badge(c.status)),
    h("p", { class: "mono-line" }, h("code", {}, c.id)),
    h(
      "dl",
      { class: "facts" },
      h("dt", {}, "Live WASM hash"),
      h("dd", {}, liveDescription(c.live)),
      h("dt", {}, "Declared WASM hash"),
      h("dd", {}, hashCode(c.declared.wasmHash)),
    ),
    c.findings.length > 0 && h("div", {}, h("h4", {}, "Findings"), h("ul", { class: "plain" }, ...c.findings.map(findingItem))),
    h(
      "div",
      {},
      h("h4", {}, "Audit references"),
      c.audits.length === 0 ? h("p", { class: "muted" }, "None referenced in the manifest.") : h("ul", { class: "plain" }, ...c.audits.map(auditItem)),
    ),
    (declared.privileges.length > 0 || declared.dependencies.length > 0 || declared.limitations.length > 0) &&
      h(
        "details",
        { class: "declared" },
        h("summary", {}, "Declared by the project (not verified by ContractAtlas)"),
        declared.privileges.length > 0 &&
          h("ul", { class: "plain" }, ...declared.privileges.map((p) => h("li", {}, `${p.role}: `, h("code", {}, p.holder), p.description ? ` (${p.description})` : ""))),
        declared.dependencies.length > 0 &&
          h("ul", { class: "plain" }, ...declared.dependencies.map((d) => h("li", {}, `Depends on ${d.name}${d.contractId ? ` (${d.contractId})` : ""}${d.note ? `: ${d.note}` : ""}`))),
        declared.limitations.length > 0 && h("ul", { class: "plain" }, ...declared.limitations.map((l) => h("li", {}, `Limitation declared: ${l}`))),
      ),
  );
}

export function renderReport(report: Report, opts: ViewOptions): HTMLElement {
  const age = formatAge(report.observedAt, opts.now);
  const net = report.source.network;
  const counts = (["match", "drift", "incomplete", "unavailable"] as const).map((s) =>
    h("li", { class: `count count-${s}`, "data-count": s }, h("strong", {}, String(report.summary[s])), ` ${STATUS_LABEL[s].toLowerCase()}`),
  );
  return h(
    "section",
    { class: "report", "aria-labelledby": "report-title" },
    opts.notes.length > 0 && h("div", { class: "notice", role: "note" }, ...opts.notes.map((n) => h("p", {}, n))),
    h(
      "header",
      { class: "summary" },
      h("h2", { id: "report-title" }, `${report.manifest.protocol} on ${report.manifest.network.name}`),
      h("p", { class: `overall overall-${report.overall}`, "data-overall": report.overall }, "Overall: ", badge(report.overall)),
      h("ul", { class: "counts plain" }, ...counts),
      h(
        "p",
        { class: age.stale ? "age stale" : "age" },
        `Observed ${report.observedAt} (${age.text}).`,
        age.stale && ` This observation is more than ${STALE_AFTER_HOURS} hours old; it may not describe the chain today.`,
      ),
      opts.recorded && h("p", { class: "recorded" }, "This is a recorded report from a real run, bundled with the studio. It is not a live check."),
    ),
    h(
      "section",
      { class: "provenance", "aria-labelledby": "prov-title" },
      h("h3", { id: "prov-title" }, "Provenance"),
      h(
        "dl",
        { class: "facts" },
        h("dt", {}, "Source of this report"),
        h("dd", {}, opts.sourceLabel),
        h("dt", {}, "Produced by"),
        h("dd", {}, `${report.tool.name} ${report.tool.version}`),
        h("dt", {}, "RPC origin"),
        h("dd", {}, report.source.rpcOrigin ?? "none (offline source)"),
        h("dt", {}, "Latest ledger at observation"),
        h("dd", {}, report.source.latestLedger === null ? "not recorded" : String(report.source.latestLedger)),
        h("dt", {}, "Network identity check"),
        h("dd", {}, net.status === "match" ? `match (${report.manifest.network.passphrase})` : net.status === "mismatch" ? `MISMATCH: expected "${net.expected}", RPC reports "${net.observed}". No contracts were compared.` : `unavailable: ${net.detail}. No contracts were compared.`),
        h("dt", {}, "Manifest SHA-256"),
        h("dd", {}, h("code", { class: "hash" }, report.manifest.sha256)),
      ),
    ),
    h("section", { "aria-labelledby": "contracts-title" }, h("h3", { id: "contracts-title" }, `Contracts (${report.contracts.length})`), ...report.contracts.map(contractCard)),
    h(
      "section",
      { class: "limits", "aria-labelledby": "limits-title" },
      h("h3", { id: "limits-title" }, "What this report does not establish"),
      h("ul", {}, ...report.limitations.map((l) => h("li", {}, l))),
    ),
  );
}

export function renderComparison(before: Report, after: Report): HTMLElement {
  const rows = diffReports(before, after).map((c) =>
    h(
      "tr",
      { "data-contract-id": c.id, "data-changed": c.statusChanged || c.liveHashChanged ? "yes" : "no" },
      h("th", { scope: "row" }, c.name, h("div", { class: "muted mono-small" }, c.id)),
      h("td", {}, c.before ? badge(c.before.status) : "not in this report"),
      h("td", {}, c.after ? badge(c.after.status) : "not in this report"),
      h(
        "td",
        {},
        c.liveHashChanged
          ? `Live code changed: ${(c.before?.live.kind === "wasm" ? shortHash(c.before.live.wasmHash) : "n/a")} → ${(c.after?.live.kind === "wasm" ? shortHash(c.after.live.wasmHash) : "n/a")}`
          : c.statusChanged
            ? "Status changed with the same live code (the manifest or evidence differs)"
            : "No change",
      ),
    ),
  );
  return h(
    "section",
    { class: "comparison", "aria-labelledby": "cmp-title" },
    h("h3", { id: "cmp-title" }, "Change between two reports"),
    h("p", { class: "muted" }, `Earlier: ${before.observedAt} (ledger ${before.source.latestLedger ?? "n/a"}). Later: ${after.observedAt} (ledger ${after.source.latestLedger ?? "n/a"}).`),
    before.manifest.sha256 !== after.manifest.sha256 && h("p", { class: "notice" }, "The two reports were produced from different manifests."),
    h("div", { class: "table-wrap" }, h("table", {}, h("thead", {}, h("tr", {}, h("th", { scope: "col" }, "Contract"), h("th", { scope: "col" }, "Earlier"), h("th", { scope: "col" }, "Later"), h("th", { scope: "col" }, "What changed"))), h("tbody", {}, ...rows))),
  );
}
