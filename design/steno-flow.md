# Steno Flow: Interactive Visualization for Vibe Coding

> *"The waiting is the experience, not a gap between experiences."*

## Problem Statement

Vibe coding with AI assistants has an inherent async problem: you type a command, hit enter, and wait. This "dead time" breaks flow state and creates boredom. The gap between intent and result feels disconnected.

## Inspiration: Strudel

[Strudel](https://strudel.cc/) is a live coding music environment that solves a similar problem for algorithmic composition. Key insights:

| Strudel Concept | Steno-Graph Parallel |
|-----------------|---------------------|
| Mini-notation (`note("c e g b")`) | Terse grammar (`dx:@file.csv`) |
| Cycles subdivide time | Sessions subdivide work |
| Pianoroll visualization | Command roll |
| Spiral view (cycles wrap) | Session graph |
| Oscilloscope (audio output) | Diff scope (code changes) |
| Active element highlighting | File activity pulse |

The key insight: **Strudel makes time visible and interesting**. The visualization IS the interface. You're never "waiting"—you're surfing a cycle.

## Design Principles

### 1. Continuous Visual Feedback
Instead of a spinner, show what's happening:
- Files being read pulse with activity
- The command stream scrolls like a pianoroll
- A waveform shows the "texture" of code changes

### 2. Position in the Stream
You're always somewhere in a continuous flow:
- Past commands scroll left (history)
- Current command at the playhead (now)
- Predicted/queued commands scroll right (future)

### 3. Semantic Color
Verbs have consistent colors throughout:
- `dx` (diagnose) — blue
- `mk` (make) — green
- `ch` (change) — yellow/amber
- `viz` (visualize) — purple
- `fnd` (find) — cyan
- `rm` (remove) — red
- `steno` (meta) — magenta

### 4. Layered Detail
- Glanceable: verb + node ID
- Hover: full command + inputs/outputs
- Click: deep link to transcript

## Current Prototype

**Location**: `.steno/flow.html`

### Components

```
┌─────────────────────────────────────────────────────────┐
│  HEADER: steno flow    [running]  [theme]               │
├─────────────────────────────────────────────────────────┤
│  BRANCH BAR: main [active]           5 nodes 2 branches │
├─────────────────────────────────────────────────────────┤
│  COMMAND ROLL                                  15:38:54 │
│  ┌─────────────────────────────────────────────────────┐│
│  │  [n_001]  [n_002]  [n_003] ▌[n_004]  [n_005]       ││
│  │    dx      viz      ch    NOW  ch     steno        ││
│  └─────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────┤
│  FILE ACTIVITY: [samples.csv] [heatmap.png]             │
├─────────────────────────────────────────────────────────┤
│  DIFF SCOPE: ∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿  changes/sec       │
├─────────────────────────────────────────────────────────┤
│  SESSION GRAPH                                          │
│  ○ n_001 dx @samples.csv                                │
│  │                                                      │
│  ○ n_002 viz heatmap ^                                  │
│  │                                                      │
│  ○ n_003 ch ^ +cluster                                  │
│  │                                                      │
│  ├─┬─ experiment (merged)                               │
│  │ └─ n_004 ch ^ +pca                                   │
│  │                                                      │
│  ● n_005 steno transcript +gen                          │
├─────────────────────────────────────────────────────────┤
│  [Simulate] [◀] [▶]                  polling: off [Watch]│
└─────────────────────────────────────────────────────────┘
```

### Features Implemented

| Feature | Description |
|---------|-------------|
| Command Roll | Horizontal scrolling timeline with playhead |
| Verb Colors | Semantic coloring per verb type |
| Node Details | Hover popover with full command + I/O |
| File Activity | Chips showing files being read/written |
| Diff Scope | Canvas waveform (simulated for now) |
| Session Graph | ASCII tree with branches, clickable nodes |
| Watch Mode | Polls `graph.json` every 2s for live updates |
| Keyboard Nav | `←` `→` navigate, `Space` simulate, `W` watch, `T` theme |
| Theme Support | Light/dark mode with system preference detection |

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `←` `→` | Navigate nodes |
| `Space` | Toggle simulation |
| `W` | Toggle watch mode |
| `T` | Toggle theme |

## Future Directions

### Near-term

1. **Real file watching** — Use `fs.watch` events instead of polling
2. **Claude Code integration** — Hook into tool events if possible
3. **Sound cues** — Optional ambient audio feedback (not music-from-code, but subtle ticks/tones)
4. **Predicted commands** — Show likely next commands based on patterns/templates

### Medium-term

1. **True spiral visualization** — Canvas/SVG spiral where cycles wrap vertically
2. **Diff oscilloscope** — Real-time visualization of actual code diffs
3. **Branch comparison** — Side-by-side branch visualization
4. **Session timeline** — Multiple sessions as stacked pianorolls

### Long-term (Integration with Strudel concepts)

1. **Pattern detection** — Recognize rhythms in command sequences
2. **Command loops** — Visual representation of replay/template cycles
3. **Workflow composition** — Combine patterns like Strudel combines sounds
4. **Multi-user visualization** — See collaborators' streams

## Technical Notes

### Data Flow

```
graph.json ──poll──> flow.html ──render──> DOM
                         │
                         └──> Canvas (diff scope)
```

### Watch Mode

Polls `./graph.json` every 2 seconds with cache-busting:
```javascript
fetch('./graph.json?' + Date.now())
```

### Theme Variables

Inherits from steno-transcript.css design system:
- `--primary`, `--accent`, `--muted`, etc.
- Verb-specific colors: `--verb-dx`, `--verb-mk`, etc.
- State colors: `--node-complete`, `--node-active`, `--node-pending`

## Usage

### Quick Start (Real-Time Mode)

```bash
# Terminal 1: Start the flow server
.steno/start-flow.sh

# Terminal 2: Open the visualization
open .steno/flow.html

# Terminal 3: Use Claude Code normally
claude
```

The visualization will show real-time file activity as Claude works.

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Claude Code        Hooks              Server         Browser   │
│  ┌───────┐         ┌──────┐          ┌──────┐       ┌────────┐ │
│  │ Read  │────────▶│ Pre  │───POST──▶│  WS  │──push▶│ flow   │ │
│  │ Write │         │ Post │          │ Srv  │       │ .html  │ │
│  │ Edit  │────────▶│ Stop │───POST──▶│ :3847│──push▶│        │ │
│  └───────┘         └──────┘          └──────┘       └────────┘ │
│                                                                 │
│  Hooks fire on every tool use, server relays via WebSocket     │
└─────────────────────────────────────────────────────────────────┘
```

### Components

| File | Purpose |
|------|---------|
| `.claude/settings.json` | Hook configuration |
| `.claude/hooks/flow-pre.sh` | PreToolUse hook |
| `.claude/hooks/flow-post.sh` | PostToolUse hook |
| `.claude/hooks/flow-stop.sh` | Stop hook |
| `.steno/flow-server.cjs` | WebSocket relay server |
| `.steno/flow.html` | Browser visualization |
| `.steno/start-flow.sh` | Convenience start script |

### How It Works

1. **Hooks** fire on every tool use (Read, Write, Edit, Bash, etc.)
2. Each hook extracts `tool_name` and `target` from the JSON payload
3. Hook POSTs to `http://localhost:3847/event`
4. **Server** broadcasts event to all connected WebSocket clients
5. **Browser** receives event and updates UI in real-time

### What You See

When Claude reads a file:
- File chip appears in "File Activity" section (blue, pulsing)
- Diff scope spikes
- Live status shows "read"

When Claude writes a file:
- File chip appears (green, pulsing)
- Diff scope spikes higher
- Live status shows "write" or "edit"

When Claude finishes responding:
- Stop hook fires
- Graph reloads to show any new nodes
- File chips fade out

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `←` `→` | Navigate nodes |
| `Space` | Toggle simulation mode |
| `C` | Toggle WebSocket connection |
| `T` | Toggle theme |

### Fallback Mode

If the server isn't running, flow.html falls back to:
- Polling `graph.json` manually
- Simulation mode for demos

### Potential CLI Integration

Future: Add to steno skill as `steno:flow`:
```
steno:flow +start    # Start server + open visualization
steno:flow +stop     # Stop server
steno:flow .theme:midnight
```

## References

- [Strudel REPL](https://strudel.cc/)
- [Strudel Visual Feedback](https://strudel.cc/learn/visual-feedback/)
- [TidalCycles](https://tidalcycles.org/) (Strudel's parent project)
- [Live Coding](https://toplap.org/) (broader movement)

## Changelog

### v0.1.0 (2024-12-28)
- Initial prototype with command roll, file activity, diff scope
- Verb coloring, node details, session graph
- Watch mode for live updates
- Keyboard navigation
- Light/dark theme support
