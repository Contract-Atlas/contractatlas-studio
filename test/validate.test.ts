import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseReportText, TESTED_CORE, validateReport } from "../src/validate.ts";

const load = (f: string) => JSON.parse(readFileSync(`vendor/contractatlas-core/reports/${f}`, "utf8"));

describe("report validation", () => {
  it("accepts both vendored real reports with no pairing note", () => {
    for (const f of ["01-before-upgrade.json", "02-after-upgrade.json"]) {
      const r = validateReport(load(f));
      expect(r.ok, f).toBe(true);
      if (r.ok) expect(r.notes).toEqual([]);
    }
  });

  it("reports the tested core pairing", () => {
    expect(TESTED_CORE.reportVersion).toBe("1");
    expect(TESTED_CORE.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("refuses an unknown report version rather than guessing", () => {
    const r = validateReport({ ...load("01-before-upgrade.json"), reportVersion: "2" });
    expect(r).toMatchObject({ ok: false });
    if (!r.ok) expect(r.error).toMatch(/Unsupported report version "2"/);
  });

  it("rejects extra fields such as a safety score (strict schema)", () => {
    const r = validateReport({ ...load("01-before-upgrade.json"), safetyScore: 99 });
    expect(r.ok).toBe(false);
  });

  it("rejects a malformed wasm hash", () => {
    const rep = load("01-before-upgrade.json");
    rep.contracts[0].live.wasmHash = "XYZ";
    expect(validateReport(rep).ok).toBe(false);
  });

  it("rejects summary counts that disagree with contract statuses", () => {
    const rep = load("01-before-upgrade.json");
    rep.summary.match = 5;
    const r = validateReport(rep);
    expect(r).toMatchObject({ ok: false });
    if (!r.ok) expect(r.error).toMatch(/summary counts/);
  });

  it("notes a different producing tool version but still shows the report", () => {
    const rep = load("01-before-upgrade.json");
    rep.tool.version = "9.9.9";
    const r = validateReport(rep);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.notes[0]).toMatch(/9\.9\.9/);
  });

  it("rejects non-JSON and oversized input with readable errors", () => {
    expect(parseReportText("{nope")).toMatchObject({ ok: false });
    expect(parseReportText(" ".repeat(5_000_001))).toMatchObject({ ok: false });
  });
});
