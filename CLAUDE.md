# Steno-Graph

A stenographic grammar for efficient human-AI coding collaboration.

## Vision

> *"Structure in, intelligence where needed."*

Court stenographers capture complex proceedings at 225+ WPM using compressed, structured input. Steno-graph brings this efficiency to AI coding — fewer keystrokes, maximum precision, direct execution.

The goal is **flow state**, not interrupt-driven batch processing.

## Architecture: Skill-First

**Key insight**: Claude can learn the grammar via a skill and parse/execute directly. No preprocessing, no daemon, no separate parser needed.

```
You type:     dx:@samples.csv
     ↓
Claude recognizes the pattern (via skill)
     ↓
Executes directly, returns results
```

### Source of Truth

`.claude/skills/steno/SKILL.md` — The complete grammar, session tracking, and branching behavior.

### Project Structure

```
steno-graph/
├── .claude/skills/steno/   # THE SKILL - source of truth
├── .steno/                 # Session graph (created on use)
├── spec/                   # Grammar reference (TypeScript)
├── examples/               # Usage vignettes
├── design/                 # Active design docs
│   └── future-analytics.md # ggterm integration ideas
├── archive/                # Historical approaches
├── CHEATSHEET.md           # Quick reference
└── README.md               # User-facing docs
```

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

**Fix**: Explicitly list branching verbs in skill description and trigger patterns:
```markdown
description: ...Triggers on verb-colon-target patterns (dx, mk, ch, viz, stat, fork, switch, compare, merge, abandon)...

**Trigger patterns:**
- fork:name - create branch
- switch:name - switch branch
- compare:branch-a branch-b - compare branches
- merge:branch - adopt branch
- abandon:branch - discard branch
```

### 3. Track-Only Branching

Branches track commands and metadata, not file states. Files stay as-is when switching branches. Use git for file state management if needed.

### 4. Session Graph Structure

```
.steno/
├── graph.json           # All sessions, bookmarks, branches
└── current-session.json # Active session (git-ignored)
```

Nodes track: id, timestamp, raw command, status, inputs, outputs, summary, branch.

## Grammar Quick Reference

```
[mode][verb]:[target] [@refs] [+add] [-exclude] [.flag] [precision]
```

**Core verbs**: dx, mk, ch, rm, fnd, viz, stat, ts, doc
**Branching**: fork, switch, compare, merge, abandon
**Session**: steno:history, steno:stale, steno:refresh, steno:bookmark, steno:graph

See `CHEATSHEET.md` for complete reference.

## Future Considerations

### ggterm Integration (design/future-analytics.md)

The session graph could power advanced visualizations:
- `steno:timeline` — Command timeline
- `steno:stats` — Workflow analytics
- `steno:flow` — Dependency network

Low priority — current tooling covers primary use cases.

### Semantic Terminal (archived)

The `archive/design/claude-code-terminal.md` explores a purpose-built Claude Code interface with semantic blocks instead of ANSI parsing. Separate project idea, not part of steno-graph.

## Testing Workflow

After skill changes, test in fresh Claude Code session:
```bash
claude --dangerously-skip-permissions
```

Test core commands:
```
dx:@examples/vignette/samples.csv
steno:history
steno:graph
fork:test
switch:main
compare:main test
```

## Key Files

| File | Purpose |
|------|---------|
| `.claude/skills/steno/SKILL.md` | Grammar + behavior (edit here) |
| `CHEATSHEET.md` | User quick reference |
| `README.md` | User-facing documentation |
| `.steno/graph.json` | Session state |
