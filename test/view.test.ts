import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import { diffReports } from "../src/diff.ts";
import type { Report } from "../src/types.ts";
import { validateReport } from "../src/validate.ts";
import { formatAge, renderComparison, renderReport } from "../src/view.ts";

const load = (f: string): Report => {
  const r = validateReport(JSON.parse(readFileSync(`vendor/contractatlas-core/reports/${f}`, "utf8")));
  if (!r.ok) throw new Error(r.error);
  return r.report;
};
const txt = (f: string) => readFileSync(`vendor/contractatlas-core/reports/${f}`, "utf8");
const NOW = new Date("2026-10-07T14:00:00.000Z");
const opts = { now: NOW, sourceLabel: "test", recorded: true, notes: [] as string[] };

beforeEach(() => {
  document.body.replaceChildren();
});

describe("renderReport", () => {
  it("shows the overall status, counts and per-contract status from the report", () => {
    const rep = load("02-after-upgrade.json");
    const el = renderReport(rep, opts);
    document.body.append(el);
    expect(el.querySelector("[data-overall]")?.getAttribute("data-overall")).toBe("drift");
    expect(el.querySelector('[data-count="drift"] strong')?.textContent).toBe("1");
    expect(el.querySelectorAll("article[data-contract-id]").length).toBe(2);
  });

  it("agrees with the CLI text output: same status and finding codes per contract", () => {
    for (const [json, text] of [
      ["01-before-upgrade.json", "01-before-upgrade.txt"],
      ["02-after-upgrade.json", "02-after-upgrade.txt"],
    ] as const) {
      const rep = load(json);
      const el = renderReport(rep, opts);
      const lines = txt(text).split("\n");
      const header = /^(MATCH|DRIFT|INCOMPLETE|UNAVAILABLE)\s+.+ (C[A-Z2-7]{55})$/;
      let seen = 0;
      lines.forEach((line, i) => {
        const m = header.exec(line);
        if (!m) return;
        seen += 1;
        const card = el.querySelector(`article[data-contract-id="${m[2]}"]`);
        expect(card, `${text} ${m[2]}`).not.toBeNull();
        expect(card!.getAttribute("data-status")).toBe(m[1]!.toLowerCase());
        // Every "[severity] code:" line the CLI printed for this contract appears as a finding here.
        for (let j = i + 1; j < lines.length && !header.test(lines[j]!); j++) {
          const f = /^\s+\[(info|warning|error)\] ([a-z_]+): /.exec(lines[j]!);
          if (f) expect(card!.querySelector(`li[data-code="${f[2]}"]`), `${text} ${f[2]}`).not.toBeNull();
        }
      });
      expect(seen).toBe(rep.contracts.length);
    }
  });

  it("labels recorded reports as not live", () => {
    const el = renderReport(load("01-before-upgrade.json"), opts);
    expect(el.textContent).toMatch(/recorded report from a real run/);
    const live = renderReport(load("01-before-upgrade.json"), { ...opts, recorded: false });
    expect(live.textContent).not.toMatch(/recorded report from a real run/);
  });

  it("flags observations older than 24 hours as stale", () => {
    const rep = load("01-before-upgrade.json");
    const fresh = renderReport(rep, { ...opts, now: new Date("2026-10-07T14:30:00.000Z") });
    expect(fresh.querySelector(".age.stale")).toBeNull();
    const old = renderReport(rep, { ...opts, now: new Date("2026-10-12T00:00:00.000Z") });
    expect(old.querySelector(".age.stale")?.textContent).toMatch(/more than 24 hours old/);
  });

  it("labels declared privileges as unverified", () => {
    const el = renderReport(load("01-before-upgrade.json"), opts);
    expect(el.textContent).toMatch(/Declared by the project \(not verified by ContractAtlas\)/);
  });

  it("states what the report does not establish", () => {
    const el = renderReport(load("01-before-upgrade.json"), opts);
    expect(el.textContent).toMatch(/not a security rating, audit or endorsement/);
  });

  it("renders untrusted strings as text, never as markup", () => {
    const rep = structuredClone(load("01-before-upgrade.json"));
    rep.contracts[0]!.name = '<img src=x onerror="window.__pwned=1">';
    rep.contracts[0]!.findings[0]!.message = "<script>window.__pwned=1</script>";
    const el = renderReport(rep, opts);
    document.body.append(el);
    expect(document.querySelector("img")).toBeNull();
    expect(document.querySelector("script")).toBeNull();
    expect((window as unknown as { __pwned?: number }).__pwned).toBeUndefined();
    expect(el.textContent).toContain('<img src=x onerror="window.__pwned=1">');
  });

  it("only makes https audit links clickable", () => {
    const rep = structuredClone(load("01-before-upgrade.json"));
    rep.contracts[0]!.audits[0]!.report = "javascript:alert(1)";
    rep.contracts[1]!.audits[0]!.report = "https://example.com/report.pdf";
    const el = renderReport(rep, opts);
    const hrefs = [...el.querySelectorAll("a")].map((a) => a.getAttribute("href"));
    expect(hrefs).toContain("https://example.com/report.pdf");
    expect(hrefs.some((h) => h?.startsWith("javascript:"))).toBe(false);
    expect(el.querySelector('a[rel="noopener noreferrer"]')).not.toBeNull();
  });

  it("shows a network mismatch as a refusal to compare, not as contract results", () => {
    const rep = structuredClone(load("01-before-upgrade.json"));
    rep.source.network = { status: "mismatch", expected: "A", observed: "B" };
    const el = renderReport(rep, opts);
    expect(el.textContent).toMatch(/MISMATCH: expected "A", RPC reports "B"\. No contracts were compared\./);
  });
});

describe("comparison", () => {
  it("shows fixture A changing from match to drift because the live code changed", () => {
    const before = load("01-before-upgrade.json");
    const after = load("02-after-upgrade.json");
    const changes = diffReports(before, after);
    const a = changes.find((c) => c.before?.status === "match")!;
    expect(a.after?.status).toBe("drift");
    expect(a.liveHashChanged).toBe(true);
    const b = changes.find((c) => c.before?.status === "incomplete")!;
    expect(b.statusChanged).toBe(false);
    expect(b.liveHashChanged).toBe(false);

    const el = renderComparison(before, after);
    expect(el.querySelectorAll('tr[data-changed="yes"]').length).toBe(1);
    expect(el.textContent).toMatch(/Live code changed: 42d30fff6b…[0-9a-f]{8} → 0224a0453c…[0-9a-f]{8}/);
  });
});

describe("formatAge", () => {
  it("handles minutes, hours, days and bad input", () => {
    expect(formatAge("2026-10-07T13:30:00.000Z", NOW)).toEqual({ text: "30 minutes ago", stale: false });
    expect(formatAge("2026-10-07T08:00:00.000Z", NOW)).toEqual({ text: "6 hours ago", stale: false });
    expect(formatAge("2026-10-01T14:00:00.000Z", NOW)).toEqual({ text: "6 days ago", stale: true });
    expect(formatAge("garbage", NOW).stale).toBe(true);
    expect(formatAge("2026-10-08T14:00:00.000Z", NOW).text).toMatch(/future/);
  });
});
