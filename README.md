# Modulens

**Modulens** is a brand of architecture, structure, and quality analysis tools for frontend workspaces. The repository is designed to support multiple frameworks over time.

Currently, only the **Angular** package is available. Future packages for React, Vue, and Flutter may be added.

---

## Repository structure

```
/
  angular/          # @modulens/angular — Angular workspace analysis CLI
  package.json      # Private workspace root
  tsconfig.base.json
```

---

## Getting started

Install and use the Angular package:

```bash
npm install -g @modulens/angular
modulens scan
```

Each successful `modulens scan` writes the HTML (or JSON) report under `.modulens/reports/` in the scanned workspace (unless you pass `--output`), saves a JSON snapshot under `.modulens/snapshots/`, and embeds snapshot history in the HTML. Compare the **current run** to a **stored snapshot** from a project card; on **Components**, use compare filters when a baseline is active. See the [Angular package README](angular/README.md) for details.

For full documentation, installation options, and usage examples, see the [Angular package README](angular/README.md).

---

## License

ISC
