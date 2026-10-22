import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FIXTURES } from "../src/site.ts";

const A = FIXTURES.a;

// Build a real getLedgerEntries answer for a WASM instance, so decoding is exercised end to end.
async function instanceXdr(hashHex: string): Promise<string> {
  const { Address, xdr } = await import("@stellar/stellar-sdk/base");
  const data = xdr.LedgerEntryData.contractData(
    new xdr.ContractDataEntry({
      ext: xdr.ExtensionPoint.v0(),
      contract: new Address(A).toScAddress(),
      key: xdr.ScVal.scvLedgerKeyContractInstance(),
      durability: xdr.ContractDataDurability.persistent,
      val: xdr.ScVal.scvContractInstance(new xdr.ScContractInstance({ executable: xdr.ContractExecutable.contractExecutableWasm(hashHex), storage: null })),
    }),
  );
  return data.toXDR("base64");
}

const rpc = (result: unknown) => new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result }), { status: 200 });

async function boot() {
  document.head.innerHTML = '<meta name="description" content="">';
  document.body.innerHTML = '<div id="root"></div>';
  window.history.replaceState({}, "", "/check");
  window.scrollTo = vi.fn() as never;
  vi.resetModules();
  await import("../src/main.ts");
}
const submit = () => document.querySelector("form")!.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
const settle = () => vi.waitFor(() => expect(document.querySelector('[role="status"]')?.textContent).toMatch(/Done|Fix|Enter/));

describe("live check", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("makes no request until the button is pressed, and says which host it will contact", async () => {
    await boot();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(document.getElementById("network-notice")?.textContent).toContain("https://soroban-testnet.stellar.org");
    expect(document.getElementById("network-notice")?.textContent).toMatch(/mainnet are done with the CLI/);
  });

  it("prefills the two fixture contracts and requests only the testnet host", async () => {
    fetchMock.mockImplementation(async () => rpc({ latestLedger: 123, entries: [{ xdr: await instanceXdr(FIXTURES.v2) }] }));
    await boot();
    const ids = [...document.querySelectorAll<HTMLInputElement>(".cid")].map((i) => i.value);
    expect(ids).toEqual([FIXTURES.a, FIXTURES.b]);
    document.querySelector<HTMLInputElement>(".exp")!.value = FIXTURES.v1;
    submit();
    await settle();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    for (const call of fetchMock.mock.calls) {
      expect(call[0]).toBe("https://soroban-testnet.stellar.org");
      expect(JSON.parse(call[1].body).method).toBe("getLedgerEntries");
    }
    const cards = document.querySelectorAll("article[data-outcome]");
    expect(cards[0]?.getAttribute("data-outcome")).toBe("drift");
    expect(cards[1]?.getAttribute("data-outcome")).toBe("read");
    expect(document.body.textContent).toContain("123");
  });

  it("reports match when the live hash equals the expected hash", async () => {
    fetchMock.mockImplementation(async () => rpc({ latestLedger: 5, entries: [{ xdr: await instanceXdr(FIXTURES.v2) }] }));
    await boot();
    document.querySelector<HTMLInputElement>(".exp")!.value = FIXTURES.v2.toUpperCase();
    submit();
    await settle();
    expect(document.querySelector("article[data-outcome]")?.getAttribute("data-outcome")).toBe("match");
  });

  it("shows a network error as unavailable, never as drift or match", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    await boot();
    document.querySelectorAll<HTMLInputElement>(".exp").forEach((i) => (i.value = FIXTURES.v1));
    submit();
    await settle();
    const outcomes = [...document.querySelectorAll("article[data-outcome]")].map((c) => c.getAttribute("data-outcome"));
    expect(outcomes).toEqual(["unavailable", "unavailable"]);
    expect(document.querySelector('.error[role="alert"]')).not.toBeNull();
  });

  it("shows an empty result and an HTTP error as unavailable with a reason", async () => {
    fetchMock.mockResolvedValueOnce(rpc({ latestLedger: 9, entries: null })).mockResolvedValueOnce(new Response("nope", { status: 503 }));
    await boot();
    submit();
    await settle();
    const cards = [...document.querySelectorAll("article[data-outcome]")];
    expect(cards.map((c) => c.getAttribute("data-outcome"))).toEqual(["unavailable", "unavailable"]);
    expect(cards[0]?.textContent).toMatch(/no live ledger entry/);
    expect(cards[1]?.textContent).toMatch(/HTTP 503/);
  });

  it("rejects an invalid contract ID or hash without sending anything", async () => {
    await boot();
    document.querySelector<HTMLInputElement>(".cid")!.value = "not-a-contract";
    submit();
    await settle();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(document.querySelector(".field-error")?.textContent).toMatch(/valid contract ID/);
  });
});
