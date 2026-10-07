// Vendored shape of contractatlas-core report v1 (see vendor/contractatlas-core/VERSION.json for the pairing).
export type Status = "match" | "drift" | "incomplete" | "unavailable";

export interface Finding {
  code: string;
  severity: "info" | "warning" | "error";
  message: string;
  evidence?: Record<string, string | number | boolean | null>;
}

export type Live =
  | { kind: "wasm"; wasmHash: string }
  | { kind: "stellar_asset" }
  | { kind: "other_executable"; detail: string }
  | { kind: "not_live" }
  | { kind: "unavailable" };

export interface Audit {
  id: string;
  auditor: string;
  report: string;
  date: string;
  coversLiveArtifact: boolean;
  reviewedWasmHashes: string[];
  reviewedSourceCommit: string | null;
  limitations: string[];
}

export interface ContractResult {
  id: string;
  name: string;
  status: Status;
  live: Live;
  declared: { wasmHash: string | null; sourceCommit: string | null };
  audits: Audit[];
  declarations: {
    privileges: Array<{ role: string; holder: string; description: string | null }>;
    dependencies: Array<{ name: string; contractId: string | null; note: string | null }>;
    limitations: string[];
  };
  findings: Finding[];
}

export type NetworkCheck =
  | { status: "match"; expected: string; observed: string }
  | { status: "mismatch"; expected: string; observed: string }
  | { status: "unavailable"; expected: string; detail: string };

export interface Report {
  reportVersion: "1";
  tool: { name: string; version: string };
  observedAt: string;
  manifest: { schemaVersion: "1"; protocol: string; sha256: string; network: { name: string; passphrase: string } };
  source: { rpcOrigin: string | null; latestLedger: number | null; network: NetworkCheck };
  summary: Record<Status, number>;
  overall: Status;
  contracts: ContractResult[];
  limitations: string[];
}
