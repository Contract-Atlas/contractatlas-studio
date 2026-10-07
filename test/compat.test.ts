import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { TESTED_CORE } from "../src/validate.ts";

const compat = JSON.parse(readFileSync("compat.json", "utf8"));
const vendored = JSON.parse(readFileSync("vendor/contractatlas-core/VERSION.json", "utf8"));
const pkg = JSON.parse(readFileSync("package.json", "utf8"));

describe("core pairing", () => {
  it("compat.json lists exactly the vendored core version as tested", () => {
    expect(compat.studio).toBe(pkg.version);
    expect(compat.pairs).toContainEqual({ core: vendored.package, version: vendored.version, reportVersion: vendored.reportVersion, status: "tested" });
  });

  it("the studio's runtime pairing is the vendored one", () => {
    expect(TESTED_CORE).toEqual({ name: vendored.package, version: vendored.version, reportVersion: vendored.reportVersion });
  });

  it("vendored sample reports were produced by the vendored core version", () => {
    for (const f of ["01-before-upgrade.json", "02-after-upgrade.json"]) {
      const r = JSON.parse(readFileSync(`vendor/contractatlas-core/reports/${f}`, "utf8"));
      expect(r.tool.version).toBe(vendored.version);
    }
  });

  it("the checked-in generated validator is current with the vendored schema", () => {
    expect(() => execFileSync("node", ["scripts/gen-validator.mjs", "--check"], { stdio: "pipe" })).not.toThrow();
  });
});
