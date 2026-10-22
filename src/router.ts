export interface Route {
  path: string;
  /** Page name; the document title becomes "<title> · ContractAtlas". */
  title: string;
  description: string;
  render: () => HTMLElement;
}

export interface RouterOptions {
  outlet: HTMLElement;
  routes: Route[];
  notFound: Route;
  suffix: string;
  /** Element whose subtree holds the links the router handles. */
  linkRoot: HTMLElement;
  /** Called after every render with the matched path ("*" for the 404 page). */
  onRender?: (path: string, route: Route) => void;
}

export function normalize(pathname: string): string {
  const p = pathname.replace(/\/+$/, "");
  return p === "" ? "/" : p;
}

function setDescription(text: string): void {
  let meta = document.head.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "description";
    document.head.append(meta);
  }
  meta.content = text;
}

export function createRouter(opts: RouterOptions) {
  const find = (path: string): Route | undefined => opts.routes.find((r) => r.path === path);

  function render(focus: boolean): void {
    const path = normalize(location.pathname);
    const route = find(path) ?? opts.notFound;
    document.title = route.path === "/" ? `${opts.suffix} · ${route.title}` : `${route.title} · ${opts.suffix}`;
    setDescription(route.description);
    const page = route.render();
    opts.outlet.replaceChildren(page);
    window.scrollTo(0, 0);
    if (focus) {
      const h1 = opts.outlet.querySelector<HTMLElement>("h1");
      if (h1) {
        h1.setAttribute("tabindex", "-1");
        h1.focus({ preventScroll: true });
      }
    }
    opts.onRender?.(find(path) ? path : "*", route);
  }

  function navigate(href: string): void {
    const url = new URL(href, location.origin);
    if (url.origin !== location.origin) return;
    const same = normalize(url.pathname) === normalize(location.pathname) && url.search === location.search;
    if (!same) history.pushState({}, "", url.pathname + url.search + url.hash);
    render(true);
    if (url.hash) document.getElementById(url.hash.slice(1))?.scrollIntoView();
  }

  function onClick(e: MouseEvent): void {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as Element | null)?.closest?.("a");
    if (!a || a.hasAttribute("download")) return;
    const target = a.getAttribute("target");
    if (target && target !== "_self") return;
    const href = a.getAttribute("href");
    if (!href || !href.startsWith("/") || href.startsWith("//")) return;
    e.preventDefault();
    navigate(href);
  }

  opts.linkRoot.addEventListener("click", onClick);
  window.addEventListener("popstate", () => render(true));
  return { render: () => render(false), navigate, dispose: () => opts.linkRoot.removeEventListener("click", onClick) };
}
