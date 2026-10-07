import type { ContractResult, Report, Status } from "./types.ts";

export interface ContractChange {
  id: string;
  name: string;
  before: ContractResult | null;
  after: ContractResult | null;
  statusChanged: boolean;
  liveHashChanged: boolean;
}

function liveHash(c: ContractResult | null): string | null {
  return c !== null && c.live.kind === "wasm" ? c.live.wasmHash : null;
}

/** Contract-by-contract comparison of two reports, keyed by contract ID. */
export function diffReports(before: Report, after: Report): ContractChange[] {
  const ids = new Set<string>([...before.contracts.map((c) => c.id), ...after.contracts.map((c) => c.id)]);
  const find = (r: Report, id: string) => r.contracts.find((c) => c.id === id) ?? null;
  return [...ids].map((id) => {
    const b = find(before, id);
    const a = find(after, id);
    return {
      id,
      name: (a ?? b)!.name,
      before: b,
      after: a,
      statusChanged: (b?.status as Status | undefined) !== (a?.status as Status | undefined),
      liveHashChanged: liveHash(b) !== liveHash(a),
    };
  });
}
