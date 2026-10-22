import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

async function boot(path: string) {
  document.head.innerHTML = '<meta name="description" content="">';
  document.body.innerHTML = '<div id="root"></div>';
  window.history.replaceState({}, "", path);
  vi.resetModules();
  window.scrollTo = vi.fn() as never;
  await import("../src/main.ts");
}

describe("router", () => {
  const cases: Array<[string, string, string]> = [
    ["/", "ContractAtlas", "ContractAtlas"],
    ["/app", "Report viewer", "Report viewer · ContractAtlas"],
    ["/check", "Live check (testnet)", "Live check · ContractAtlas"],
    ["/docs", "Getting started", "Docs · ContractAtlas"],
    ["/about", "About ContractAtlas", "About · ContractAtlas"],
    ["/privacy", "Privacy policy", "Privacy · ContractAtlas"],
    ["/terms", "Terms of use", "Terms · ContractAtlas"],
  ];
  it.each(cases)("%s renders its h1 and title", async (path, h1, title) => {
    await boot(path);
    expect(document.querySelector("main h1")?.textContent).toBe(h1);
    expect(document.title).toContain(title);
    expect(document.querySelector('meta[name="description"]')?.getAttribute("content")?.length).toBeGreaterThan(20);
    expect(document.querySelector(`a[aria-current="page"]`)?.getAttribute("href") ?? null).toBe(path === "/privacy" || path === "/terms" ? null : path);
  });

  it("renders the 404 page for unknown paths", async () => {
    await boot("/nope");
    expect(document.querySelector("main h1")?.textContent).toBe("Page not found");
    expect(document.querySelector("main a[href='/app']")).not.toBeNull();
    expect(document.querySelector('a[aria-current="page"]')).toBeNull();
  });

  it("navigates on internal link clicks without reloading, and moves focus to the h1", async () => {
    await boot("/");
    const marker = document.getElementById("root");
    const a = document.querySelector<HTMLAnchorElement>('header a[href="/docs"]')!;
    const ev = new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 });
    a.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(true);
    expect(location.pathname).toBe("/docs");
    expect(document.getElementById("root")).toBe(marker);
    expect(document.querySelector("main h1")?.textContent).toBe("Getting started");
    expect(document.activeElement).toBe(document.querySelector("main h1"));
    expect(document.querySelector('a[aria-current="page"]')?.getAttribute("href")).toBe("/docs");
    window.history.back();
  });

  it("does not intercept external links", async () => {
    await boot("/");
    const a = document.querySelector<HTMLAnchorElement>('a[target="_blank"]')!;
    const ev = new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 });
    a.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(false);
  });
});

describe("shell", () => {
  it("has landmarks and a skip link, and the menu button toggles aria-expanded", async () => {
    await boot("/");
    expect(document.querySelector("header nav")).not.toBeNull();
    expect(document.querySelector("main#main")).not.toBeNull();
    expect(document.querySelector("footer")).not.toBeNull();
    const btn = document.querySelector<HTMLButtonElement>(".menu-btn")!;
    expect(btn.getAttribute("aria-expanded")).toBe("false");
    btn.click();
    expect(btn.getAttribute("aria-expanded")).toBe("true");
    btn.click();
    expect(btn.getAttribute("aria-expanded")).toBe("false");
    expect(document.querySelector("footer")?.textContent).toMatch(/MIT licensed/);
  });
});

describe("legal pages", () => {
  it.each(["/privacy", "/terms"])("%s carries the date", async (path) => {
    await boot(path);
    expect(document.querySelector("main")?.textContent).toContain("22 October 2026");
  });
});

describe("content security policy", () => {
  it("index.html and vercel.json carry the same policy, with only the testnet RPC added", () => {
    const html = readFileSync("index.html", "utf8");
    const meta = /http-equiv="Content-Security-Policy" content="([^"]+)"/.exec(html)![1];
    const vercel = JSON.parse(readFileSync("vercel.json", "utf8"));
    const header = vercel.headers[0].headers.find((x: { key: string }) => x.key === "Content-Security-Policy").value;
    expect(meta).toBe(header);
    expect(header).toContain("connect-src 'self' https://soroban-testnet.stellar.org;");
    expect(header).not.toMatch(/unsafe-/);
    expect(header.match(/https?:\/\/[^\s;]+/g)).toEqual(["https://soroban-testnet.stellar.org"]);
  });
});

beforeEach(() => vi.restoreAllMocks());
