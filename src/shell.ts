import { h } from "./dom.ts";
import { ext, externalIcon, link, logoMark } from "./ui.ts";
import { LINKS, PROJECT, VERSION } from "./site.ts";

const NAV: Array<{ href: string; label: string }> = [
  { href: "/", label: "Product" },
  { href: "/app", label: "App" },
  { href: "/check", label: "Live check" },
  { href: "/registry", label: "Registry" },
  { href: "/docs", label: "Docs" },
  { href: "/about", label: "About" },
];

export interface Shell {
  main: HTMLElement;
  setCurrent: (path: string) => void;
}

export function buildShell(root: HTMLElement): Shell {
  const menuBtn = h("button", { type: "button", class: "menu-btn", "aria-expanded": "false", "aria-controls": "site-nav" }, "Menu");
  const navList = h("ul", { class: "nav-list" });
  for (const n of NAV) navList.append(h("li", {}, link(n.href, n.label, { "data-nav": n.href })));
  navList.append(h("li", {}, ext(LINKS.studio, "GitHub", { class: "nav-ext" })));
  navList.querySelector(".nav-ext")?.append(externalIcon());
  const nav = h("nav", { id: "site-nav", "aria-label": "Main", class: "site-nav" }, navList);

  const setOpen = (open: boolean) => {
    menuBtn.setAttribute("aria-expanded", String(open));
    nav.classList.toggle("open", open);
  };
  menuBtn.addEventListener("click", () => setOpen(menuBtn.getAttribute("aria-expanded") !== "true"));
  nav.addEventListener("click", (e) => {
    if ((e.target as Element).closest("a")) setOpen(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menuBtn.getAttribute("aria-expanded") === "true") {
      setOpen(false);
      menuBtn.focus();
    }
  });

  const header = h(
    "header",
    { class: "site-header" },
    h("div", { class: "bar" }, h("a", { href: "/", class: "brand" }, logoMark(28), h("span", {}, PROJECT)), menuBtn, nav),
  );

  const col = (title: string, items: Node[]) =>
    h("div", { class: "foot-col" }, h("h2", {}, title), h("ul", {}, ...items.map((i) => h("li", {}, i))));
  const footer = h(
    "footer",
    { class: "site-footer" },
    h(
      "div",
      { class: "foot-grid" },
      col("Product", [link("/app", "App"), link("/check", "Live check"), link("/registry", "Registry"), link("/docs", "Docs"), link("/about", "About")]),
      col("Open source", [
        ext(LINKS.core, "Core repository"),
        ext(LINKS.studio, "App repository"),
        ext(LINKS.studioIssues, "Issues"),
        ext(LINKS.discussions, "Discussions"),
        ext(LINKS.npm, "Package on npm"),
      ]),
      col("Documentation", [ext(LINKS.coreDocs, "Core docs (GitBook)"), ext(LINKS.studioDocs, "App docs (GitBook)")]),
      col("Legal", [link("/privacy", "Privacy"), link("/terms", "Terms"), ext(LINKS.license, "MIT License")]),
    ),
    h("p", { class: "foot-line" }, `MIT licensed · ${PROJECT} app v${VERSION} · Built for the Stellar network`),
  );

  const main = h("main", { id: "main", class: "page" });
  root.replaceChildren(header, main, footer);

  return {
    main,
    setCurrent(path: string) {
      for (const a of nav.querySelectorAll<HTMLAnchorElement>("a[data-nav]")) {
        if (a.dataset.nav === path) a.setAttribute("aria-current", "page");
        else a.removeAttribute("aria-current");
      }
      setOpen(false);
    },
  };
}
