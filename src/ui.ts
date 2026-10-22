import { h } from "./dom.ts";

type Child = Node | string | null | undefined | false;

/** Internal link: the router intercepts clicks on any anchor whose href starts with "/". */
export function link(href: string, text: Child, attrs: Record<string, string | undefined> = {}): HTMLAnchorElement {
  return h("a", { href, ...attrs }, text);
}

export function ext(href: string, text: Child, attrs: Record<string, string | undefined> = {}): HTMLAnchorElement {
  return h("a", { href, target: "_blank", rel: "noopener noreferrer", ...attrs }, text);
}

export function btnLink(href: string, text: string, kind: "primary" | "secondary" = "primary"): HTMLAnchorElement {
  return h("a", { href, class: `btn btn-${kind}` }, text);
}

export function ul(items: Child[][], cls = ""): HTMLUListElement {
  return h("ul", { class: cls || undefined }, ...items.map((i) => h("li", {}, ...i)));
}

/** Code block with a copy button. Clipboard access is local; nothing is sent anywhere. */
export function codeBlock(text: string, label: string): HTMLElement {
  const btn = h("button", { type: "button", class: "btn-copy", "aria-label": `Copy ${label}` }, "Copy");
  btn.addEventListener("click", () => {
    const done = (msg: string) => {
      btn.textContent = msg;
      setTimeout(() => (btn.textContent = "Copy"), 1800);
    };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(() => done("Copied"), () => done("Copy failed"));
    else done("Copy failed");
  });
  return h("div", { class: "code" }, h("pre", { tabindex: "0" }, h("code", {}, text)), btn);
}

const SVG_NS = "http://www.w3.org/2000/svg";

/** The logo mark: a ring (the atlas) with a tick (the hashes agree). Same geometry as public/favicon.svg. */
export function logoMark(size = 28): SVGElement {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 32 32");
  svg.setAttribute("width", String(size));
  svg.setAttribute("height", String(size));
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  const rect = document.createElementNS(SVG_NS, "rect");
  for (const [k, v] of Object.entries({ width: "32", height: "32", rx: "7", fill: "#0f4c5c" })) rect.setAttribute(k, v);
  const ring = document.createElementNS(SVG_NS, "circle");
  for (const [k, v] of Object.entries({ cx: "16", cy: "16", r: "9", fill: "none", stroke: "#ffffff", "stroke-width": "2.5" })) ring.setAttribute(k, v);
  const tick = document.createElementNS(SVG_NS, "path");
  for (const [k, v] of Object.entries({ d: "M11.5 16.5l3 3 6-7", fill: "none", stroke: "#8fe0ea", "stroke-width": "2.5", "stroke-linecap": "round", "stroke-linejoin": "round" })) tick.setAttribute(k, v);
  svg.append(rect, ring, tick);
  return svg;
}

export function externalIcon(): SVGElement {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 16 16");
  svg.setAttribute("width", "12");
  svg.setAttribute("height", "12");
  svg.setAttribute("aria-hidden", "true");
  const p = document.createElementNS(SVG_NS, "path");
  for (const [k, v] of Object.entries({ d: "M6 3H3v10h10v-3M9 3h4v4M13 3L7 9", fill: "none", stroke: "currentColor", "stroke-width": "1.5", "stroke-linecap": "round" })) p.setAttribute(k, v);
  svg.append(p);
  return svg;
}
