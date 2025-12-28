# Stenographic Graph Coding System

## A New Paradigm for Human-AI Coding Collaboration

### Origin

The old Unix wisdom was "if you're typing, you're doing it wrong" — referring to history, tab completion, aliases. With AI coding tools, this inverted: verbosity became necessary for precision. More keystrokes, more context, better results.

But this isn't fundamental. Court stenography proved that **compressed input with full expressiveness** is achievable. Stenographers capture complex legal proceedings — nuanced, technical, adversarial — at 225+ WPM with 98% accuracy using a compositional system that scales from "yes" to expert testimony.

The insight: **stenographic input isn't about speed alone. It's about creating structured capture that enables everything downstream.**

---

## Core Concept

**Stenographic input** creates **graph nodes**, not chat messages.

A **daemon** runs **Claude Code headless** against the graph.

You **manipulate the graph in real-time** while Claude executes asynchronously.

**Strudel-style visualization and sonification** makes the process inhabitable, not interruptible.

```
┌────────────────┐      ┌────────────────┐      ┌────────────────┐
│   You type     │ ───▶ │  Graph node    │ ───▶ │ Claude worker  │
│   mk:ttt .web  │      │  created       │      │ executes async │
└────────────────┘      └────────────────┘      └────────────────┘
                               │                        │
                               ▼                        ▼
                        ┌────────────────┐      ┌────────────────┐
                        │ You keep       │ ◀─── │ Results link   │
                        │ working        │      │ back to graph  │
                        └────────────────┘      └────────────────┘
```

---

## The Stenographic Grammar

### Core Syntax

```
[verb]:[target] [modifiers] [precision] [context]
```

### Verbs

| Token | Meaning |
|-------|---------|
| `mk` | Make / create |
| `ch` | Change / modify |
| `rm` | Remove / delete |
| `dx` | Diagnose / debug |
| `fnd` | Find / search |
| `ts` | Test |
| `doc` | Document |
| `fork` | Branch |
| `merge` | Join branches |
| `revert` | Return to prior state |

### Modifiers

| Token | Meaning |
|-------|---------|
| `+feature` | Add feature/aspect |
| `-thing` | Without / exclude |
| `.ts` | With tests |
| `.doc` | With documentation |
| `.dry` | Dry run, show don't execute |
| `.web` | Use web search |

### Precision Markers

| Token | Meaning |
|-------|---------|
| `~` | Flexible, use judgment |
| `!` | Literal, exact |
| `?` | Ask before acting |
| `~deep` | Extended thinking (ultrathink) |

### Context Anchors

| Token | Meaning |
|-------|---------|
| `^` | Previous output |
| `^N` | Nth item from last output |
| `^^` | Output before last |
| `@node` | Specific named node |
| `@file.py` | Specific file |
| `#symbol` | Specific symbol |

### Modes

| Token | Meaning |
|-------|---------|
| `?plan` | Exploratory, propose something |
| `?sketch` | Give concrete example |
| `?challenge` | Push back on idea |
| `~explore` | Thinking out loud |
| `~decide` | Need to narrow options |
| `~execute` | Decision made, do it |

---

## Examples

### Simple

**Natural language:**
```
"Build a simple tic-tac-toe game in Python"
```

**Stenographic:**
```
mk:ttt py
```

### Medium Complexity

**Natural language:**
```
"Refactor the login function to add rate limiting, 
add tests for edge cases, and do it like you did 
for the signup function"
```

**Stenographic:**
```
ch:login +rate-limit .ts:edge ^signup
```

### High Complexity

**Natural language:**
```
"I would like to build a fully functional SaaS website 
for grants management. What do you recommend as the full 
tech stack and what is the competition matrix. Use extended 
thinking and search the web."
```

**Stenographic:**
```
?plan saas/grants-mgmt .stack .competition ~deep +web
```

---

## The Graph

### Why a Graph?

Chat logs are linear and ephemeral. The graph provides:

1. **Persistent context** — Queryable structure, not scroll history
2. **Branching** — `fork:node` explores alternatives without losing original
3. **Backtracking** — `revert:node` returns to prior state
4. **Dependencies** — Nodes know what they depend on
5. **Parallel execution** — Independent branches run simultaneously
6. **Live modification** — Inject changes mid-stream
7. **Stale detection** — Changed inputs trigger downstream re-runs
8. **Cross-session continuity** — Resume anytime, everything persists

### Node Structure

```
Node: intent_001
  type: make
  target: game/ttt
  constraints: [web, simple]
  created: 2024-12-26T14:32
  status: complete
  output: [file:ttt.jsx, file:index.html]
  parent: null
  children: [intent_002, intent_003]
```

### Node States

```
pending   → Job queued
running   → Claude working  
blocked   → Waiting on dependencies
complete  → Output captured
failed    → Error, can retry
stale     → Dependency changed, needs re-run
```

### Graph Operations

```
> @node           Load/reference node
> fork:node       Create branch
> merge:a b       Join branches
> revert:node     Return to state
> fnd:type:fix    Query graph
> refresh:node    Re-run stale node
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND                               │
│                                                             │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│   │ Steno       │  │ Graph       │  │ Strudel     │        │
│   │ Parser      │  │ Viz/Canvas  │  │ Audio       │        │
│   └─────────────┘  └─────────────┘  └─────────────┘        │
│          │                │                │                │
│          └────────────────┴────────────────┘                │
│                           │                                 │
│                      WebSocket                              │
│                           │                                 │
└───────────────────────────┼─────────────────────────────────┘
                            │
┌───────────────────────────┼─────────────────────────────────┐
│                      DAEMON                                 │
│                           │                                 │
│   ┌─────────────┐  ┌──────┴──────┐  ┌─────────────┐        │
│   │ Job Queue   │  │ Graph DB    │  │ Notifier    │        │
│   │ (Redis)     │  │ (SQLite)    │  │ (WebSocket) │        │
│   └──────┬──────┘  └─────────────┘  └─────────────┘        │
│          │                                                  │
│   ┌──────┴──────┐                                          │
│   │ Worker Pool │                                          │
│   │             │                                          │
│   │ ┌─────────┐ │                                          │
│   │ │ Claude  │ │  claude --headless --output-format json  │
│   │ │ Headless│ │                                          │
│   │ └─────────┘ │                                          │
│   │ ┌─────────┐ │                                          │
│   │ │ Claude  │ │                                          │
│   │ │ Headless│ │                                          │
│   │ └─────────┘ │                                          │
│   └─────────────┘                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Daemon Responsibilities

1. Receive jobs from frontend
2. Decompose complex jobs into sub-jobs
3. Manage Claude Code headless workers
4. Capture structured output
5. Update graph with results
6. Push live updates via WebSocket
7. Handle dependencies and re-runs

### Frontend Responsibilities

1. Parse stenographic input
2. Create/manipulate graph nodes locally
3. Send jobs to daemon
4. Render live graph visualization
5. Sonify graph state via Strudel
6. Enable mid-stream injection

---

## Strudel Integration: Making Coding Musical

### The Insight

Strudel visualizations aren't decorative — they're functional feedback. You're never "waiting." You're experiencing the process. The graph is a score. Execution is performance.

### Graph → Sound Mapping

| Graph Event | Sound |
|-------------|-------|
| Node created | Soft attack, pitch = depth |
| Node running | Sustained tone, evolving timbre |
| Node complete | Resolve, consonant interval |
| Node failed | Dissonance, unresolved |
| Fork | Chord splits, parallel voices |
| Merge | Voices converge, harmony |
| You typing | Percussive, rhythmic |
| Idle | Ambient, breathing |

### Graph → Strudel Pattern

```javascript
// Completed nodes → melodic sequence
$: graph.nodes
    .filter(n => n.status === 'complete')
    .map(n => note(pitchFromDepth(n.depth)))
    .sequence()
    .s("piano")

// Running nodes → sustained pad
$: graph.nodes
    .filter(n => n.status === 'running')
    .map(n => note(pitchFromDepth(n.depth)).sustain())
    .s("pad")
    .lpf(sine.range(400, 2000).slow(4))

// Data flow → percussion
$: graph.edges
    .filter(e => e.dataFlowing)
    .map(() => "kick")
    .s("drum")
```

### What Coding Sounds Like

**Building up:**
```
> mk:api +auth +cache +rate-limit .ts

  ♩ ♪ ♪ ♩ ♪ ♪ ♩ ♪ ♪
  (nodes spawning, rising arpeggio)
```

**Parallel execution:**
```
> | tests | docs | lint

  ♩   ♩   ♩
  ♪   ♪   ♪
  ♫   ♫   ♫
  (three voices, polyphonic, converging)
```

**Error → Fix → Resolve:**
```
  ♯♭! → fix:^ → ♮ → ♩
  (dissonance, resolution, cadence)
```

---

## The Vibe Shift

### Current "Vibe Coding"

```
You:     [type prompt]
Claude:  [thinking...]
You:     [waiting]
         [context switch]
         [check email]
Claude:  [done]
You:     [context switch back]
         [re-read everything]
```

Interrupt-driven. Batch processing. No flow.

### Graph + Strudel Coding

```
You:     [type stenographic input]
Graph:   [node appears, pulses]
Sound:   [tone begins]
Claude:  [working...]
You:     [add another node]
Graph:   [structure grows]
Sound:   [harmony builds]
Claude:  [first result]
Graph:   [node resolves]
Sound:   [cadence]
You:     [already typing next operation]
```

Continuous. Alive. Inhabitable.

---

## Why This Works

1. **Claude handles fuzziness** — `ttt` → tic-tac-toe already works
2. **Graph handles structure** — Relationships, history, branching explicit
3. **Daemon handles latency** — You're never blocked waiting
4. **Stenography handles input** — Fewer keystrokes, same precision
5. **Strudel handles presence** — Continuous feedback, no dead time

---

## Build Path

| Week | Deliverable |
|------|-------------|
| 1 | SQLite graph store, single Claude worker, CLI parser |
| 2 | WebSocket updates, parallel workers, dependency tracking |
| 3 | Web frontend, graph visualization, live node injection |
| 4 | Strudel integration, sonification, personal briefs |

---

## The Forcing Function

Court stenography succeeded because of institutional lock-in: legal mandate, credentialing, salary premium, no alternative path.

For this system, the forcing function is simpler:

**"If you're typing, you're doing it wrong."**

Every keystroke is friction. Every ambiguous phrase causes wrong turns. The optimization target:

```
Total time = (keystrokes × typing_speed) 
           + (ambiguity × correction_cycles) 
           + (execution_time)
```

You can't control execution time (yet). But you can minimize keystrokes while minimizing ambiguity. Stenographic input to a persistent graph, with async execution and continuous audiovisual feedback.

Not prompt and wait.

**Conduct and compose.**

---

## Summary

Stenographic input creates graph nodes. A daemon runs Claude headless. You manipulate the graph while execution happens. Strudel makes it visible and audible. The result is flow state instead of interrupt-driven batch processing.

You're not waiting for the AI. You're playing the codebase.
