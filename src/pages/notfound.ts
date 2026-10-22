import { h } from "../dom.ts";
import { btnLink } from "../ui.ts";
import { p } from "./common.ts";

export function renderNotFound(): HTMLElement {
  return h("article", { class: "prose" }, h("h1", {}, "Page not found"), p("There is no page at this address."), h("div", { class: "cta" }, btnLink("/", "Go home"), btnLink("/app", "Open the app", "secondary")));
}
