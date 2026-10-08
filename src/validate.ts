import validateSchema from "./generated/validateReport.js";
import pairing from "../vendor/contractatlas-core/VERSION.json";
import type { Report } from "./types.ts";

type SchemaError = { instancePath: string; message?: string };
const check = validateSchema as unknown as ((data: unknown) => boolean) & { errors?: SchemaError[] | null };

/** The core version this studio was built and tested against. */
export const TESTED_CORE = { name: pairing.package, version: pairing.version, reportVersion: pairing.reportVersion } as const;

export type LoadResult =
  | { ok: true; report: Report; notes: string[] }
  | { ok: false; error: string };

export function parseReportText(text: string): LoadResult {
  if (text.length > 5_000_000) return { ok: false, error: "File is larger than 5 MB; reports are far smaller than that." };
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (e) {
    return { ok: false, error: `Not valid JSON: ${e instanceof Error ? e.message : String(e)}` };
  }
  return validateReport(raw);
}

export function validateReport(raw: unknown): LoadResult {
  const version = (raw as { reportVersion?: unknown } | null)?.reportVersion;
  if (version !== TESTED_CORE.reportVersion) {
    return {
      ok: false,
      error: `Unsupported report version ${JSON.stringify(version)}. This studio reads report version ${TESTED_CORE.reportVersion} only.`,
    };
  }
  if (!check(raw)) {
    const issues = (check.errors ?? []).slice(0, 5).map((e) => `${e.instancePath || "(root)"} ${e.message ?? ""}`.trim());
    return { ok: false, error: `Report does not match the v1 report schema: ${issues.join("; ")}` };
  }
  const report = raw as unknown as Report;
  const notes: string[] = [];
  if (report.tool.version !== TESTED_CORE.version && !pairing.sampleReportsRecordedWith.includes(report.tool.version)) {
    notes.push(
      `This report was produced by ${report.tool.name} ${report.tool.version}; this studio was tested with ${TESTED_CORE.version}. The report matches the v1 schema, so it is shown, but newer tool behavior is not covered by this studio's tests.`,
    );
  }
  const counted = { match: 0, drift: 0, incomplete: 0, unavailable: 0 };
  for (const c of report.contracts) counted[c.status] += 1;
  if (JSON.stringify(counted) !== JSON.stringify({ match: report.summary.match, drift: report.summary.drift, incomplete: report.summary.incomplete, unavailable: report.summary.unavailable })) {
    return { ok: false, error: "Report summary counts do not agree with its contract statuses." };
  }
  const rank = { match: 0, incomplete: 1, unavailable: 2, drift: 3 } as const;
  const worst = report.contracts.reduce<keyof typeof rank>((w, c) => (rank[c.status] > rank[w] ? c.status : w), "match");
  if (report.overall !== worst) {
    return { ok: false, error: `Inconsistent report: its overall status is "${report.overall}" but its contract statuses give "${worst}".` };
  }
  return { ok: true, report, notes };
}
