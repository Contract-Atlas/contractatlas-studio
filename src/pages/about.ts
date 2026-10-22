import { h } from "../dom.ts";
import { LINKS, VERSION } from "../site.ts";
import { ext, link } from "../ui.ts";
import { p, prose, section } from "./common.ts";

export function renderAbout(): HTMLElement {
  return prose(
    "About ContractAtlas",
    "ContractAtlas compares what is live on a Soroban network with what a protocol declares in a manifest.",
    section(
      "why",
      "Why it exists",
      p("An audit describes one version of a contract. After an upgrade, the audit link can stay in place while the live code changes. ContractAtlas makes that gap visible, and says plainly when it cannot tell."),
    ),
    section(
      "fit",
      "How the core and the app fit together",
      p(ext(LINKS.core, "contractatlas-core"), " is the checker and CLI. It reads the ledger and produces a report. This app (", ext(LINKS.studio, "contractatlas-studio"), ") renders that report and compares two of them. The app computes no verdict from a report: every status comes from the report JSON."),
      p("The app is paired with a specific core version, recorded in compat.json. The Live check page is a separate, small read of testnet that reuses the core's way of reading a contract instance."),
    ),
    section(
      "maintainers",
      "Maintainers",
      h(
        "table",
        {},
        h("thead", {}, h("tr", {}, h("th", {}, "Maintainer"), h("th", {}, "Role"), h("th", {}, "GitHub"))),
        h(
          "tbody",
          {},
          h("tr", {}, h("td", {}, "Anas Abubakar"), h("td", {}, "Lead maintainer"), h("td", {}, ext("https://github.com/Anasabubakar", "@Anasabubakar"))),
          h("tr", {}, h("td", {}, "Abdulbasit Fazazi"), h("td", {}, "Co-maintainer"), h("td", {}, ext("https://github.com/fazaziishola-coder", "@fazaziishola-coder"))),
        ),
      ),
      p("No maintainer or integrator outside the project has reviewed this app yet."),
    ),
    section("license", "License", p("MIT. See ", ext(LINKS.license, "LICENSE"), ".")),
    section(
      "contribute",
      "How to contribute",
      p("Open issues are scoped so one person can finish one in a single cycle. Read ", ext(LINKS.contributing, "CONTRIBUTING.md"), ", pick from the ", ext(LINKS.studioIssues, "issue list"), " or the ", ext(LINKS.goodFirstIssue, "good first issues"), ", and say you are taking it. Questions go to ", ext(LINKS.discussions, "Discussions"), ". Security reports follow ", ext(LINKS.security, "SECURITY.md"), "."),
    ),
    section("release", "Current release", p(`App version ${VERSION}. See the `, ext(LINKS.changelog, "changelog"), "."), p("Try it: ", link("/app", "open the app"), ".")),
  );
}
