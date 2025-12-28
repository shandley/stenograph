# Archive

Historical code from the parser-based approach.

## Why Archived

These components assumed steno-graph would be a **parser library** that preprocesses input before Claude sees it.

We discovered that Claude can learn the grammar via a **skill** and parse/execute directly — no preprocessing needed.

## Contents

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

Otherwise, use `.claude/skills/steno/` for Claude Code integration.
