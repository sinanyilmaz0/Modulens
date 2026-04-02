# Changelog

All notable changes to **Modulens** are documented in this file. The publishable CLI is **`@modulens/angular`** (see `angular/`).

## [0.2.0] - 2026-04-02

### Snapshot compare

- Clearer compare flow across the report: workspace-level deltas on **Overview** stay separate from component-level compare on **Components**.
- Project-scoped snapshot compare so you can see how a project moved versus a saved baseline.

### Report UX improvements

- HTML **Overview** adds structured reading: executive **summary** and **priority focus** sections to surface scale, risk, and where to look first.
- Compare controls and copy refined so overview breakdown cards stay informational while compare stays in the right places.

### Components Explorer improvements

- Smoother exploration of components, with **rule details** surfaced in the report where they help triage issues.

### Diagnostics / JSON export improvements

- Richer diagnostics in exports and a clearer **public JSON** contract for tools and CI (`schemaVersion` in the document; `toolVersion` and run metadata for traceability).

### Analyzer internals

- Lifecycle analyzer and family detector refactored for clearer structure and easier evolution (no change to how you invoke the CLI).

### CLI / docs improvements

- CLI behavior and user-facing documentation updated to match current scan output, paths, and report features.

## [0.1.0]

- Initial public release of `@modulens/angular`: workspace scan, HTML report, JSON output, and workspace snapshots under `.modulens/`.
