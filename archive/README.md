# Archive

Historical code and designs from earlier approaches.

## Why Archived

These components assumed steno-graph would be a **parser library** or **daemon system** that preprocesses input before Claude sees it.

We discovered that Claude can learn the grammar via a **skill** and parse/execute directly — no preprocessing needed. This is the **skill-first architecture**.

## Contents

### design/
Historical design documents:
- `vision-v1-graph.md` — Original grand vision (daemon, Strudel, parallel execution)
- `vision-v2-parser.md` — Parser library approach
- `claude-code-terminal.md` — Semantic terminal concept (separate idea)
- `session-graph.md` — Session tracking design (now implemented in SKILL.md)
- `skill-update-sketch.md` — Skill update sketch (implemented)
- `branching.md` — Branching feature design (implemented)

### mapper/
Intent → primitive routing system. Claude handles this now.

### daemon/
Generic daemon integration patterns (file, WebSocket, HTTP clients).
Assumed parser-based preprocessing.

### biostack/
Bioforge primitive registry (46 primitives).
Claude doesn't need a predefined registry — it generalizes.

### react/
React components (StenoInput, ClarificationDialog).
Could be adapted for skill-based approach if needed.

### extensions/
Sample domain extension (datascience).
The skill approach doesn't need formal extensions.

### primitives/
Sample primitive definitions.
Claude infers primitives from context.

## Potential Future Use

If you need:
- **Offline parsing** — The spec/ grammar works without Claude
- **Type validation** — The types are still useful
- **Non-Claude integration** — The mapper could power other systems
- **Historical context** — The design/ docs show evolution of thinking

Otherwise, use `.claude/skills/steno/` for Claude Code integration.
