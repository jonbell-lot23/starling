import type { Persona } from "./personas";
import type { Direction, PersonaFeedback } from "./state";

/**
 * Generate synthetic feedback from a persona for a direction.
 * Stubbed: generates plausible scores/quotes based on persona traits.
 * In production, this would call an LLM with persona context + design screenshot.
 */
export function generateFeedback(
  persona: Persona,
  direction: Direction,
  iterationRound: number
): PersonaFeedback {
  // Deterministic-ish seed from persona + direction + round
  const seed = hashCode(`${persona.id}-${direction.id}-${iterationRound}`);

  // Base score influenced by persona archetype fit
  const baseScore = archetypeBaseScore(persona, direction);

  // Improve slightly each iteration (personas notice improvements)
  const iterationBonus = Math.min(iterationRound * 3, 15);

  // Add some variance
  const variance = (seed % 21) - 10; // -10 to +10
  const score = Math.max(1, Math.min(100, baseScore + iterationBonus + variance));

  const quote = generateQuote(persona, direction, score, iterationRound);
  const likes = generateLikes(persona, score);
  const dislikes = generateDislikes(persona, score);

  // Update persona memory
  persona.memory.push(
    `Round ${iterationRound} on "${direction.name}": scored ${score}/100. ${quote}`
  );

  return { personaId: persona.id, score, quote, likes, dislikes };
}

export function averageScore(feedback: PersonaFeedback[]): number {
  if (feedback.length === 0) return 0;
  const sum = feedback.reduce((acc, f) => acc + f.score, 0);
  return Math.round(sum / feedback.length);
}

// --- Internals ---

function archetypeBaseScore(persona: Persona, direction: Direction): number {
  // Stub: assign base scores by archetype. In production, LLM would evaluate.
  const scores: Record<string, number> = {
    "sole-trader": 55,
    "bookkeeper": 50,
    "small-biz-owner": 60,
    "accountant": 45,
    "new-user": 50,
  };
  // Direction index adds variety (different directions suit different personas)
  const dirOffset = (hashCode(direction.id) % 20) - 10;
  return (scores[persona.id] ?? 50) + dirOffset;
}

function generateQuote(persona: Persona, direction: Direction, score: number, round: number): string {
  if (round > 1 && persona.memory.length > 0) {
    // Reference previous feedback
    if (score > 70) return `This is getting better. The ${direction.name} approach finally clicks for me.`;
    if (score > 50) return `Better than last time, but I still struggle with the overall flow.`;
    return `I've seen this before and it still doesn't work for someone like me.`;
  }

  if (score > 75) return `I love this. "${direction.name}" makes total sense for how I work.`;
  if (score > 60) return `Pretty good. I can see where this is going.`;
  if (score > 40) return `I get the idea but it feels overcomplicated for my needs.`;
  if (score > 25) return `This doesn't feel like it was designed for someone like me.`;
  return `I'm lost. I don't even know where to start with this.`;
}

function generateLikes(persona: Persona, score: number): string[] {
  if (score > 60) {
    return persona.priorities.slice(0, 2).map((p) => `Good ${p.toLowerCase()}`);
  }
  return score > 40 ? ["Has potential"] : [];
}

function generateDislikes(persona: Persona, score: number): string[] {
  if (score < 50) {
    return persona.frustrations.slice(0, 2);
  }
  return score < 70 ? [persona.frustrations[0]] : [];
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash);
}
