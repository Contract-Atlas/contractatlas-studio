# Overview

The public report page for [ContractAtlas](https://github.com/Contract-Atlas/contractatlas-core) reports: does the code live on chain still match the audit scope a project published?

It reads a report produced by `contractatlas-core`, shows each contract as **match**, **drift**, **incomplete** or **unavailable** with the evidence behind it, and can compare two reports to show what changed between them (for example, a contract upgrade). It never computes a verdict itself: every status, finding and provenance field on the page comes from the report JSON, and the same report renders in the CLI.

Hosted demo: https://contractatlas-studio-anasamasama.vercel.app

Source: [contractatlas-studio on GitHub](https://github.com/Contract-Atlas/contractatlas-studio). Releases: [GitHub releases](https://github.com/Contract-Atlas/contractatlas-studio/releases).
