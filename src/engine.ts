import { createDefaultPersonas } from "./personas";
import {
  initRun,
  saveState,
  saveResearch,
  saveScores,
  saveTournament,
  type RunState,
  type Iteration,
} from "./state";
import { glean_search, web_search, figma_createPage, figma_createFrame, figma_updateFrame, figma_addAnnotation } from "./mcp";
import { generateFeedback, averageScore } from "./feedback";
import { cullBelowThreshold, runTournament, selectTopTwo } from "./scoring";
import { generateReport } from "./report";

const INITIAL_DIRECTIONS = 4;
const ITERATIONS_PER_DIRECTION = 4;
const CONVERGENCE_ROUNDS = 3;

export async function run(url: string, description: string): Promise<RunState> {
  console.log(`\n🐦 Starling — Design Orchestrator`);
  console.log(`   URL: ${url}`);
  console.log(`   Description: ${description}\n`);

  const personas = createDefaultPersonas();
  const state = await initRun(url, description, personas);
  console.log(`   Run ID: ${state.id}\n`);

  await phaseResearch(state);
  await phaseDiverge(state);
  await phaseFeedback(state, 1);
  await phaseIterate(state);
  await phaseTournament(state);
  await phaseConverge(state);
  await phaseReport(state);

  return state;
}

// --- Phase 1: Research ---

async function phaseResearch(state: RunState): Promise<void> {
  console.log(`📚 Phase 1: Research`);
  state.phase = "research";
  await saveState(state);

  const webResults = await web_search(`${state.description} UX design patterns`);
  const gleanResults = await glean_search(state.description);

  const brief = [
    `# Research Brief: ${state.description}`,
    `\n## Competitive Analysis`,
    ...webResults.map((r) => `- ${r}`),
    `\n## Internal Context`,
    ...gleanResults.map((r) => `- ${r}`),
    `\n## Key Themes`,
    `- Progressive disclosure and simplicity are recurring patterns`,
    `- Power users need efficiency; new users need guidance`,
    `- Mobile-first considerations matter for on-the-go users`,
  ].join("\n");

  await saveResearch(state, brief);
  console.log(`   Research brief saved.\n`);
}

// --- Phase 2: Diverge ---

async function phaseDiverge(state: RunState): Promise<void> {
  console.log(`🌿 Phase 2: Diverge — generating ${INITIAL_DIRECTIONS} directions`);
  state.phase = "diverge";

  const pageId = await figma_createPage(state.url, `Starling: ${state.description}`);

  const directionSeeds = [
    { name: "Minimal Flow", thesis: "Strip everything to the absolute essentials. One screen, one action." },
    { name: "Guided Wizard", thesis: "Step-by-step walkthrough that holds the user's hand through every decision." },
    { name: "Power Dashboard", thesis: "Everything visible at once for users who want full control and context." },
    { name: "Adaptive Interface", thesis: "Starts simple, reveals complexity as the user demonstrates competence." },
  ];

  for (const seed of directionSeeds) {
    const frame = await figma_createFrame(pageId, seed.name, seed.thesis);
    state.directions.push({
      id: frame.id,
      name: seed.name,
      thesis: seed.thesis,
      iterations: [],
      alive: true,
    });
    console.log(`   Created: ${seed.name} — "${seed.thesis}"`);
  }

  await saveState(state);
  console.log(`   ${INITIAL_DIRECTIONS} directions created.\n`);
}

// --- Phase 3: Feedback ---

async function phaseFeedback(state: RunState, round: number): Promise<void> {
  console.log(`💬 Phase 3: Feedback (round ${round})`);
  state.phase = "feedback";

  for (const dir of state.directions) {
    if (!dir.alive) continue;

    const feedback = await Promise.all(
      state.personas.map((p) => generateFeedback(p, dir, round))
    );
    const avg = averageScore(feedback);

    const iteration: Iteration = {
      round,
      changes: round === 1 ? "Initial design" : `Applied round ${round - 1} feedback`,
      feedback,
      avgScore: avg,
    };

    dir.iterations.push(iteration);
    console.log(`   ${dir.name}: avg ${avg}/100`);
  }

  cullBelowThreshold(state.directions);
  await saveScores(state);
  await saveState(state);
  console.log("");
}

// --- Phase 4: Iterate ---

async function phaseIterate(state: RunState): Promise<void> {
  console.log(`🔄 Phase 4: Iterate`);
  state.phase = "iterate";

  for (let round = 2; round <= ITERATIONS_PER_DIRECTION; round++) {
    console.log(`   --- Iteration round ${round} ---`);

    for (const dir of state.directions) {
      if (!dir.alive) continue;

      const prevIteration = dir.iterations[dir.iterations.length - 1];
      const topDislikes = prevIteration.feedback
        .flatMap((f) => f.dislikes)
        .slice(0, 3);
      const changes = topDislikes.length > 0
        ? `Addressed: ${topDislikes.join("; ")}`
        : "Refined based on positive signals";

      await figma_updateFrame(dir.id, changes);

      const feedback = await Promise.all(
        state.personas.map((p) => generateFeedback(p, dir, round))
      );
      const avg = averageScore(feedback);

      dir.iterations.push({ round, changes, feedback, avgScore: avg });
      console.log(`   ${dir.name}: avg ${avg}/100 (${changes.slice(0, 50)})`);
    }

    cullBelowThreshold(state.directions);
    await saveScores(state);
    await saveState(state);
  }
  console.log("");
}

// --- Phase 5: Tournament ---

async function phaseTournament(state: RunState): Promise<void> {
  console.log(`⚔️  Phase 5: Tournament`);
  state.phase = "tournament";

  const results = runTournament(state.directions);
  state.tournamentResults = results;

  for (const r of results) {
    const dir = state.directions.find((d) => d.id === r.directionId);
    const icon = r.advanced ? "🏆" : "💀";
    console.log(`   ${icon} ${dir?.name}: ${r.finalScore} — ${r.reason}`);
  }

  const topTwo = selectTopTwo(results);
  state.finalWinners = topTwo;

  await saveTournament(state);
  console.log("");
}

// --- Phase 6: Converge ---

async function phaseConverge(state: RunState): Promise<void> {
  console.log(`🎯 Phase 6: Converge — refining top ${state.finalWinners.length} directions`);
  state.phase = "converge";

  for (let round = 1; round <= CONVERGENCE_ROUNDS; round++) {
    console.log(`   --- Convergence round ${round} ---`);

    for (const winnerId of state.finalWinners) {
      const dir = state.directions.find((d) => d.id === winnerId);
      if (!dir || !dir.alive) continue;

      const iterationNum = dir.iterations.length + 1;
      const changes = `Convergence refinement ${round}: fine-tuning based on panel consensus`;

      await figma_updateFrame(dir.id, changes);

      const feedback = await Promise.all(
        state.personas.map((p) => generateFeedback(p, dir, iterationNum))
      );
      const avg = averageScore(feedback);

      dir.iterations.push({ round: iterationNum, changes, feedback, avgScore: avg });
      console.log(`   ${dir.name}: avg ${avg}/100`);
    }

    await saveScores(state);
    await saveState(state);
  }

  const finalists = state.finalWinners.map((id) => {
    const dir = state.directions.find((d) => d.id === id)!;
    const lastScore = dir.iterations[dir.iterations.length - 1]?.avgScore ?? 0;
    return { id, name: dir.name, score: lastScore };
  });

  finalists.sort((a, b) => b.score - a.score);

  if (finalists.length >= 2 && finalists[0].score - finalists[1].score <= 5) {
    console.log(`\n   🤝 Tie: "${finalists[0].name}" and "${finalists[1].name}" are within 5 points`);
  } else if (finalists.length > 0) {
    console.log(`\n   👑 Winner: "${finalists[0].name}" with ${finalists[0].score}/100`);
  }

  console.log("");
}

// --- Phase 7: Report ---

async function phaseReport(state: RunState): Promise<void> {
  console.log(`📝 Phase 7: Report`);
  state.phase = "report";

  for (const dir of state.directions) {
    for (const it of dir.iterations) {
      for (const fb of it.feedback) {
        if (fb.score > 80) {
          await figma_addAnnotation(dir.id, `⭐ ${fb.quote}`);
        }
      }
    }
  }

  await generateReport(state);

  state.phase = "done";
  await saveState(state);

  console.log(`   Report saved to runs/${state.id}/report.md`);
  console.log(`   Run complete.\n`);
}
