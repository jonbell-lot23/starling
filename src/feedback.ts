import type { Persona } from "./personas";
import type { Direction, PersonaFeedback } from "./state";

/**
 * Generate feedback from a persona for a direction.
 * Uses Claude API if ANTHROPIC_API_KEY is set, otherwise falls back to deterministic stub.
 */
export async function generateFeedback(
  persona: Persona,
  direction: Direction,
  iterationRound: number
): Promise<PersonaFeedback> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    return generateAIFeedback(apiKey, persona, direction, iterationRound);
  }
  return generateStubFeedback(persona, direction, iterationRound);
}

export function averageScore(feedback: PersonaFeedback[]): number {
  if (feedback.length === 0) return 0;
  const sum = feedback.reduce((acc, f) => acc + f.score, 0);
  return Math.round(sum / feedback.length);
}

// --- AI Feedback via Claude API ---

async function generateAIFeedback(
  apiKey: string,
  persona: Persona,
  direction: Direction,
  iterationRound: number
): Promise<PersonaFeedback> {
  const previousFeedback = persona.memory.length > 0
    ? `\n\nYour previous feedback on this project:\n${persona.memory.join("\n")}`
    : "";

  const prompt = `You are ${persona.name}, a ${persona.archetype}.

Background: ${persona.description}

Your priorities: ${persona.priorities.join(", ")}
Your frustrations: ${persona.frustrations.join(", ")}
${previousFeedback}

You are reviewing iteration ${iterationRound} of a design direction called "${direction.name}".
Thesis: "${direction.thesis}"

Give your honest reaction as this persona. Respond with ONLY valid JSON (no markdown, no code fences):
{
  "score": <number 1-100>,
  "quote": "<1-2 sentence natural reaction in first person>",
  "likes": ["<specific thing you like>", ...],
  "dislikes": ["<specific thing you dislike>", ...]
}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`  [ai-feedback] API error (${response.status}), falling back to stub: ${errText.slice(0, 100)}`);
      return generateStubFeedback(persona, direction, iterationRound);
    }

    const data = await response.json() as {
      content: Array<{ type: string; text?: string }>;
    };

    const text = data.content?.[0]?.text ?? "";
    const parsed = JSON.parse(text) as {
      score?: number;
      quote?: string;
      likes?: string[];
      dislikes?: string[];
    };

    const score = Math.max(1, Math.min(100, Math.round(parsed.score ?? 50)));
    const quote = parsed.quote ?? "No comment.";
    const likes = Array.isArray(parsed.likes) ? parsed.likes : [];
    const dislikes = Array.isArray(parsed.dislikes) ? parsed.dislikes : [];

    persona.memory.push(
      `Round ${iterationRound} on "${direction.name}": scored ${score}/100. ${quote}`
    );

    return { personaId: persona.id, score, quote, likes, dislikes };
  } catch (err) {
    console.warn(`  [ai-feedback] Error, falling back to stub:`, (err as Error).message);
    return generateStubFeedback(persona, direction, iterationRound);
  }
}

// --- Deterministic Stub Feedback ---

function generateStubFeedback(
  persona: Persona,
  direction: Direction,
  iterationRound: number
): PersonaFeedback {
  const seed = hashCode(`${persona.id}-${direction.id}-${iterationRound}`);
  const baseScore = archetypeBaseScore(persona, direction);
  const iterationBonus = Math.min(iterationRound * 3, 15);
  const variance = (seed % 21) - 10;
  const score = Math.max(1, Math.min(100, baseScore + iterationBonus + variance));

  const quote = generateQuote(persona, direction, score, iterationRound);
  const likes = generateLikes(persona, score);
  const dislikes = generateDislikes(persona, score);

  persona.memory.push(
    `Round ${iterationRound} on "${direction.name}": scored ${score}/100. ${quote}`
  );

  return { personaId: persona.id, score, quote, likes, dislikes };
}

// --- Internals ---

function archetypeBaseScore(persona: Persona, direction: Direction): number {
  const scores: Record<string, number> = {
    "sole-trader": 55,
    "bookkeeper": 50,
    "small-biz-owner": 60,
    "accountant": 45,
    "new-user": 50,
  };
  const dirOffset = (hashCode(direction.id) % 20) - 10;
  return (scores[persona.id] ?? 50) + dirOffset;
}

function generateQuote(persona: Persona, direction: Direction, score: number, round: number): string {
  if (round > 1 && persona.memory.length > 0) {
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
