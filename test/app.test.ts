import { beforeEach, describe, expect, it, vi } from "vitest";

async function boot() {
  document.body.innerHTML = '<main id="app"></main>';
  vi.resetModules();
  await import("../src/main.ts");
}

describe("report viewer app", () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it("starts with an empty state and no report", async () => {
    await boot();
    expect(document.querySelector(".empty")).not.toBeNull();
    expect(document.querySelector("article[data-contract-id]")).toBeNull();
  });

  it("shows the recorded after-upgrade run and offers a before/after comparison", async () => {
    await boot();
    const select = document.getElementById("sample") as HTMLSelectElement;
    select.value = "after";
    select.dispatchEvent(new Event("change"));
    expect(document.querySelector("[data-overall]")?.getAttribute("data-overall")).toBe("drift");
    (document.getElementById("compare") as HTMLButtonElement).click();
    expect(document.querySelector('tr[data-changed="yes"]')).not.toBeNull();
    (document.getElementById("compare") as HTMLButtonElement).click();
    expect(document.querySelector(".comparison")).toBeNull();
  });

  it("shows a readable error for invalid pasted JSON and keeps no stale report", async () => {
    await boot();
    (document.getElementById("paste") as HTMLTextAreaElement).value = "{not json";
    (document.querySelector(".controls button") as HTMLButtonElement).click();
    expect(document.querySelector('[role="alert"]')?.textContent).toMatch(/Not valid JSON/);
    expect(document.querySelector("article[data-contract-id]")).toBeNull();
  });

  it("renders a pasted valid report as not recorded", async () => {
    const fs = await import("node:fs");
    const json = fs.readFileSync("vendor/contractatlas-core/reports/01-before-upgrade.json", "utf8");
    await boot();
    (document.getElementById("paste") as HTMLTextAreaElement).value = json;
    (document.querySelector(".controls button") as HTMLButtonElement).click();
    expect(document.querySelectorAll("article[data-contract-id]").length).toBe(2);
    expect(document.body.textContent).not.toMatch(/recorded report from a real run/);
  });
});
