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

This scans the current working directory, writes an HTML report into the workspace, and opens it in your default browser.

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
| `-o, --output <path>` | Write the report to this file path (resolved from the current working directory). If omitted, the report is written under the scanned workspace as `modulens-angular-report-<workspace>.html` or `.json` depending on `--format`. |
| `--no-open` | Generate the HTML report but do not launch a browser. No effect for JSON output (the browser is never opened for JSON). |

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
modulens-angular-report-<workspace>.html
```

The file is created in the **scanned workspace** root. Unless `--no-open` is set, the report is opened in your default browser after a successful scan.

### JSON

Uses the same snapshot structure as the internal `JsonFormatter` (metadata, `result`, sections, and related precomputed views). When `--output` is omitted, the file is:

```
modulens-angular-report-<workspace>.json
```

in the workspace root.

---

## Version

`modulens --version` prints the version from the published package metadata (same as `package.json`).

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
