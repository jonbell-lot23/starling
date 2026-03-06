import type { Direction, TournamentResult } from "./state";

/**
 * Tournament scoring logic.
 *
 * Rules (from spec):
 * - Below 30 average = culled immediately
 * - >15 point gap between two directions = loser culled
 * - Within 5 points = both continue
 * - Top 2 advance to convergence
 */

export function cullBelowThreshold(directions: Direction[]): Direction[] {
  for (const dir of directions) {
    if (!dir.alive) continue;
    const lastIteration = dir.iterations[dir.iterations.length - 1];
    if (lastIteration && lastIteration.avgScore < 30) {
      dir.alive = false;
      dir.culledReason = `Culled: average score ${lastIteration.avgScore} below threshold of 30`;
      console.log(`  ✂️  ${dir.name} culled (score ${lastIteration.avgScore} < 30)`);
    }
  }
  return directions;
}

export function runTournament(directions: Direction[]): TournamentResult[] {
  const alive = directions.filter((d) => d.alive);
  const results: TournamentResult[] = [];

  // Get best iteration score for each
  const scored = alive.map((d) => {
    const best = d.iterations.reduce(
      (max, it) => (it.avgScore > max ? it.avgScore : max),
      0
    );
    return { direction: d, bestScore: best };
  });

  // Sort by best score descending
  scored.sort((a, b) => b.bestScore - a.bestScore);

  // Head-to-head comparisons
  for (let i = 0; i < scored.length; i++) {
    const current = scored[i];
    const leader = scored[0];

    if (i === 0) {
      results.push({
        directionId: current.direction.id,
        finalScore: current.bestScore,
        advanced: true,
        reason: "Top scorer",
      });
      continue;
    }

    const gap = leader.bestScore - current.bestScore;

    if (gap > 15) {
      // Clear loser — cull
      current.direction.alive = false;
      current.direction.culledReason = `Tournament: ${gap} point gap from leader`;
      results.push({
        directionId: current.direction.id,
        finalScore: current.bestScore,
        advanced: false,
        reason: `Culled: ${gap} point gap from leader "${leader.direction.name}"`,
      });
    } else if (gap <= 5) {
      // Close enough — both continue
      results.push({
        directionId: current.direction.id,
        finalScore: current.bestScore,
        advanced: true,
        reason: `Within 5 points of leader (gap: ${gap})`,
      });
    } else {
      // Middle ground (6-15 gap): advance top 2 only
      const advanced = i < 2;
      if (!advanced) {
        current.direction.alive = false;
        current.direction.culledReason = `Tournament: didn't make top 2 (gap: ${gap})`;
      }
      results.push({
        directionId: current.direction.id,
        finalScore: current.bestScore,
        advanced,
        reason: advanced
          ? `Second place (gap: ${gap})`
          : `Eliminated: not in top 2 (gap: ${gap})`,
      });
    }
  }

  return results;
}

export function selectTopTwo(results: TournamentResult[]): string[] {
  return results
    .filter((r) => r.advanced)
    .sort((a, b) => b.finalScore - a.finalScore)
    .slice(0, 2)
    .map((r) => r.directionId);
}
