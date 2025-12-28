# Steno-Graph

A stenographic grammar for efficient human-AI coding collaboration.

## Vision

> *"Structure in, intelligence where needed."*

Court stenographers capture complex proceedings at 225+ WPM using compressed, structured input. Steno-graph brings this efficiency to AI coding — fewer keystrokes, maximum precision, direct execution.

The goal is **flow state**, not interrupt-driven batch processing.

## What Steno-Graph Is (and Isn't)

**Steno-graph IS:**
- A terse grammar for expressing intent to Claude
- A workflow tracking system with branching and bookmarks
- Domain-agnostic (works for any coding task)
- A skill that Claude learns and interprets

**Steno-graph IS NOT:**
- An execution engine or computational backend
- A replacement for actual tools (R, Python, etc.)
- A guarantor of computational correctness

Claude interprets steno commands using its available tools. The quality of execution depends on what Claude can actually do, not on steno-graph itself.

## Architecture: Skill-First

**Key insight**: Claude can learn the grammar via a skill and parse/execute directly. No preprocessing, no daemon, no separate parser needed.

```
You type:     dx:@app.ts
     ↓
Claude recognizes the pattern (via skill)
     ↓
Executes using available tools, returns results
```

### Source of Truth

`.claude/skills/steno/SKILL.md` — The complete grammar, session tracking, and branching behavior.

### Project Structure

```
steno-graph/
├── .claude/skills/steno/   # THE SKILL - source of truth
├── .steno/                 # Session graph (created on use)
├── examples/               # Usage vignettes
│   ├── grammar-basics/     # Core grammar demonstration
│   └── webdev-api/         # Web development workflow
├── design/                 # Active design docs
│   ├── biostack-integration.md  # Backend integration design
│   └── future-analytics.md      # ggterm ideas
├── archive/                # Historical approaches
├── CHEATSHEET.md           # Quick reference
└── README.md               # User-facing docs
```

## Features

### Core Grammar
- 9 verbs: dx, mk, ch, rm, fnd, viz, stat, ts, doc
- Modifiers: @file, ^, +add, -exclude, .flag
- Precision: ~ (flexible), ! (exact), ? (ask), ~deep
- Modes: ?plan, ?sketch, ?challenge, ?explore

### Session Tracking
- Command history with `.steno/graph.json`
- Stale detection and refresh
- Bookmarks for reference points
- ASCII graph visualization

### Branching
- fork/switch/compare/merge/abandon
- Explore alternatives without losing work
- Lightweight (metadata-only, not file state)

### Advanced Features
- Cross-branch references: `@branch:^`, `@branch:n_001`
- Undo/redo: `steno:undo`, `steno:redo`
- Export/import: `steno:export`, `steno:import`

### Power Commands (v1.1+)
- Aliases: `steno:alias name "cmd"` (with `{param}` support)
- Search: `steno:search pattern` (by verb, modifier, file)
- Replay: `steno:replay n_001..n_005`
- Templates: `steno:template react-component Button`
- Diff: `steno:diff @baseline ^`

## Development Lessons

### 1. Skill Description Parsing

**Problem**: Backticks in skill description tables cause bash parsing errors.

**Fix**: Use plain text in tables, not `code` formatting.
```markdown
# Bad - causes "Bash command failed"
| `!` | Exact |

# Good
| ! | Exact |
```

### 2. Branching Commands Need Explicit Triggers

**Problem**: `compare:main experiment` was interpreted as git command.

**Fix**: Explicitly list branching verbs in skill description and trigger patterns.

### 3. Track-Only Branching

Branches track commands and metadata, not file states. Files stay as-is when switching branches. Use git for file state management if needed.

### 4. Execution Reality

Steno-graph is a grammar, not an execution engine. If Claude doesn't have access to a tool (e.g., a statistical package), it will interpret the command using its training knowledge, not execute the actual algorithm. This is a Claude limitation, not a steno-graph limitation.

## Grammar Quick Reference

```
[mode][verb]:[target] [@refs] [+add] [-exclude] [.flag] [precision]
```

**Core verbs**: dx, mk, ch, rm, fnd, viz, stat, ts, doc
**Branching**: fork, switch, compare, merge, abandon
**Session**: steno:history, steno:graph, steno:bookmark, steno:undo, steno:redo, steno:export, steno:import
**Power**: steno:alias, steno:search, steno:replay, steno:template, steno:diff

See `CHEATSHEET.md` for complete reference.

## Future Considerations

### Backend Integration (design/biostack-integration.md)

For domain-specific validated computation, steno-graph can integrate with execution backends like biostack. The design supports:
- Backend detection and routing
- Command translation
- Provenance linking
- Two-tier branching (lightweight vs. computational)

### ggterm Integration (design/future-analytics.md)

The session graph could power advanced visualizations:
- `steno:timeline` — Command timeline
- `steno:stats` — Workflow analytics
- `steno:flow` — Dependency network

## Testing Workflow

After skill changes, test in fresh Claude Code session:
```bash
claude --dangerously-skip-permissions
```

Test core commands:
```
dx:@examples/grammar-basics/README.md
steno:history
steno:graph
fork:test
switch:main
compare:main test
steno:undo
steno:export
```

Test power commands:
```
steno:alias greet "dx:@{1}"
greet README.md
steno:search dx
steno:replay n_001
steno:template
steno:diff n_001 n_002
```

## Key Files

| File | Purpose |
|------|---------|
| `.claude/skills/steno/SKILL.md` | Grammar + behavior (edit here) |
| `CHEATSHEET.md` | User quick reference |
| `README.md` | User-facing documentation |
| `.steno/graph.json` | Session state |
| `design/biostack-integration.md` | Backend integration design |
