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
├── .claude/
│   ├── skills/steno/       # THE SKILL - source of truth
│   ├── hooks/              # Claude Code hooks for steno-flow
│   │   ├── flow-pre.sh     # Pre-tool event hook
│   │   ├── flow-post.sh    # Post-tool event hook
│   │   └── flow-stop.sh    # Command complete hook
│   └── settings.json       # Hook configuration
├── .steno/
│   ├── current-session.json  # Active session state
│   ├── flow-server.cjs       # WebSocket relay server
│   ├── flow.html             # Real-time visualization dashboard
│   └── start-flow.sh         # Server startup script
├── examples/               # Usage vignettes
├── design/                 # Active design docs
│   ├── steno-flow.md       # Real-time visualization design
│   └── biostack-integration.md
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
- Command history with `.steno/current-session.json`
- Stale detection and refresh
- Bookmarks for reference points
- ASCII graph visualization
- Real-time updates via steno-flow

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
- Transcripts: `steno:transcript +generate` / `+all` (integrates claude-code-transcripts)
- Rich export: `steno:export .html +transcript` (interactive HTML with search)
- Theming: `steno:transcript +theme` (shadcn-inspired, light/dark mode)

### Steno Flow (Real-time Visualization)

Inspired by Strudel REPL's live coding visualizations, steno-flow provides real-time feedback during Claude Code sessions. Instead of waiting passively, you can "surf" your coding session.

**Components:**
- **Command Roll**: Horizontal timeline of steno commands with verb-colored nodes
- **File Activity**: Shows files being read/written as animated chips with elapsed time
- **Diff Scope**: Oscilloscope-style waveform showing tool activity intensity
- **Session Graph**: ASCII tree of all nodes and branches
- **Session Stats**: Operations count, success rate, top files accessed (toggle with `S`)
- **Command Filter**: Filter nodes by verb type with colored buttons
- **Search**: Search commands by text, jump to matches (press `/`)
- **Error Log**: Collapsible panel showing errors with timestamps (toggle with `E`)
- **Audio Feedback**: Soft ambient tones for tool start/complete/error (toggle with `A`)

**Starting Steno Flow:**
```bash
# Terminal 1: Start the flow server
.steno/start-flow.sh

# Terminal 2: Open dashboard
open http://localhost:3847

# Terminal 3: Run Claude Code with hooks enabled
claude --dangerously-skip-permissions
```

**Architecture:**
```
Claude Code → Hooks (pre/post/stop) → HTTP POST → Flow Server → WebSocket → Browser
```

The hooks in `.claude/hooks/` fire on every tool use, sending events to the flow server on port 3847. The browser connects via WebSocket for real-time updates.

**Key Files:**
- `.claude/hooks/flow-*.sh` — Event capture hooks
- `.claude/settings.json` — Hook configuration
- `.steno/flow-server.cjs` — Node.js WebSocket relay
- `.steno/flow.html` — Dashboard UI

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
**Power**: steno:alias, steno:search, steno:replay, steno:template, steno:diff, steno:transcript

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
| `.claude/hooks/flow-*.sh` | Claude Code hooks for steno-flow |
| `.claude/settings.json` | Hook configuration |
| `.steno/current-session.json` | Active session state |
| `.steno/flow-server.cjs` | WebSocket relay server |
| `.steno/flow.html` | Real-time visualization dashboard |
| `CHEATSHEET.md` | User quick reference |
| `README.md` | User-facing documentation |
| `design/steno-flow.md` | Flow visualization design doc |
