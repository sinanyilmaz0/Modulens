# Modulens for Angular

**Modulens for Angular** is a CLI tool for analyzing Angular workspaces and generating architecture, structure, and quality reports. It helps you spot large components, architectural risks, warning hotspots, and areas that may need refactoring.

---

## Installation

### Global install

```bash
npm install -g @modulens/angular
```

Then run:

```bash
modulens scan
```

### One-off usage with npx

```bash
npx @modulens/angular scan
```

---

## Quick start

Run Modulens in your Angular project directory:

```bash
modulens scan
```

This scans the current working directory, writes an HTML report under `.modulens/reports/` (default location), opens it in your default browser, and **always** saves a JSON snapshot under `.modulens/snapshots/` in that workspace (same analysis run; no second scan).

Scan a specific workspace:

```bash
modulens scan "path/to/workspace"
```

---

## Usage

### Scan the current directory

```bash
modulens scan
```

### Scan options

| Flag | Description |
|------|-------------|
| `--format <type>` | Output format: `html` (default) or `json`. JSON is suitable for scripts and CI (`jq`, file archives, etc.). |
| `-o, --output <path>` | Write the report to this file path (resolved from the current working directory). If omitted, the report is written under `<workspace>/.modulens/reports/` as `modulens-angular-report-<workspace>.html` or `.json` depending on `--format`. |
| `--no-open` | Generate the HTML report but do not launch a browser. No effect for JSON output (the browser is never opened for JSON). |

Every successful scan also writes a **workspace JSON snapshot** (see [Workspace JSON snapshots](#workspace-json-snapshots) below), regardless of `--format`.

Invalid `--format` values cause a non-zero exit code and an error message.

**JSON on stdout:** use `--format json` with `--output -` (or `-o -`). Progress lines go to stderr so you can pipe the JSON (for example `modulens scan . --format json --output - | jq .`).

**HTML cannot be written to stdout**; using `--format html --output -` fails with an error.

### Examples

```bash
modulens scan .
modulens scan ./my-workspace --no-open
modulens scan . --format json
modulens scan . --format json --output -
modulens scan . --format html -o ./reports/modulens.html --no-open
modulens scan . --format json -o ./reports/snapshot.json
```

By default, the workspace argument defaults to `.` (current working directory).

---

## Output

### HTML (default)

File name when `--output` is omitted:

```
<workspace>/.modulens/reports/modulens-angular-report-<workspace>.html
```

Unless `--no-open` is set, the report is opened in your default browser after a successful scan.

On **Overview**, the report includes a short **executive summary** and **Priority focus** so you can see scale, risk signals, and where to look first before opening detailed charts and lists.

### JSON

Uses the same snapshot structure as the internal `JsonFormatter` (metadata, `result`, sections, and related precomputed views). The document includes a top-level **`schemaVersion`** for the public JSON shape (incremented when the export contract changes). Metadata includes **`toolVersion`** and other run fields for traceability—downstream tools should treat **`schemaVersion`** as the compatibility key when parsing. When `--output` is omitted, the file is:

```
<workspace>/.modulens/reports/modulens-angular-report-<workspace>.json
```

### Workspace JSON snapshots

On every successful `modulens scan`, Modulens writes an additional JSON file under:

```
<workspace>/.modulens/snapshots/
```

The file name looks like `snapshot-YYYY-MM-DDTHH-mm-ss-<shortid>.json` (filesystem-safe timestamp plus a short id derived from the run metadata). The content matches the public JSON export (`JsonFormatter`), i.e. the same analysis snapshot as the HTML or primary JSON report. If the snapshot cannot be written (for example permissions), the CLI prints a warning but does not fail the scan solely for that reason when the main report was written successfully.

The **HTML report** reads compatible snapshots from that folder (same workspace path in metadata, newest first) and embeds a short history for the UI. Modulens precomputes a compact compare payload per history entry when the HTML is built (no browser disk access).

On **Overview**, use the **Compare** section to pick a baseline for **workspace-level** deltas (findings, scores, severity counts, and a short “largest shift” note by area). This choice is **only for the overview summary**; it does not enable compare on the Components page.

**Workspace breakdown** cards (projects or feature areas) are **informational**—component counts, findings, and primary pressure—without compare controls.

On **Components**, choose **Compare components with a previous snapshot** when you want diff badges, the baseline bar, and **Compare vs baseline** filters. That selection is **separate** from Overview compare. Filters apply to components in the workspace using the precomputed per–source-root slice for the baseline you picked. The **Components** explorer helps you search and navigate; where it helps triage, the report surfaces **rule details** next to findings.

---

## Version

`modulens --version` prints the version from the published package metadata (same as `package.json`). Release notes for each version live in the repository [`CHANGELOG.md`](../CHANGELOG.md) at the repo root.

---

## Requirements

- **Node.js 18+**
- An Angular workspace to scan

---

## Limitations

Modulens for Angular is still in an early stage. Some checks are intentionally simple, reports are being refined, and output and scoring logic may evolve between versions.

---

## Roadmap

Planned improvements may include:

- richer architecture insights
- stronger rule coverage
- smarter risk analysis
- clearer explanations for warnings
- more detailed and polished reports

---

## License

ISC
