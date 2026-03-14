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

For full documentation, installation options, and usage examples, see the [Angular package README](angular/README.md).

---

## License

ISC
