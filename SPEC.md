# Starling — Design Orchestrator

## What It Is
A CLI tool that automates iterative design exploration. You point it at a feature, it runs autonomously — researching, generating design variations in Figma, getting synthetic user feedback, iterating, and converging on the strongest direction. You come back to a Figma file with the full evolution trail and a final report.

## Tech Stack
- **Bun + TypeScript**
- **Figma MCP** for creating/modifying Figma designs
- **Glean MCP** for internal research
- **Web search** for competitive analysis
- **No Docker, no databases** — state lives in JSON/markdown files in runs/

## Core Flow

### Phase 1: Research
- Web search for competitive analysis (how do competitors handle this feature?)
- Glean MCP search for internal context (existing designs, specs, research)
- Compile a research brief (markdown)

### Phase 2: Diverge
- Generate **4 fundamentally different design directions** in Figma
- Each direction gets a name and a one-line thesis
- All 4 are created as frames in a single Figma page

### Phase 3: Feedback Round 1
- Synthetic user panel (5-7 personas) reviews all 4 directions
- Each persona gives: Score (1-100), 1-2 sentence reaction quote, specific likes/dislikes
- Average scores calculated
- Any direction scoring below 30 is culled immediately

### Phase 4: Iterate (per direction)
- Each surviving direction gets ~4 iterations
- Each iteration:
  - Apply feedback from previous round
  - Update the Figma frame (new version alongside old, not replacing)
  - Get fresh feedback from the same persistent personas
  - Track what changed and why
- Personas remember their previous opinions: "This is better than before because X, but I still want Y"

### Phase 5: Tournament
- Take the best iteration of each direction
- Compare head-to-head with the full panel
- Quality scoring determines what gets culled vs. continues
- Close scores (within 5 points) = both continue
- Clear losers (>15 point gap) = culled
- Top 2 advance

### Phase 6: Converge
- Top 2 directions get 2-3 more refinement rounds
- Panel provides increasingly specific feedback
- Continue until one clearly wins OR declare them tied with trade-offs explained

### Phase 7: Report
- Final Figma file layout:
  - Full evolution trail (all iterations visible, stacked vertically per direction)
  - Persona quotes alongside each iteration
  - Star callouts for beloved ideas that got dropped in evolution
  - Final winner(s) at the top
  - Summary section with key decisions and trade-offs
- Markdown report in runs/[run-id]/report.md

## Synthetic Users (Placeholder)
For now, generate believable archetypes:
- Sole trader (simple needs, hates complexity)
- Bookkeeper (power user, efficiency-focused)
- Small business owner (busy, wants clarity)
- Accountant (detail-oriented, compliance-aware)
- New user (confused by everything, needs guidance)
Later: Jon will bring real Xero persona data to replace these.

## State Management
Each run lives in runs/[run-id]/:
- config.json, research.md, directions/, tournament.md, report.md, personas.json, scores.json

## CLI
starling run <url> [--description "what this feature does"]
starling status [run-id]
starling report [run-id]
starling list

## MCP Integration
Starling calls MCP servers for Figma and Glean. Needs figma MCP configured, glean optional.

## Key Principles
- Fully autonomous — no human intervention after "go"
- Opinionated about quality — culls bad directions fast
- Transparent — every decision logged with reasoning
- Persistent personas — same users across all iterations
- Evolution over perfection — show the journey, not just the destination
