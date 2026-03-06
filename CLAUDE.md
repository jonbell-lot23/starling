# Starling — Design Orchestrator

## What
CLI tool that automates iterative design exploration. Researches, generates Figma directions, gets synthetic user feedback, iterates, and converges on the strongest direction.

## Tech
- **Runtime:** Bun + TypeScript
- **No frontend** — CLI only
- **State:** JSON/markdown in `runs/`
- **MCP:** Figma + Glean (currently stubbed in `src/mcp.ts`)

## Architecture
```
src/
  cli.ts        — Entry point, arg parsing
  engine.ts     — Orchestration loop (7 phases)
  mcp.ts        — Figma/Glean MCP wrappers (stubs)
  personas.ts   — 5 Xero user archetypes
  feedback.ts   — Synthetic persona feedback + scoring
  scoring.ts    — Tournament logic (cull/advance rules)
  state.ts      — Run state management, file I/O
  report.ts     — Markdown report generation
```

## Flow
1. **Research** — web + Glean search, compile brief
2. **Diverge** — generate 4 design directions in Figma
3. **Feedback** — 5 personas score each direction (1-100)
4. **Iterate** — 4 rounds per surviving direction
5. **Tournament** — head-to-head, cull losers, top 2 advance
6. **Converge** — 3 refinement rounds on finalists
7. **Report** — evolution trail, quotes, star moments

## Tournament Rules
- Below 30 avg = culled immediately
- >15 point gap = loser culled
- Within 5 points = both continue
- Top 2 advance

## Running
```bash
bun run src/cli.ts run https://figma.com/file/xxx --description "Invoice creation flow"
bun run src/cli.ts list
bun run src/cli.ts status <run-id>
bun run src/cli.ts report <run-id>
```

## Next Steps
- Replace MCP stubs with real Figma MCP calls
- Replace synthetic feedback with LLM-powered persona evaluation
- Bring in real Xero persona data
- Add Glean integration for internal research
