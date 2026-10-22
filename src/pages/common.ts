import { h } from "../dom.ts";

type Child = Node | string | null | undefined | false;

export function section(id: string, title: string, ...children: Child[]): HTMLElement {
  return h("section", { class: "block", "aria-labelledby": id }, h("h2", { id }, title), ...children);
}

export function p(...children: Child[]): HTMLElement {
  return h("p", {}, ...children);
}

export function prose(title: string, lead: string, ...children: Child[]): HTMLElement {
  return h("article", { class: "prose" }, h("h1", {}, title), h("p", { class: "lead" }, lead), ...children);
}
