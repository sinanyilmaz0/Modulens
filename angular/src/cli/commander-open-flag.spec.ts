import { strict as assert } from "node:assert";
import { Command } from "commander";

/**
 * Commander represents `--no-open` as `opts.open === false` (default `open: true`),
 * not `opts.noOpen === true`. The scan handler must read `open`.
 */

console.log("cli/commander-open-flag");

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}`);
    throw e;
  }
}

test("commander --no-open yields opts.open === false", () => {
  const program = new Command();
  const scan = program.command("scan");
  let captured: { open?: boolean } | undefined;
  scan
    .argument("[w]")
    .option("--no-open", "test")
    .action((_w, opts: { open?: boolean }) => {
      captured = opts;
    });
  program.parse(["node", "m", "scan", ".", "--no-open"], { from: "node" });
  assert.strictEqual(captured?.open, false);
});

test("without --no-open, commander yields opts.open === true", () => {
  const program = new Command();
  const scan = program.command("scan");
  let captured: { open?: boolean } | undefined;
  scan
    .argument("[w]")
    .option("--no-open", "test")
    .action((_w, opts: { open?: boolean }) => {
      captured = opts;
    });
  program.parse(["node", "m", "scan", "."], { from: "node" });
  assert.strictEqual(captured?.open, true);
});
