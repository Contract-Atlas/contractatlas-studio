import "./style.css";
import "./site.css";
import { createRouter, type Route } from "./router.ts";
import { buildShell } from "./shell.ts";
import { PROJECT } from "./site.ts";
import { renderAbout } from "./pages/about.ts";
import { renderApp } from "./pages/app.ts";
import { renderCheck } from "./pages/check.ts";
import { renderDocs } from "./pages/docs.ts";
import { renderLanding } from "./pages/landing.ts";
import { renderPrivacy, renderTerms } from "./pages/legal.ts";
import { renderNotFound } from "./pages/notfound.ts";
import { renderRegistry } from "./pages/registry.ts";

const routes: Route[] = [
  { path: "/", title: "Check that live code matches the audited code", description: "ContractAtlas checks that the code live on a Soroban network is the code an audit reviewed. Reports match, drift, incomplete or unavailable per contract.", render: renderLanding },
  { path: "/app", title: "Report viewer", description: "Load a ContractAtlas report and see each contract as match, drift, incomplete or unavailable, with the evidence behind it.", render: renderApp },
  { path: "/check", title: "Live check", description: "Read the executable WASM hash of Stellar testnet contracts from Soroban RPC and compare it with a hash you expect.", render: renderCheck },
  { path: "/registry", title: "Deployment registry", description: "Official-source contract manifests and recorded mainnet checker observations. Incomplete evidence is shown without claiming a match or drift.", render: renderRegistry },
  { path: "/docs", title: "Docs", description: "Run the ContractAtlas core locally, check a manifest and load the report into the app.", render: renderDocs },
  { path: "/about", title: "About", description: "What ContractAtlas is, why it exists, who maintains it and how to contribute.", render: renderAbout },
  { path: "/privacy", title: "Privacy", description: "What the ContractAtlas app does and does not do with your data.", render: renderPrivacy },
  { path: "/terms", title: "Terms", description: "Terms of use for the ContractAtlas app.", render: renderTerms },
];

const rootEl = document.getElementById("root")!;
const shell = buildShell(rootEl);
createRouter({
  outlet: shell.main,
  routes,
  notFound: { path: "*", title: "Page not found", description: "This page does not exist. Go to the ContractAtlas home page or the app.", render: renderNotFound },
  suffix: PROJECT,
  linkRoot: rootEl,
  onRender: (path) => shell.setCurrent(path),
}).render();
