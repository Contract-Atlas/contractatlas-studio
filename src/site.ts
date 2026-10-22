import pkg from "../package.json";

export const PROJECT = "ContractAtlas";
export const VALUE = "Check that the code live on chain is the code an audit actually reviewed.";
export const VERSION: string = pkg.version;
export const PROD_URL = "https://contractatlas-studio-anasamasama.vercel.app";

export const LINKS = {
  core: "https://github.com/Contract-Atlas/contractatlas-core",
  studio: "https://github.com/Contract-Atlas/contractatlas-studio",
  coreIssues: "https://github.com/Contract-Atlas/contractatlas-core/issues",
  studioIssues: "https://github.com/Contract-Atlas/contractatlas-studio/issues",
  goodFirstIssue: "https://github.com/Contract-Atlas/contractatlas-studio/labels/good%20first%20issue",
  discussions: "https://github.com/Contract-Atlas/contractatlas-studio/discussions",
  contributing: "https://github.com/Contract-Atlas/contractatlas-studio/blob/main/CONTRIBUTING.md",
  security: "https://github.com/Contract-Atlas/contractatlas-studio/blob/main/SECURITY.md",
  license: "https://github.com/Contract-Atlas/contractatlas-studio/blob/main/LICENSE",
  changelog: "https://github.com/Contract-Atlas/contractatlas-studio/blob/main/CHANGELOG.md",
  coreSpec: "https://github.com/Contract-Atlas/contractatlas-core/blob/main/SPEC.md",
  deployment: "https://github.com/Contract-Atlas/contractatlas-core/blob/main/fixtures/testnet/DEPLOYMENT.md",
  coreDocs: "https://stellar-developer-tools.gitbook.io/contractatlas-core/",
  studioDocs: "https://stellar-developer-tools.gitbook.io/contractatlas-studio/",
  npm: "https://www.npmjs.com/package/@anas.abubakar/contractatlas-core",
  vercelPrivacy: "https://vercel.com/legal/privacy-policy",
} as const;

export const FIXTURES = {
  a: "CADRVGSPFVDYWRABKTEVETRVCKIADNF4XCQC73OIJPJQZOHG7EPIQ3BD",
  b: "CD2FBDVYS6TBDZNJPRUBVEY7TNCFJX36QJ6KQCUHXWG4IFFSR7J2EIZH",
  v1: "42d30fff6be1b7e59d031879d32aa33fb45e740f035d10e03b13e8474dc7cc92",
  v2: "0224a0453c0806df55ee2d7bb6db54f49885011429d0203cb6568101e3aa5967",
} as const;

export const INSTALL = "npm install @anas.abubakar/contractatlas-core";
export const CLI_CHECK = "contractatlas check manifest.json --rpc https://soroban-testnet.stellar.org --out report.json";

export const LIMITS = [
  "A match means the live WASM hash equals a hash an audit lists as reviewed. It does not mean the audit covered dependencies, deployment configuration or privileged roles.",
  "Privileges, dependencies and limitations are declarations copied from the manifest. ContractAtlas does not verify them.",
  "A source commit is not compared with deployed code. Without a hash mapping, audit coverage stays unresolved.",
  "A contract entry that is archived or never deployed is reported unavailable, not as proof of absence.",
  "A report is a point-in-time observation. It is not a security rating, an audit or an endorsement.",
] as const;

/** The only host the live check contacts. */
export const TESTNET_RPC = "https://soroban-testnet.stellar.org";
export const TESTNET_HOST = "soroban-testnet.stellar.org";
export const MAX_CONTRACTS = 10;
