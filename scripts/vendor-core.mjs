// Copy the report schema and sample reports from a contractatlas-core checkout and stamp the pairing.
// Usage: node scripts/vendor-core.mjs ../contractatlas-core
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, resolve } from "node:path";

const coreDir = resolve(process.argv[2] ?? "../contractatlas-core");
const out = resolve("vendor/contractatlas-core");
mkdirSync(join(out, "reports"), { recursive: true });

const pkg = JSON.parse(readFileSync(join(coreDir, "package.json"), "utf8"));
const commit = execFileSync("git", ["-C", coreDir, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();

copyFileSync(join(coreDir, "schema/report.v1.schema.json"), join(out, "report.v1.schema.json"));
for (const f of ["01-before-upgrade.json", "02-after-upgrade.json"]) {
  copyFileSync(join(coreDir, "fixtures/testnet/reports", f), join(out, "reports", f));
}
copyFileSync(join(coreDir, "fixtures/testnet/reports/01-before-upgrade.txt"), join(out, "reports/01-before-upgrade.txt"));
copyFileSync(join(coreDir, "fixtures/testnet/reports/02-after-upgrade.txt"), join(out, "reports/02-after-upgrade.txt"));

writeFileSync(
  join(out, "VERSION.json"),
  JSON.stringify({ package: pkg.name, version: pkg.version, commit, reportVersion: "1", vendoredFor: "contractatlas-studio" }, null, 2) + "\n",
);
console.log(`vendored ${pkg.name}@${pkg.version} (${commit.slice(0, 12)})`);
