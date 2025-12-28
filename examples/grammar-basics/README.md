# Steno-Graph Grammar Basics

This vignette demonstrates the core steno-graph grammar and workflow tracking features.

## What Steno-Graph Is

Steno-graph is a **terse grammar** for human-AI interaction. It provides:

1. **Structured commands** - Unambiguous, parseable input
2. **Workflow tracking** - Session history, branching, bookmarks
3. **Chaining** - Reference previous outputs with `^`

It is **not** an execution engine. Claude interprets commands and uses its available tools.

## The Grammar

### Pattern
```
[mode][verb]:[target] [@refs] [+add] [-exclude] [.flag] [precision]
```

### Core Verbs

| Verb | Action | Example |
|------|--------|---------|
| `dx` | Diagnose/explore | `dx:@app.ts` |
| `mk` | Make/create | `mk:component +auth` |
| `ch` | Change/modify | `ch:@config.json +logging` |
| `rm` | Remove/delete | `rm:@deprecated/` |
| `fnd` | Find/search | `fnd:TODO` |
| `ts` | Test | `ts:@utils.test.js` |
| `doc` | Document | `doc:@api/` |

### Modifiers

| Syntax | Meaning | Example |
|--------|---------|---------|
| `@file` | File reference | `dx:@src/app.ts` |
| `^` | Previous output | `ch:^ +refactor` |
| `+feat` | Add/include | `mk:api +auth +cache` |
| `-thing` | Exclude | `ch:@config -secrets` |
| `.flag` | Apply flag | `mk:component .tsx` |

### Precision Markers

| Marker | Meaning | Example |
|--------|---------|---------|
| `~` | Flexible | `ch:@code.py ~` |
| `!` | Exact/literal | `ch:@code.py !` |
| `?` | Ask first | `rm:@legacy?` |
| `~deep` | Extended thinking | `dx:@codebase ~deep` |

### Modes

| Mode | Effect | Example |
|------|--------|---------|
| `?plan` | Outline first | `?plan refactor-auth` |
| `?sketch` | Rough draft | `?sketch new-feature` |
| `?challenge` | Critique | `?challenge current-approach` |

---

## Workflow Tracking

Steno-graph tracks commands in `.steno/` for session continuity.

### Session Commands

```bash
steno:history          # Show command history
steno:status           # Current session info
steno:graph            # ASCII workflow tree
steno:bookmark <name>  # Save reference point
steno:stale            # Check for stale outputs
steno:refresh          # Re-run stale commands
```

### Example Session

```
> dx:@src/app.ts

Analyzing app.ts...
Express application, 3 routes, uses middleware pattern.

> ch:^ +error-handling

Adding error handling to app.ts...
Added try-catch wrappers, error middleware, logging.

> steno:bookmark baseline

Bookmarked n_002 as "baseline"

> steno:history

Session Dec 28 (current):
  n_002: ch:^ +error-handling → app.ts modified
  n_001: dx:@src/app.ts → analysis complete
```

---

## Branching

Explore alternatives without losing work:

```bash
fork:experiment        # Create branch
switch:main            # Return to main
compare:main experiment # See differences
merge:experiment       # Adopt the work
abandon:experiment     # Discard it
```

### Example Workflow

```
> dx:@api.ts

Analyzing api.ts...

> fork:try-graphql

Created branch "try-graphql" from n_001

> ch:@api.ts +graphql

Converting REST to GraphQL...

> switch:main

Switched to branch "main"

> fork:try-grpc

Created branch "try-grpc" from n_001

> ch:@api.ts +grpc

Converting REST to gRPC...

> compare:try-graphql try-grpc

Branch "try-graphql":
  n_002: ch:@api.ts +graphql → Added schema, resolvers

Branch "try-grpc":
  n_003: ch:@api.ts +grpc → Added proto definitions, services

> merge:try-graphql

Merged "try-graphql" into main.
```

---

## Chaining with `^`

The `^` reference points to the previous command's output:

```
> dx:@data.json           # Explore data
> ch:^ +validate          # Validate what we just looked at
> ch:^ +transform         # Transform the validated data
> mk:processor.ts ^       # Create processor using the data
```

Each `^` automatically resolves to the previous node's outputs.

---

## Cross-Branch References

Reference outputs from other branches:

```
> stat:compare @main:^ @experiment:^    # Compare branch outputs
> ch:@feature-branch:n_003 +integrate   # Use specific node from branch
```

---

## Export & Import

Share workflows with others:

```bash
steno:export              # Export as markdown
steno:export .json        # Export for import
steno:export .sh          # Export as script
steno:import! file.json   # Import workflow
```

---

## Before & After

**Before** (natural language):
```
"Can you look at app.ts and add error handling? Also add
logging for errors. Make sure to wrap async functions."
```

**After** (steno):
```
ch:@app.ts +error-handling +logging
```

Same result, fewer keystrokes, direct execution.

---

## Power Commands

Steno-graph includes advanced features for productivity.

### Aliases

Create shortcuts for common command patterns:

```
> steno:alias setup "dx:@package.json && ch:@tsconfig.json +strict"

Alias "setup" created.

> setup

Running alias "setup"...
  → dx:@package.json
  → ch:@tsconfig.json +strict
```

**Parameterized aliases:**

```
> steno:alias explore "dx:@{1} ~deep"

> explore src/api.ts

Running: dx:@src/api.ts ~deep
```

### Templates

Reusable multi-step workflows:

```
> steno:template

Built-in templates:
  react-component  - Create React component with tests
  api-endpoint     - Create REST endpoint with validation
  refactor         - Safe refactoring workflow
  test-suite       - Test file with setup

> steno:template react-component Button

Running template "react-component"...
  Step 1/4: mk:components/Button.tsx +functional → OK
  Step 2/4: mk:components/Button.test.tsx +jest → OK
  ...
```

### Search & Replay

Find and re-run past commands:

```
> steno:search +validation

Found 3 matches:
  n_012: ch:@auth.ts +validation (Dec 27)
  n_008: ch:@api.py +validation (Dec 26)
  ...

> steno:replay n_008..n_012

Replaying 5 commands...
```

### Diff

Compare workflow states:

```
> steno:diff @baseline ^

Comparing bookmark "baseline" (n_004) → current (n_012)

Changes since baseline:
  8 commands executed
  3 files created
  2 files modified
```

---

## Key Principles

1. **Terse input** - Minimum keystrokes for maximum clarity
2. **Direct execution** - Claude acts immediately on clear commands
3. **Workflow memory** - Session tracking enables chaining and branching
4. **Tool-agnostic** - Works with whatever tools Claude has available

Steno-graph is about **how you communicate with Claude**, not about what Claude can do.
