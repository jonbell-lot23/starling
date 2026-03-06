#!/usr/bin/env bun

import { run } from "./engine";
import { loadState, listRuns } from "./state";
import { generateReport } from "./report";

const args = process.argv.slice(2);
const command = args[0];

async function main() {
  switch (command) {
    case "run":
      await handleRun();
      break;
    case "status":
      await handleStatus();
      break;
    case "report":
      await handleReport();
      break;
    case "list":
      await handleList();
      break;
    default:
      printUsage();
  }
}

async function handleRun() {
  const url = args[1];
  if (!url) {
    console.error("Error: URL required.\nUsage: starling run <url> [--description \"...\"]");
    process.exit(1);
  }

  const descIdx = args.indexOf("--description");
  const description = descIdx !== -1 ? args[descIdx + 1] ?? "Design exploration" : "Design exploration";

  const state = await run(url, description);
  console.log(`✅ Run ${state.id} complete. See runs/${state.id}/report.md`);
}

async function handleStatus() {
  const runId = args[1];
  if (!runId) {
    console.error("Usage: starling status <run-id>");
    process.exit(1);
  }

  try {
    const state = await loadState(runId);
    console.log(`Run: ${state.id}`);
    console.log(`Phase: ${state.phase}`);
    console.log(`URL: ${state.url}`);
    console.log(`Description: ${state.description}`);
    console.log(`Directions: ${state.directions.length} (${state.directions.filter((d) => d.alive).length} alive)`);
    console.log(`Winners: ${state.finalWinners.length > 0 ? state.finalWinners.join(", ") : "TBD"}`);
  } catch {
    console.error(`Run "${runId}" not found.`);
    process.exit(1);
  }
}

async function handleReport() {
  const runId = args[1];
  if (!runId) {
    console.error("Usage: starling report <run-id>");
    process.exit(1);
  }

  try {
    const state = await loadState(runId);
    const report = await generateReport(state);
    console.log(report);
  } catch {
    console.error(`Run "${runId}" not found.`);
    process.exit(1);
  }
}

async function handleList() {
  const runs = await listRuns();
  if (runs.length === 0) {
    console.log("No runs found.");
    return;
  }
  console.log("Runs:");
  for (const r of runs) {
    console.log(`  ${r.id}  [${r.phase}]  ${r.description}`);
  }
}

function printUsage() {
  console.log(`
🐦 Starling — Design Orchestrator

Usage:
  starling run <url> --description "..."   Run a design exploration
  starling status <run-id>                 Check run status
  starling report <run-id>                 Regenerate/view report
  starling list                            List all runs
`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
