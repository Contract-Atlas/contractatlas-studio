import "./style.css";
import before from "../vendor/contractatlas-core/reports/01-before-upgrade.json";
import after from "../vendor/contractatlas-core/reports/02-after-upgrade.json";
import pairing from "../vendor/contractatlas-core/VERSION.json";
import { h } from "./dom.ts";
import type { Report } from "./types.ts";
import { parseReportText, validateReport, type LoadResult } from "./validate.ts";
import { renderComparison, renderReport } from "./view.ts";

interface Loaded {
  report: Report;
  notes: string[];
  label: string;
  recorded: boolean;
}

const SAMPLES: Array<{ id: string; label: string; data: unknown }> = [
  { id: "before", label: "Recorded testnet run 1: before the upgrade", data: before },
  { id: "after", label: "Recorded testnet run 2: after the upgrade", data: after },
];

const state: { primary: Loaded | null; compare: Loaded | null; error: string | null } = { primary: null, compare: null, error: null };

function fromResult(r: LoadResult, label: string, recorded: boolean): Loaded | string {
  return r.ok ? { report: r.report, notes: r.notes, label, recorded } : r.error;
}

function render(): void {
  const root = document.getElementById("app")!;
  root.replaceChildren();

  const sampleSelect = h("select", { id: "sample", "aria-label": "Choose a recorded report" }, h("option", { value: "" }, "Choose a recorded report…"), ...SAMPLES.map((s) => h("option", { value: s.id }, s.label)));
  sampleSelect.addEventListener("change", () => {
    const s = SAMPLES.find((x) => x.id === sampleSelect.value);
    if (!s) return;
    const r = fromResult(validateReport(s.data), s.label, true);
    if (typeof r === "string") state.error = r;
    else {
      state.error = null;
      state.primary = r;
      state.compare = null;
    }
    render();
  });
  if (state.primary?.recorded) sampleSelect.value = SAMPLES.find((s) => s.label === state.primary!.label)?.id ?? "";

  const file = h("input", { id: "file", type: "file", accept: "application/json,.json", "aria-label": "Load a report JSON file" });
  file.addEventListener("change", async () => {
    const f = file.files?.[0];
    if (!f) return;
    const r = fromResult(parseReportText(await f.text()), f.name, false);
    if (typeof r === "string") state.error = r;
    else {
      state.error = null;
      state.primary = r;
      state.compare = null;
    }
    render();
  });

  const paste = h("textarea", { id: "paste", rows: "4", placeholder: "Or paste report JSON here", "aria-label": "Paste report JSON" });
  const pasteBtn = h("button", { type: "button" }, "Show pasted report");
  pasteBtn.addEventListener("click", () => {
    const r = fromResult(parseReportText(paste.value), "Pasted JSON", false);
    if (typeof r === "string") state.error = r;
    else {
      state.error = null;
      state.primary = r;
      state.compare = null;
    }
    render();
  });

  root.append(
    h("header", { class: "site" }, h("h1", {}, "ContractAtlas"), h("p", { class: "tag" }, "Does the code live on chain still match the audit scope a project published?")),
    h(
      "section",
      { class: "controls", "aria-labelledby": "load-title" },
      h("h2", { id: "load-title", class: "visually-hidden" }, "Load a report"),
      h("label", { for: "sample" }, "Recorded reports"),
      sampleSelect,
      h("label", { for: "file" }, "Your report file"),
      file,
      h("label", { for: "paste" }, "Paste"),
      paste,
      pasteBtn,
      h("p", { class: "muted small" }, "Reports are produced locally by contractatlas-core. Files you load stay in your browser; nothing is uploaded."),
    ),
  );
  if (state.error) root.append(h("div", { class: "error", role: "alert" }, state.error));
  if (!state.primary && !state.error) {
    root.append(h("div", { class: "empty" }, h("p", {}, "Choose a recorded report to see a real testnet example, or load a report you generated with the CLI.")));
  }

  if (state.primary) {
    const p = state.primary;
    root.append(renderReport(p.report, { now: new Date(), sourceLabel: p.label, recorded: p.recorded, notes: p.notes }));
    const other = SAMPLES.find((s) => s.label !== p.label && p.recorded);
    if (other && p.recorded) {
      const btn = h("button", { type: "button", id: "compare" }, state.compare ? "Hide comparison" : `Compare with: ${other.label}`);
      btn.addEventListener("click", () => {
        if (state.compare) state.compare = null;
        else {
          const r = fromResult(validateReport(other.data), other.label, true);
          if (typeof r !== "string") state.compare = r;
        }
        render();
      });
      root.append(btn);
      if (state.compare) {
        const [a, b] = [p, state.compare].sort((x, y) => x.report.observedAt.localeCompare(y.report.observedAt));
        root.append(renderComparison(a!.report, b!.report));
      }
    }
  }

  root.append(
    h("footer", { class: "site" }, h("p", { class: "muted small" }, `Built against ${pairing.package} ${pairing.version} (report v${pairing.reportVersion}, commit ${pairing.commit.slice(0, 10)}). A match is a hash comparison, not a security rating, audit or endorsement.`)),
  );
}

render();
