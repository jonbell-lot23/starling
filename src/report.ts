import { join } from "node:path";
import type { RunState } from "./state";
import { runDir } from "./state";

/**
 * Generate the final markdown report: evolution trail, quotes, star moments.
 */
export async function generateReport(state: RunState): Promise<string> {
  const lines: string[] = [];

  lines.push(`# Starling Report: ${state.description}`);
  lines.push(`Run ID: \`${state.id}\`  `);
  lines.push(`URL: ${state.url}  `);
  lines.push(`Generated: ${new Date().toISOString()}\n`);

  // --- Winners ---
  lines.push(`## Final Winner(s)\n`);
  for (const winnerId of state.finalWinners) {
    const dir = state.directions.find((d) => d.id === winnerId);
    if (dir) {
      const lastIt = dir.iterations[dir.iterations.length - 1];
      lines.push(`### ${dir.name}`);
      lines.push(`**Thesis:** ${dir.thesis}  `);
      lines.push(`**Final score:** ${lastIt?.avgScore ?? "N/A"}  `);
      lines.push(`**Iterations:** ${dir.iterations.length}\n`);
    }
  }

  // --- Research Brief ---
  lines.push(`## Research Brief\n`);
  lines.push(state.researchBrief || "_No research conducted._");
  lines.push("");

  // --- Evolution Trail ---
  lines.push(`## Evolution Trail\n`);
  for (const dir of state.directions) {
    const status = dir.alive ? "✅ Active" : `❌ Culled — ${dir.culledReason ?? "unknown"}`;
    lines.push(`### ${dir.name} (${status})`);
    lines.push(`**Thesis:** ${dir.thesis}\n`);

    for (const it of dir.iterations) {
      lines.push(`#### Round ${it.round}`);
      lines.push(`Changes: ${it.changes}  `);
      lines.push(`Average score: **${it.avgScore}**\n`);

      // Persona quotes
      for (const fb of it.feedback) {
        const persona = state.personas.find((p) => p.id === fb.personaId);
        const name = persona?.name ?? fb.personaId;
        const archetype = persona?.archetype ?? "";
        lines.push(`> **${name}** (${archetype}): "${fb.quote}" — **${fb.score}/100**`);
        if (fb.likes.length > 0) lines.push(`>   Likes: ${fb.likes.join(", ")}`);
        if (fb.dislikes.length > 0) lines.push(`>   Dislikes: ${fb.dislikes.join(", ")}`);
      }
      lines.push("");
    }

    // Star moments: any single feedback score > 80
    const stars = dir.iterations.flatMap((it) =>
      it.feedback.filter((f) => f.score > 80).map((f) => ({ round: it.round, feedback: f }))
    );
    if (stars.length > 0) {
      lines.push(`#### ⭐ Star Moments`);
      for (const s of stars) {
        const persona = state.personas.find((p) => p.id === s.feedback.personaId);
        lines.push(
          `- Round ${s.round}: **${persona?.name}** loved it (${s.feedback.score}/100): "${s.feedback.quote}"`
        );
      }
      lines.push("");
    }
  }

  // --- Tournament ---
  if (state.tournamentResults.length > 0) {
    lines.push(`## Tournament Results\n`);
    for (const r of state.tournamentResults) {
      const dir = state.directions.find((d) => d.id === r.directionId);
      const icon = r.advanced ? "🏆" : "💀";
      lines.push(`- ${icon} **${dir?.name}**: ${r.finalScore} — ${r.reason}`);
    }
    lines.push("");
  }

  // --- Key Decisions ---
  lines.push(`## Key Decisions\n`);
  const culled = state.directions.filter((d) => !d.alive);
  if (culled.length > 0) {
    lines.push(`### Directions Culled`);
    for (const d of culled) {
      lines.push(`- **${d.name}**: ${d.culledReason}`);
    }
    lines.push("");
  }

  const report = lines.join("\n");

  // Write to file
  await Bun.write(join(runDir(state.id), "report.md"), report);

  return report;
}
