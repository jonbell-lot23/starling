import { join } from "node:path";

export interface DesignPrinciple {
  name: string;
  description: string;
  weight: number; // 1-10
}

export interface PersonaOverride {
  id: string;
  name?: string;
  archetype?: string;
  description?: string;
  priorities?: string[];
  frustrations?: string[];
}

export interface StarlingConfig {
  designPrinciples: DesignPrinciple[];
  personaOverrides?: PersonaOverride[];
  defaultIterations?: number;
  convergenceRounds?: number;
}

const DEFAULT_CONFIG: StarlingConfig = {
  designPrinciples: [
    { name: "Simplicity", description: "Minimize cognitive load. Every element must earn its place.", weight: 9 },
    { name: "Clarity", description: "Users should always know where they are, what they can do, and what just happened.", weight: 8 },
    { name: "Efficiency", description: "Reduce steps to complete tasks. Respect power users' time.", weight: 7 },
    { name: "Accessibility", description: "Usable by everyone regardless of ability, device, or context.", weight: 8 },
    { name: "Consistency", description: "Patterns, language, and interactions should be predictable across the product.", weight: 6 },
  ],
  defaultIterations: 4,
  convergenceRounds: 3,
};

export async function loadConfig(): Promise<StarlingConfig> {
  const configPath = join(process.cwd(), "starling.config.ts");
  try {
    const file = Bun.file(configPath);
    if (await file.exists()) {
      const mod = await import(configPath);
      const userConfig = mod.default ?? mod.config ?? mod;
      return { ...DEFAULT_CONFIG, ...userConfig };
    }
  } catch (err) {
    console.warn(`  [config] Could not load starling.config.ts: ${(err as Error).message}`);
  }
  return DEFAULT_CONFIG;
}

export function getDefaultConfig(): StarlingConfig {
  return DEFAULT_CONFIG;
}

export function generateConfigTemplate(): string {
  return `import type { StarlingConfig } from "./src/config";

const config: StarlingConfig = {
  designPrinciples: [
    { name: "Simplicity", description: "Minimize cognitive load. Every element must earn its place.", weight: 9 },
    { name: "Clarity", description: "Users should always know where they are, what they can do, and what just happened.", weight: 8 },
    { name: "Efficiency", description: "Reduce steps to complete tasks. Respect power users' time.", weight: 7 },
    { name: "Accessibility", description: "Usable by everyone regardless of ability, device, or context.", weight: 8 },
    { name: "Consistency", description: "Patterns, language, and interactions should be predictable across the product.", weight: 6 },
  ],

  // Override default persona attributes
  // personaOverrides: [
  //   { id: "sole-trader", priorities: ["Speed", "Mobile-first"] },
  // ],

  // Number of iteration rounds per direction (default: 4)
  defaultIterations: 4,

  // Number of convergence rounds for finalists (default: 3)
  convergenceRounds: 3,
};

export default config;
`;
}
