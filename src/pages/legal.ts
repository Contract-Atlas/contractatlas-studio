import { LINKS, TESTNET_RPC } from "../site.ts";
import { ext, link } from "../ui.ts";
import { p, prose, section } from "./common.ts";

export const LEGAL_DATE = "22 October 2026";

export function renderPrivacy(): HTMLElement {
  return prose(
    "Privacy policy",
    `Last updated ${LEGAL_DATE}.`,
    section("who", "Who runs this", p("ContractAtlas is run by the maintainers named on the ", link("/about", "About page"), ". Contact them through ", ext(LINKS.studioIssues, "the repository's issues"), ". Security reports follow ", ext(LINKS.security, "SECURITY.md"), ".")),
    section("data", "What the app does with your data", p("Reports and text you load are processed in your browser. The app does not upload them. There are no accounts, no cookies, no analytics and no advertising. The app does not use localStorage or sessionStorage, and nothing is kept after you close the tab.")),
    section(
      "network",
      "Network requests",
      p("By default the app only requests its own files from its own origin."),
      p(`The Live check page has one opt-in feature. When you press "Read live code", your browser sends a Soroban RPC getLedgerEntries request to ${TESTNET_RPC}. It contains the contract ID you entered. Expected hashes you type are compared in your browser and are not sent. Nothing is sent until you press the button. The operator of that endpoint sees your IP address and the request under its own policies.`),
    ),
    section("hosting", "Hosting", p("The site is served by Vercel. Vercel may process standard request data such as IP address and user agent in server logs under ", ext(LINKS.vercelPrivacy, "its own privacy policy"), ".")),
    section("chain", "Public blockchain data", p("Anything read from Stellar is public ledger data.")),
    section("changes", "Changes", p("Changes to this policy are made through the public repository, and its history is the record.")),
  );
}

export function renderTerms(): HTMLElement {
  return prose(
    "Terms of use",
    `Last updated ${LEGAL_DATE}.`,
    section("license", "License", p("The software is open source under the MIT License. See ", ext(LINKS.license, "LICENSE"), ".")),
    section("warranty", "No warranty", p("It is provided as is, without warranty of any kind, as the license states.")),
    section("advice", "What it is and is not", p("ContractAtlas is an engineering and diagnostic tool. It is not financial, legal, investment, compliance or security advice. It is not an audit. Its results do not guarantee anything about a contract, anchor, payment or network.")),
    section("data", "Recorded and testnet data", p("Recorded and sample reports are labeled as such. Testnet results say nothing about mainnet.")),
    section("responsibility", "Your responsibility", p("You are responsible for what you load, and for following the terms of any network endpoint you choose to query.")),
    section("fees", "Accounts and fees", p("There are no accounts and no fees.")),
    section("contact", "Contact", p("Use ", ext(LINKS.studioIssues, "the GitHub repository"), ".")),
  );
}
