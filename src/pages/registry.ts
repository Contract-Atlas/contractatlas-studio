import index from "../../public/registry/index.json";
import blend from "../../public/registry/reports/blend-v2-1.json";
import soroswap from "../../public/registry/reports/soroswap.json";
import reflector from "../../public/registry/reports/reflector.json";
import { h } from "../dom.ts";
import { validateReport } from "../validate.ts";
import { ext, link } from "../ui.ts";
import { p, prose, section } from "./common.ts";

const reports: Record<string, unknown> = { "blend-v2-1": blend, soroswap, reflector };

export function renderRegistry(): HTMLElement {
  return prose(
    "Public deployment registry",
    "Eight contract addresses transcribed from official sources, with recorded checker observations from mainnet. These manifests have not been reviewed by protocol maintainers.",
    p("The live reads worked on 22 October 2026. Every contract is incomplete because these sources provide no audit-to-WASM mapping, so no result can be a match. Incomplete is not drift and not a defect in the protocol."),
    ...index.entries.map((entry) => {
      const result = validateReport(reports[entry.slug]);
      if (!result.ok) return section(entry.slug, entry.slug, p("The bundled report failed validation. Do not treat it as an observation."));
      const report = result.report;
      return section(
        entry.slug, report.manifest.protocol,
        p("Recorded result: ", h("strong", {}, report.overall.toUpperCase()), ". Network: ", report.manifest.network.name, ". Recorded at ", report.observedAt, "."),
        p(`${report.contracts.length} contracts. ${report.summary.match} match, ${report.summary.drift} drift, ${report.summary.incomplete} incomplete, ${report.summary.unavailable} unavailable.`),
        h("ul", {}, ...report.contracts.map((contract) => h("li", {}, contract.name, ": ", h("code", { class: "registry-id" }, contract.id), ` — ${contract.status}`))),
        h("p", {}, "Official source: ", ...entry.sources.map((source) => ext(source, new URL(source).hostname))),
        p("Sources retrieved ", entry.retrievedOn, ". Published hashes, where provided, are declarations; they are not audit references."),
        p(link(`/registry/${entry.manifest}`, "Manifest JSON", { download: `${entry.slug}.manifest.json` }), " · ", link(`/registry/${entry.report}`, "Recorded report JSON", { download: `${entry.slug}.report.json` })),
      );
    }),
    section("next", "Record another observation", p("Use the ", ext("https://github.com/Contract-Atlas/contractatlas-core/tree/main/registry", "core registry instructions"), " with an RPC endpoint you can reach. The CI Action fails on drift, incomplete evidence and unavailable reads by default. Download the report artifact, then load it in ", link("/app", "the report viewer"), ". No RPC request is made from this registry page.")),
  );
}
