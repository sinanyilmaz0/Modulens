import fs from "fs";

const path = new URL("../src/report/html/html-report-view.ts", import.meta.url);
const lines = fs.readFileSync(path, "utf8").split(/\r?\n/);
// 1-based lines 223–2026 inclusive → 0-based [222, 2026)
const body = lines.slice(222, 2026).join("\n");
const header = `/**
 * Embedded browser IIFE for the HTML report (injected after bootstrap globals).
 */
`;
// No unescaped ` or ${ in body (verified); backslashes must not be doubled.
const out = `${header}export const REPORT_CLIENT_SCRIPT = \`${body.replace(/`/g, "\\`")}\`;
`;
const outPath = new URL("../src/report/html/report-client-script.ts", import.meta.url);
fs.writeFileSync(outPath, out);
console.log("written", outPath.pathname, "lines", body.split("\n").length, "chars", body.length);
