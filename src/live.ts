import { Address, xdr } from "@stellar/stellar-sdk/base";

import { TESTNET_RPC } from "./site.ts";

export const REQUEST_TIMEOUT_MS = 15_000;

export type LiveRead =
  | { kind: "wasm"; wasmHash: string }
  | { kind: "stellar_asset" }
  | { kind: "other_executable"; detail: string }
  | { kind: "unavailable"; reason: string };

export interface ContractRead {
  contractId: string;
  read: LiveRead;
  /** Latest ledger reported by the RPC in the same response, or null when the read failed. */
  latestLedger: number | null;
}

export type Outcome = "match" | "drift" | "read" | "incomplete" | "unavailable";

const HASH_RE = /^[0-9a-f]{64}$/;
const CONTRACT_RE = /^C[A-Z2-7]{55}$/;

export function isContractId(value: string): boolean {
  if (!CONTRACT_RE.test(value)) return false;
  try {
    new Address(value).toScAddress();
    return true;
  } catch {
    return false;
  }
}

export function isWasmHash(value: string): boolean {
  return HASH_RE.test(value);
}

function hex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function reason(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  return msg.replace(/https?:\/\/\S+/g, "<url>").slice(0, 200);
}

function instanceKeyXdr(contractId: string): string {
  const key = xdr.LedgerKey.contractData(
    new xdr.LedgerKeyContractData({
      contract: new Address(contractId).toScAddress(),
      key: xdr.ScVal.scvLedgerKeyContractInstance(),
      durability: xdr.ContractDataDurability.persistent,
    }),
  );
  return key.toXDR("base64");
}

/** Same classification as contractatlas-core's observationFromEntry. */
export function readFromEntryXdr(entryXdr: string): LiveRead {
  let data: xdr.LedgerEntryData;
  try {
    data = xdr.LedgerEntryData.fromXDR(entryXdr, "base64");
  } catch (e) {
    return { kind: "unavailable", reason: `could not decode the ledger entry: ${reason(e)}` };
  }
  const type = data.type;
  if (type !== "contractData") return { kind: "unavailable", reason: `expected a contractData entry, got ${type}` };
  const val = data.contractData.val;
  const valType = val.type;
  if (valType !== "scvContractInstance") return { kind: "unavailable", reason: `expected a contract instance value, got ${valType}` };
  const executable = val.instance.executable;
  const execType = executable.type;
  switch (execType) {
    case "contractExecutableWasm":
      return { kind: "wasm", wasmHash: hex(executable.wasmHash.toBytes()) };
    case "contractExecutableStellarAsset":
      return { kind: "stellar_asset" };
    default:
      return { kind: "other_executable", detail: execType };
  }
}

/**
 * Read one contract instance with Soroban RPC getLedgerEntries. Never throws:
 * every failure, including an empty result, becomes `unavailable` with a reason.
 */
export async function readContract(contractId: string, timeoutMs = REQUEST_TIMEOUT_MS): Promise<ContractRead> {
  const fail = (why: string): ContractRead => ({ contractId, read: { kind: "unavailable", reason: why }, latestLedger: null });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(TESTNET_RPC, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getLedgerEntries", params: { keys: [instanceKeyXdr(contractId)] } }),
      credentials: "omit",
      referrerPolicy: "no-referrer",
      cache: "no-store",
      signal: controller.signal,
    });
    if (!res.ok) return fail(`the RPC answered HTTP ${res.status}`);
    const body = (await res.json()) as {
      result?: { latestLedger?: number; entries?: Array<{ xdr?: string }> | null };
      error?: { message?: string };
    };
    if (body.error) return fail(`the RPC returned an error: ${String(body.error.message ?? "unknown").slice(0, 160)}`);
    const result = body.result;
    if (!result) return fail("the RPC response had no result");
    const latestLedger = typeof result.latestLedger === "number" ? result.latestLedger : null;
    const entry = result.entries?.[0];
    if (!entry || typeof entry.xdr !== "string") {
      return { contractId, read: { kind: "unavailable", reason: "no live ledger entry for this contract instance (archived, expired or never deployed: not distinguishable)" }, latestLedger };
    }
    return { contractId, read: readFromEntryXdr(entry.xdr), latestLedger };
  } catch (e) {
    const aborted = e instanceof DOMException && e.name === "AbortError";
    return fail(aborted ? `no answer within ${Math.round(timeoutMs / 1000)} seconds` : `the request failed: ${reason(e)}`);
  } finally {
    clearTimeout(timer);
  }
}

/** A failed read is never drift. Drift needs a successfully read WASM hash and an expected hash. */
export function outcomeFor(read: LiveRead, expected: string | null): Outcome {
  if (read.kind === "unavailable") return "unavailable";
  if (read.kind !== "wasm") return expected ? "incomplete" : "read";
  if (!expected) return "read";
  return read.wasmHash === expected.toLowerCase() ? "match" : "drift";
}
