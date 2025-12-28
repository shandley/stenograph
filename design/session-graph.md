# Session Graph: Minimal Design

## Overview

A lightweight graph that tracks steno commands across sessions, enabling:
- Cross-session memory ("what did I do yesterday?")
- Dependency tracking ("what depends on this file?")
- Stale detection ("what needs re-running?")

No daemon. No parallel execution. Just persistent structure.

---

## Data Model

### Node (Intent + Execution)

```typescript
interface StenoNode {
  id: string;                    // "n_001", "n_002", etc.
  timestamp: string;             // ISO timestamp

  // The command
  raw: string;                   // "dx:@samples.csv"
  intent: {
    verb: string;                // "dx"
    target: string;              // "@samples.csv"
    additions: string[];         // ["+normalize"]
    flags: string[];             // [".plot:png"]
    precision: string;           // "flexible" | "exact" | "clarify"
    mode?: string;               // "plan" | "sketch" | "challenge"
  };

  // Execution tracking
  status: "pending" | "running" | "complete" | "failed";

  // File I/O (populated after execution)
  inputs: FileRef[];             // Files read
  outputs: FileRef[];            // Files written/created

  // Relationships
  parent?: string;               // Previous node ID (for ^ references)
  children: string[];            // Nodes that depend on this one

  // Result summary
  summary?: string;              // Brief description of what happened
}

interface FileRef {
  path: string;                  // "examples/vignette/samples.csv"
  hash: string;                  // MD5 of file at execution time
  mtime: number;                 // Modification time at execution
}
```

### Session

```typescript
interface StenoSession {
  id: string;                    // "sess_20241227_143022"
  created: string;               // ISO timestamp
  project: string;               // Working directory
  nodes: StenoNode[];            // Ordered list of nodes

  // Quick lookups
  fileIndex: {                   // Which nodes touch which files
    [filePath: string]: {
      readers: string[];         // Node IDs that read this file
      writers: string[];         // Node IDs that wrote this file
    }
  };
}
```

### Graph (Multiple Sessions)

```typescript
interface StenoGraph {
  version: "1.0";
  project: string;
  sessions: StenoSession[];

  // Named references that persist across sessions
  bookmarks: {
    [name: string]: string;      // "last-pca" → "n_042"
  };
}
```

---

## Storage

```
project/
├── .steno/
│   ├── graph.json              # The graph
│   ├── current-session.json    # Active session (written frequently)
│   └── file-hashes.json        # Cached file hashes for stale detection
```

**Why not SQLite?** JSON is simpler, human-readable, and sufficient for <1000 nodes. Can migrate later if needed.

---

## Operations

### 1. Session Start

When Claude Code starts in a steno-enabled project:

```
> Steno session loaded
> Last session: Dec 26, 2024 (3 nodes)
>   dx:@samples.csv → 18 samples, 5 genes
>   ch:^ +normalize → normalized.csv
>   viz:pca ^ → pca_plot.png
>
> Continue or start fresh? [C/f]
```

### 2. Command Execution

When user types a steno command:

```
dx:@samples.csv
```

1. Parse intent (existing skill does this)
2. Create node with status "running"
3. Execute (Claude does the work)
4. Update node:
   - status → "complete"
   - inputs → files Claude read
   - outputs → files Claude created/modified
   - summary → brief description
5. Persist to current-session.json

### 3. Stale Detection

On session start, or when user asks:

```
steno:stale
```

1. For each output file in the graph:
   - Check if any input file has changed (mtime or hash)
   - If changed, mark node as "stale"
2. Propagate staleness to children
3. Report:

```
> Stale nodes detected:
>   n_015: viz:pca @normalized.csv
>          ↳ input changed: normalized.csv
>   n_016: doc:@pca_results
>          ↳ depends on stale: n_015
>
> Refresh? [Y/n]
```

### 4. History Query

```
steno:history
```

```
> Session Dec 27 (current):
>   n_018: dx:@new_samples.csv (complete)
>   n_019: ch:^ +qc (complete)
>
> Session Dec 26:
>   n_015: viz:pca @normalized.csv (stale)
>   n_014: ch:@samples.csv +normalize (complete)
>   n_013: dx:@samples.csv (complete)
```

### 5. Reference Previous

The `^` syntax now has persistent meaning:

```
ch:^ +filter    # Modify output of last command
viz:pca ^       # Visualize output of last command
@n_015          # Reference specific node by ID
@last-pca       # Reference bookmarked node
```

### 6. Bookmarking

```
steno:bookmark last-pca
```

Saves current node as "last-pca" for cross-session reference.

---

## Skill Integration

Update the skill to:

1. **Log commands**: After executing, append to session
2. **Track I/O**: Note which files were read/written
3. **Check stale**: On startup, report stale nodes
4. **Resolve references**: `^` and `@name` look up the graph

### Updated Skill Excerpt

```markdown
## Session Tracking

When executing steno commands:

1. Check `.steno/current-session.json` for context
2. After execution, append a node:
   - Record inputs (files you read)
   - Record outputs (files you created/modified)
   - Write brief summary
3. If `^` is used, resolve from previous node's outputs

## Stale Detection

On session start:
1. Read `.steno/graph.json`
2. Check if any input files have changed since last execution
3. Report stale nodes to user

## Special Commands

| Command | Action |
|---------|--------|
| `steno:history` | Show recent command history |
| `steno:stale` | Check for stale outputs |
| `steno:bookmark <name>` | Save current node as named reference |
| `steno:resume` | Continue from last session |
```

---

## Example Session

### Day 1: Initial Analysis

```
$ claude

> No steno session found. Starting fresh.

> dx:@samples.csv

Analyzing samples.csv...
18 samples, 5 genes, 2 conditions.

> [Node n_001 saved: inputs=[samples.csv], outputs=[], summary="18 samples, 5 genes"]

> ch:^ +normalize

Normalizing expression values using TMM...
Created: normalized_samples.csv

> [Node n_002 saved: inputs=[samples.csv], outputs=[normalized_samples.csv]]

> viz:pca ^

Generating PCA plot...
Created: pca_plot.png

> [Node n_003 saved: inputs=[normalized_samples.csv], outputs=[pca_plot.png]]

> steno:bookmark baseline-pca

> Bookmarked n_003 as "baseline-pca"
```

### Day 2: Data Updated

```
$ claude

> Steno session loaded (Dec 26, 3 nodes)
>
> ⚠️  Stale detected:
>   samples.csv modified since last run
>   Affected: n_001 → n_002 → n_003
>
> Refresh all? [Y/n]

> y

Re-running n_001: dx:@samples.csv...
20 samples now (2 added).

Re-running n_002: ch:^ +normalize...
Updated normalized_samples.csv

Re-running n_003: viz:pca ^...
Updated pca_plot.png

> All nodes refreshed.
```

### Day 2: Continue Analysis

```
> stat:ttest @baseline-pca @new-treatment

Comparing baseline (bookmark) to new treatment group...
```

---

## Implementation Phases

### Phase 1: Logging (Immediate Value)
- Append nodes to `.steno/current-session.json`
- Show history on `steno:history`
- ~50 lines added to skill

### Phase 2: Stale Detection (High Value)
- Hash input files on execution
- Check hashes on session start
- Report stale nodes
- ~100 lines

### Phase 3: References (Polish)
- Resolve `^` from graph
- Resolve `@name` bookmarks
- ~50 lines

### Phase 4: Refresh (Automation)
- Re-run stale nodes in dependency order
- ~100 lines

---

## File Tracking Challenge

**Problem**: How does Claude know which files it read/wrote?

**Options**:

1. **Explicit in command**: `dx:@samples.csv` → input is samples.csv
2. **Claude reports**: Ask Claude to list files touched
3. **File system watching**: Monitor .steno/watched/ directory
4. **Git diff**: Compare before/after

**Recommendation**: Start with (1) + (2). The steno command usually specifies inputs. Ask Claude to report outputs in a structured way.

```markdown
## Reporting I/O

After executing a steno command, report files:

> **Inputs**: samples.csv, metadata.csv
> **Outputs**: normalized_samples.csv (created)
> **Summary**: Normalized 18 samples using TMM method
```

This structured output can be parsed and stored.

---

## What This Enables

| Capability | How |
|------------|-----|
| "What did I do yesterday?" | `steno:history` |
| "What needs re-running?" | `steno:stale` |
| "Use that PCA from last week" | `@baseline-pca` |
| "Modify the last output" | `ch:^ +filter` |
| "What depends on this file?" | Traced from fileIndex |

## What This Doesn't Do (Yet)

| Capability | Why Not |
|------------|---------|
| Parallel execution | Needs Claude headless + worker pool |
| Branching/forking | Adds complexity, defer until needed |
| Automatic refresh | Need confidence in re-execution |
| Strudel sonification | Fun but not essential |

---

## Decision Point

This design adds ~300 lines to make the graph useful.

**Option A**: Implement in the skill (Claude manages the graph)
- Pro: No external dependencies
- Con: Claude has to remember to log

**Option B**: Implement as a hook (intercepts all commands)
- Pro: Automatic logging
- Con: More infrastructure

**Option C**: Implement as a separate CLI tool
- Pro: Clean separation
- Con: Another thing to run

**Recommendation**: Start with Option A (skill-based). If logging becomes unreliable, migrate to Option B.
