import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import type { Persona } from "./personas";

export interface Direction {
  id: string;
  name: string;
  thesis: string;
  iterations: Iteration[];
  alive: boolean;
  culledReason?: string;
}

export interface Iteration {
  round: number;
  changes: string;
  feedback: PersonaFeedback[];
  avgScore: number;
}

export interface PersonaFeedback {
  personaId: string;
  score: number;
  quote: string;
  likes: string[];
  dislikes: string[];
}

export interface TournamentResult {
  directionId: string;
  finalScore: number;
  advanced: boolean;
  reason: string;
}

export interface RunState {
  id: string;
  url: string;
  description: string;
  phase: "research" | "diverge" | "feedback" | "iterate" | "tournament" | "converge" | "report" | "done";
  createdAt: string;
  personas: Persona[];
  researchBrief: string;
  directions: Direction[];
  tournamentResults: TournamentResult[];
  finalWinners: string[];
}

const RUNS_DIR = join(import.meta.dir, "..", "runs");

export function generateRunId(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = now.toISOString().slice(11, 16).replace(":", "");
  return `${date}-${time}`;
}

export function runDir(runId: string): string {
  return join(RUNS_DIR, runId);
}

export async function initRun(url: string, description: string, personas: Persona[]): Promise<RunState> {
  const id = generateRunId();
  const dir = runDir(id);
  await mkdir(dir, { recursive: true });
  await mkdir(join(dir, "directions"), { recursive: true });

  const state: RunState = {
    id,
    url,
    description,
    phase: "research",
    createdAt: new Date().toISOString(),
    personas,
    researchBrief: "",
    directions: [],
    tournamentResults: [],
    finalWinners: [],
  };

  await saveState(state);
  return state;
}

export async function saveState(state: RunState): Promise<void> {
  const dir = runDir(state.id);
  await Bun.write(join(dir, "config.json"), JSON.stringify(state, null, 2));
  await Bun.write(join(dir, "personas.json"), JSON.stringify(state.personas, null, 2));
}

export async function loadState(runId: string): Promise<RunState> {
  const file = Bun.file(join(runDir(runId), "config.json"));
  return file.json();
}

export async function listRuns(): Promise<{ id: string; phase: string; description: string }[]> {
  const { readdir } = await import("node:fs/promises");
  try {
    const entries = await readdir(RUNS_DIR);
    const runs: { id: string; phase: string; description: string }[] = [];
    for (const entry of entries) {
      try {
        const state = await loadState(entry);
        runs.push({ id: state.id, phase: state.phase, description: state.description });
      } catch {
        // skip invalid dirs
      }
    }
    return runs.sort((a, b) => b.id.localeCompare(a.id));
  } catch {
    return [];
  }
}

export async function saveResearch(state: RunState, brief: string): Promise<void> {
  state.researchBrief = brief;
  state.phase = "diverge";
  await Bun.write(join(runDir(state.id), "research.md"), brief);
  await saveState(state);
}

export async function saveScores(state: RunState): Promise<void> {
  const scores = state.directions.map((d) => ({
    id: d.id,
    name: d.name,
    alive: d.alive,
    iterations: d.iterations.map((it) => ({ round: it.round, avgScore: it.avgScore })),
  }));
  await Bun.write(join(runDir(state.id), "scores.json"), JSON.stringify(scores, null, 2));
}

export async function saveTournament(state: RunState): Promise<void> {
  const lines = ["# Tournament Results\n"];
  for (const r of state.tournamentResults) {
    const dir = state.directions.find((d) => d.id === r.directionId);
    lines.push(`## ${dir?.name ?? r.directionId}`);
    lines.push(`- Score: ${r.finalScore}`);
    lines.push(`- Advanced: ${r.advanced}`);
    lines.push(`- Reason: ${r.reason}\n`);
  }
  await Bun.write(join(runDir(state.id), "tournament.md"), lines.join("\n"));
  await saveState(state);
}
