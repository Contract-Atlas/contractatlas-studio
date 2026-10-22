import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { renderRegistry } from "../src/pages/registry.ts";
import { validateReport } from "../src/validate.ts";

describe("recorded deployment registry", () => {
  it("keeps downloads outside the SPA rewrite while serving the registry page through it", () => {
    const config = JSON.parse(readFileSync("vercel.json", "utf8"));
    const rewrite = new RegExp(`^${config.rewrites[0].source}$`);
    expect(rewrite.test("/registry")).toBe(true);
    for (const path of ["/registry/index.json", "/registry/manifests/blend-v2-1.json", "/registry/reports/soroswap.json"]) {
      expect(rewrite.test(path)).toBe(false);
      expect(readFileSync(`public${path}`, "utf8").length).toBeGreaterThan(0);
    }
  });
  it("validates reports and binds each to the corresponding published manifest IDs", () => {
    const index = JSON.parse(readFileSync("public/registry/index.json", "utf8"));
    let contracts = 0;
    for (const entry of index.entries) {
      const manifest = JSON.parse(readFileSync(`public/registry/${entry.manifest}`, "utf8"));
      const raw = JSON.parse(readFileSync(`public/registry/${entry.report}`, "utf8"));
      const result = validateReport(raw);
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error(result.error);
      expect(result.report.contracts.map((c) => c.id)).toEqual(manifest.contracts.map((c: { id: string }) => c.id));
      expect(result.report.manifest.network).toEqual(manifest.network);
      expect(result.report.overall).toBe("unavailable");
      expect(result.report.contracts.every((c) => c.live.kind === "unavailable")).toBe(true);
      contracts += manifest.contracts.length;
    }
    expect(contracts).toBe(8);
  });

  it("makes no network requests and labels failed observations without claiming drift", () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    try {
      const page = renderRegistry();
      expect(fetch).not.toHaveBeenCalled();
      expect(page.textContent).toContain("could not reach RPC");
      expect(page.textContent?.match(/Recorded result: UNAVAILABLE/g)).toHaveLength(3);
      expect(page.querySelectorAll("a[download]")).toHaveLength(6);
      expect(page.querySelectorAll("[style]")).toHaveLength(0);
    } finally { vi.unstubAllGlobals(); }
  });
});
