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

This scans the current working directory and generates an HTML report.

You can also scan a specific workspace path:

```bash
modulens scan "path/to/workspace"
```

---

## Usage

### Scan the current directory

```bash
modulens scan
```

### Explicitly scan the current directory

```bash
modulens scan .
```

### Scan a specific Angular workspace

```bash
modulens scan "path/to/workspace"
```

By default, `modulens scan` uses the current working directory (`process.cwd()`) as the workspace root.

---

## Output

Modulens generates an HTML report file in the scanned workspace directory.

The report file name follows this pattern:

```
modulens-angular-report-<workspace>.html
```

After the scan is completed, the report is opened in your default browser.

---

## Example

```bash
modulens scan
```

or

```bash
npx @modulens/angular scan "C:/projects/my-angular-app"
```

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
