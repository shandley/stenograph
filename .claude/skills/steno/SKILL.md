---
name: steno
description: Execute stenographic shorthand commands for efficient coding. Triggers on verb-colon-target patterns (dx, mk, ch, viz, stat, fork, switch, compare, merge, abandon) and steno-colon commands for session management. Branching commands (fork, switch, compare, merge, abandon) operate on .steno/graph.json, NOT git.
---

# Steno: Stenographic Command Interface

You understand and execute stenographic shorthand for efficient coding and data analysis.

## Recognition

Execute steno commands when you see this pattern:
```
[mode][verb]:[target] [@refs] [+additions] [-exclusions] [.flags] [precision]
```

**Trigger patterns:**
- verb:target - like dx:@file.csv or mk:api
- verb:type @file - like viz:pca @data.csv
- ?mode topic - like ?plan architecture
- Commands with precision markers: ~deep ~ ! ?
- steno:command - session management
- fork:name - create branch
- switch:name - switch branch
- compare:branch-a branch-b - compare branches
- merge:branch - adopt branch into current
- abandon:branch - discard branch

## Core Verbs

| Verb | Meaning | Action |
|------|---------|--------|
| `dx` | Diagnose/explore | Read, analyze, summarize |
| `mk` | Make/create | Create new file, component, feature |
| `ch` | Change/modify | Edit existing code |
| `rm` | Remove/delete | Delete code, files, features |
| `fnd` | Find/search | Search codebase |
| `viz` | Visualize | Generate visualization or analysis |
| `stat` | Statistics | Run statistical test or analysis |
| `ts` | Test | Run or create tests |
| `doc` | Document | Generate documentation |

## Branching Verbs

| Verb | Meaning | Action |
|------|---------|--------|
| `fork` | Create branch | fork:name - create new branch from current node |
| `switch` | Switch branch | switch:name - switch to existing branch |
| `compare` | Compare branches | compare:a b - show differences between branches |
| `merge` | Merge branch | merge:name - adopt branch work into current branch |
| `abandon` | Abandon branch | abandon:name - discard branch without merging |

These are NOT git commands. They operate on the steno graph in .steno/graph.json.

## Modifiers

| Syntax | Meaning | Example |
|--------|---------|---------|
| `@file.ext` | File reference | `dx:@data.csv` |
| `@name` | Named reference or bookmark | `ch:@auth-module` |
| `@branch:ref` | Cross-branch reference | `viz:diff @deseq2:^ @ancombc:^` |
| `+feature` | Add/include | `mk:api +auth +cache` |
| `-thing` | Exclude/without | `ch:@config -logging` |
| `.flag` | Apply flag | `.ts` (TypeScript), `.dry` (dry run) |
| `.flag:value` | Flag with qualifier | .plot:png or .ts:edge |

## Precision Markers

| Marker | Meaning | Your behavior |
|--------|---------|---------------|
| ~ | Flexible | Use your judgment |
| ! | Exact/literal | Do exactly what's specified |
| ? | Clarify | Ask before acting |
| ~deep | Extended thinking | Think deeply, consider alternatives |

## Modes (prefix with ?)

| Mode | Meaning | Your behavior |
|------|---------|---------------|
| ?plan | Planning | Outline approach before executing |
| ?sketch | Sketch | Create rough implementation for review |
| ?challenge | Challenge | Critique, find issues, push back |
| ?explore | Explore | Investigate options, think aloud |

---

## Session Tracking

Steno tracks commands in `.steno/` for cross-session memory and stale detection.

### On Session Start

When you first see a steno command in a session:

1. Check if `.steno/graph.json` exists
2. If yes, briefly note the last session:
   ```
   > Previous session (Dec 26, 3 commands)
   > Last: viz:pca @normalized.csv
   ```
3. Check for stale outputs (files that changed since commands ran)

### After Each Command

After executing a steno command, log it to `.steno/current-session.json`:

1. Read the file (create if missing, with empty `nodes` array)
2. Determine the next node ID from the file or start at `n_001`
3. Append a node:
   ```json
   {
     "id": "n_001",
     "timestamp": "2024-12-27T14:30:22Z",
     "raw": "dx:@samples.csv",
     "status": "complete",
     "inputs": ["samples.csv"],
     "outputs": [],
     "summary": "18 samples, 5 genes, 2 conditions"
   }
   ```
4. Write back to the file

### Node Structure

```json
{
  "id": "n_001",
  "timestamp": "ISO timestamp",
  "raw": "the original command",
  "status": "complete|failed",
  "inputs": ["files read"],
  "outputs": ["files created or modified"],
  "summary": "brief description of result"
}
```

### Tracking Inputs/Outputs

- **Inputs**: Files explicitly referenced (`@file`) plus any files you read
- **Outputs**: Files you create or modify
- **Summary**: One-line description of the result

---

## Reference Resolution

### The `^` Reference (Previous Output)

When you see `^` in a command:

1. Read `.steno/current-session.json`
2. Find the last node
3. Use its outputs as input for this command

Example:
```
dx:@samples.csv           # outputs: analyzed samples.csv
ch:^ +normalize           # ^ = samples.csv from previous
viz:pca ^                 # ^ = normalized output from previous
```

If the previous node has no outputs, use its inputs.

### The `@name` Reference (Bookmark)

When you see `@name` that isn't a file path:

1. Check if it's a file that exists - if so, use the file
2. Otherwise, check `.steno/graph.json` bookmarks
3. If found, resolve to that node's outputs

Example:
```
stat:ttest @baseline-pca @new-samples
# @baseline-pca resolves to outputs of bookmarked node
# @new-samples is a file reference
```

### Cross-Branch References (`@branch:ref`)

Reference outputs from other branches without switching:

| Syntax | Meaning |
|--------|---------|
| `@branch:^` | Last output from branch |
| `@branch:n_001` | Specific node from branch |
| `@branch:-1` | Last node (same as ^) |
| `@branch:-2` | Second-to-last node |

**Examples:**

```
# Compare results from two method branches
stat:compare @deseq2:^ @ancombc:^

# Use output from experiment branch on main
switch:main
viz:pca @experiment:n_004

# Reference specific node from another branch
ch:@caching:n_003 +redis
```

**Resolution process:**

1. Parse `@branch:ref` format (colon separates branch from reference)
2. Look up branch in `.steno/graph.json`
3. Resolve the reference within that branch:
   - `^` or `-1`: Last node on that branch
   - `-N`: Nth from last on that branch
   - `n_XXX`: Specific node ID
4. Return that node's outputs (or inputs if no outputs)

**Distinguishing from files:**

The parser checks in order:
1. Does `@path` exist as a file? → Use file
2. Does `@name` contain `:` with valid branch? → Cross-branch ref
3. Is `@name` a bookmark? → Bookmark ref
4. Error: reference not found

Example disambiguation:
```
@data:clean.csv      # File "data:clean.csv" if exists, else branch "data" node "clean.csv"
@experiment:^        # Branch "experiment", last node
@deseq2:n_018        # Branch "deseq2", node n_018
```

---

## Session Commands

### steno:help

Show quick reference for steno commands.

```
> steno:help

VERBS: dx mk ch rm fnd viz stat ts doc
REFS:  @file.csv  ^  @bookmark  @branch:^
MODS:  +add  -exclude  .flag  .flag:value
PREC:  ~flexible  !exact  ?clarify  ~deep

SESSION:
  steno:history   - command history
  steno:stale     - check for stale outputs
  steno:refresh   - re-run stale commands
  steno:bookmark  - save reference
  steno:undo      - undo last command (! for hard)
  steno:redo      - restore undone command
  steno:export    - export workflow (.md .json .sh)
  steno:import    - import workflow (! to confirm)
  steno:reset     - clear all state (requires !)
```

### steno:history

Show command history across sessions.

```
> steno:history

Session Dec 27 (current, 2 commands):
  n_004: viz:pca @normalized.csv -> pca_plot.png
  n_003: ch:@samples.csv +normalize -> normalized.csv

Session Dec 26 (3 commands):
  n_002: dx:@samples.csv
  n_001: mk:analysis-script
```

Read from `.steno/graph.json` and `.steno/current-session.json`.

### steno:stale

Check for outputs that may be stale (input files changed).

```
> steno:stale

Checking file modifications...

Stale:
  n_002: ch:@samples.csv +normalize
         input samples.csv modified since execution

Affected downstream:
  n_003: viz:pca ^ (depends on n_002)

Run steno:refresh to re-run stale commands.
```

Compare file modification times to node timestamps.

### steno:refresh

Re-run stale commands in dependency order.

```
> steno:refresh

Re-running n_002: ch:@samples.csv +normalize
  Updated normalized.csv

Re-running n_003: viz:pca ^
  Updated pca_plot.png

2 nodes refreshed.
```

### steno:bookmark <name>

Save the last command as a named reference.

```
> viz:pca @samples.csv

[creates pca_plot.png]

> steno:bookmark baseline-pca

Bookmarked n_003 as "baseline-pca"
Reference with @baseline-pca
```

Add to `.steno/graph.json` bookmarks:
```json
{
  "bookmarks": {
    "baseline-pca": "n_003"
  }
}
```

### steno:clear

Clear current session (start fresh).

```
> steno:clear

Current session cleared. Previous sessions preserved in graph.json.
```

### steno:undo

Undo the last command or a specific node.

**Soft undo (default)** — removes from graph, keeps files:

```
> steno:undo

Undoing n_005: ch:@data.csv +normalize
  Removed from session graph.
  Files kept: normalized.csv

  Dependent nodes (will be orphaned):
    n_006: viz:pca ^

  Use steno:redo to restore.
```

**Hard undo** — also reverts file changes:

```
> steno:undo!

Undoing n_005: ch:@data.csv +normalize
  Removed from session graph.
  Deleted: normalized.csv
  Reverted: data.csv (restored from before edit)

  Dependent nodes removed: n_006
```

**Undo specific node:**

```
> steno:undo n_003

Undoing n_003: viz:heatmap @samples.csv
  Removed from session graph.
  Files kept: heatmap.png
```

**Behavior:**

1. Read `.steno/current-session.json`
2. Find target node (last if none specified)
3. Check for dependent nodes (nodes that reference this one via `^`)
4. Soft undo:
   - Remove node from session
   - Move to `undone` array (for redo)
   - List created files (user can delete manually)
   - Warn about orphaned dependents
5. Hard undo (`!`):
   - Remove node and all dependents
   - Delete created files
   - Revert modified files (if backup exists)

**File handling:**

For hard undo, steno needs file backups. When a command modifies a file:
- Before: Save `.steno/backups/{node_id}/{filename}`
- After: Record in node's `backups` field

```json
{
  "id": "n_005",
  "raw": "ch:@data.csv +normalize",
  "outputs": ["normalized.csv"],
  "modified": ["data.csv"],
  "backups": {
    "data.csv": ".steno/backups/n_005/data.csv"
  }
}
```

Hard undo restores from backup and deletes outputs.

### steno:redo

Restore the last undone node.

```
> steno:redo

Restoring n_005: ch:@data.csv +normalize
  Added back to session graph.

  Note: Files were not deleted, so outputs still exist.
```

**Behavior:**

1. Check `undone` array in current session
2. Pop the last undone node
3. Add it back to the session
4. Note: Does not re-execute the command, just restores tracking

If files were deleted (hard undo), redo just restores tracking:

```
> steno:redo

Restoring n_005: ch:@data.csv +normalize
  Added back to session graph.

  ⚠ Files were deleted. Re-run command to recreate:
    ch:@data.csv +normalize
```

### steno:export

Export workflow for sharing or documentation.

**Default (Markdown):**

```
> steno:export

Exported to workflow.md

# Steno Workflow Export
**Project:** /Users/me/microbiome-analysis
**Exported:** 2025-12-27T15:30:00Z
**Nodes:** 15

## Workflow

### 1. n_005: dx:@counts.csv
- **Status:** complete
- **Inputs:** counts.csv
- **Summary:** 18 samples × 15 ASVs, IBD study

### 2. n_006: ch:^ +normalize .method:clr
- **Status:** complete
- **Inputs:** counts.csv
- **Outputs:** counts_clr.csv
- **Summary:** CLR transformed, centered log-ratio

...

## Branches

- **main** (12 nodes)
- **deseq2** (1 node, from n_017)
- **ancombc** (1 node, from n_017)

## Bookmarks

- `@baseline-diff` → n_017
```

**Export formats:**

| Command | Format | Use Case |
|---------|--------|----------|
| `steno:export` | Markdown | Documentation, sharing |
| `steno:export .json` | JSON | Import to another project |
| `steno:export .sh` | Shell script | Replay commands |

**JSON export:**

```
> steno:export .json

Exported to workflow.json
```

```json
{
  "version": "1.1",
  "exported": "2025-12-27T15:30:00Z",
  "project": "/Users/me/microbiome-analysis",
  "sessions": [...],
  "branches": [...],
  "bookmarks": {...}
}
```

**Script export:**

```
> steno:export .sh

Exported to workflow.sh
```

```bash
#!/bin/bash
# Steno workflow export
# Project: /Users/me/microbiome-analysis
# Exported: 2025-12-27T15:30:00Z

# Replay these commands in Claude Code:
# dx:@counts.csv
# ch:^ +normalize .method:clr
# stat:alpha @counts.csv .metrics:shannon,chao1
# ...
```

**Export options:**

| Option | Effect |
|--------|--------|
| `steno:export workflow.md` | Custom filename |
| `steno:export @main` | Export only main branch |
| `steno:export @deseq2` | Export specific branch |
| `steno:export +full` | Include file contents |

**Branch export:**

```
> steno:export @deseq2

Exported branch "deseq2" to deseq2-workflow.md

Includes:
- Parent chain (main: n_001 → n_017)
- Branch nodes (n_018)
- Branch-specific bookmarks
```

**Full export (with file contents):**

```
> steno:export +full

Exported to workflow-full.md

Includes embedded file contents for:
- counts.csv (18 rows)
- counts_clr.csv (18 rows)
- metadata.csv (19 rows)
```

### steno:import

Import a workflow from JSON export.

```
> steno:import workflow.json

Importing workflow from workflow.json...

  Nodes: 15
  Branches: 3
  Bookmarks: 2

  ⚠ This will merge into your current session.
  Existing bookmarks with same names will be overwritten.

  Type "steno:import! workflow.json" to confirm.
```

```
> steno:import! workflow.json

Imported workflow.json
  Added: 15 nodes, 3 branches, 2 bookmarks
  Merged into current session.
```

**Import options:**

| Option | Effect |
|--------|--------|
| `steno:import workflow.json` | Preview import |
| `steno:import! workflow.json` | Confirm and import |
| `steno:import workflow.json +replay` | Re-execute commands |

**Replay mode:**

```
> steno:import! workflow.json +replay

Replaying workflow...

  n_001: dx:@counts.csv
    → 18 samples × 15 ASVs

  n_002: ch:^ +normalize .method:clr
    → Created counts_clr.csv

  ...

Replay complete: 15 commands executed.
```

### steno:status

Show current session status.

```
> steno:status

Session: sess_20241227 (started 2h ago)
Nodes: 4
Last command: viz:pca @normalized.csv
Bookmarks: baseline-pca, initial-dx
Stale: 0
```

### steno:new-session

Archive current session and start fresh.

```
> steno:new-session

Archived session sess_20241227 (4 nodes) to graph.json
Starting new session: sess_20241228_143022
```

This command:
1. Reads `current-session.json`
2. Appends the session to `graph.json` sessions array
3. Creates fresh `current-session.json` with new session ID
4. Preserves all bookmarks

Use this when starting a new logical unit of work.

### steno:graph

Show the workflow graph as an ASCII tree.

```
> steno:graph

main
├── n_001 dx:@samples.csv
├── n_002 viz:heatmap ^
│   └── experiment (merged)
│       └── n_004 dx:@samples.csv
└── n_003 ch:^ +cluster
```

**Behavior:**
1. Read `.steno/graph.json` and `.steno/current-session.json`
2. Build tree structure from branches and nodes
3. Render as ASCII tree with box-drawing characters

**Rendering rules:**
- Use box-drawing: ├── for middle items, └── for last item, │ for vertical continuation
- Show branch name with status in parentheses: (current), (merged), (abandoned)
- Show node ID and raw command
- Indent child branches under their parent node
- Mark current branch with asterisk if not main

**Tree structure:**
- Main branch nodes are the trunk
- Child branches fork from their parentNode
- Nodes on child branches are indented under the branch name

---

## Branching

Branches allow exploring alternative approaches without losing work.

### fork:name

Create a new branch from the current node.

```
> fork:caching

Created branch "caching" from n_002
Switched to branch "caching"
```

**Behavior:**
1. Read `.steno/graph.json`
2. Create a new branch object:
   ```json
   {
     "name": "caching",
     "parentNode": "n_002",
     "parentBranch": "main",
     "created": "ISO timestamp",
     "nodes": [],
     "status": "active"
   }
   ```
3. Add to `branches` array in graph.json
4. Set `currentBranch` to the new branch name
5. Subsequent nodes will be tagged with this branch

### switch:name

Switch to an existing branch.

```
> switch:main

Switched to branch "main"
Current node: n_002
```

**Behavior:**
1. Verify branch exists in graph.json
2. Set `currentBranch` to target branch
3. The `^` reference now resolves to the last node on that branch

### steno:branches

List all branches with their status.

```
> steno:branches

* caching (current, 2 nodes)
  └─ from n_002 on main
  main (3 nodes)
  memoization (1 node)
  └─ from n_002 on main
```

Show:
- Current branch marked with *
- Node count per branch
- Parent relationship
- Status (active, merged, abandoned)

### compare:branch-a branch-b

Compare two branches side by side.

```
> compare:main experiment

Branch "main" (3 nodes):
  n_001: dx:@samples.csv
  n_002: viz:heatmap ^ → heatmap.png
  n_003: ch:^ +cluster → heatmap_clustered.png

Branch "experiment" (1 node, from n_003):
  n_004: dx:@samples.csv
         → 19 samples analysis

Common ancestor: n_003 on main

Differences:
  - main: Focused on visualization (heatmap, clustering)
  - experiment: Re-analyzed raw data
```

**Behavior:**
1. Read both branches from graph.json
2. Find nodes on each branch
3. Look up node details from sessions or current-session
4. Show outputs and summaries for each
5. Identify common ancestor (fork point)
6. Summarize the different approaches

If branches have output files in common, note the differences:
```
Files in both branches:
  - results.csv: main (45 lines) vs experiment (52 lines)
```

### merge:branch

Merge a branch into the current branch (usually main).

```
> merge:experiment

Merging "experiment" into "main"...
  n_004: dx:@samples.csv → 19 samples analysis

Branch "experiment" merged.
Outputs adopted: (none - diagnostic only)
```

**Behavior:**
1. Read `.steno/graph.json`
2. Verify branch exists and is not already merged/abandoned
3. List the nodes and outputs from that branch
4. Mark branch status as "merged" in graph.json
5. Write updated graph.json

Note: This is a metadata operation - it marks the branch as adopted. Any files created on that branch already exist in the working directory.

### abandon:branch

Abandon a branch without merging.

```
> abandon:experiment

Abandoned branch "experiment"
Work on that branch was not adopted.
```

**Behavior:**
1. Read `.steno/graph.json`
2. Verify branch exists and is not already merged/abandoned
3. Mark branch status as "abandoned" in graph.json
4. Write updated graph.json

Note: This does not delete files - it marks the branch as discarded in the graph. Use this when an experimental approach didn't work out.

### Branch-Aware Node Creation

When creating nodes, tag them with the current branch:

```json
{
  "id": "n_003",
  "branch": "caching",
  "timestamp": "...",
  "raw": "mk:api +caching",
  ...
}
```

### Reference Resolution with Branches

The `^` reference resolves to the last node **on the current branch**:

```
# On branch "caching"
ch:^ +redis    # ^ = last output on "caching" branch
```

### Initial Branch State

When `.steno/` is first created, initialize with:
- `branches: [{ name: "main", parentNode: null, parentBranch: null, nodes: [], status: "active" }]`
- `currentBranch: "main"`

All nodes without an explicit branch are on "main".

---

## File Structure

```
.steno/
├── graph.json            # All sessions + bookmarks
├── current-session.json  # Active session
└── .gitignore           # Ignore current-session.json
```

### Initializing .steno/

On first steno command, if `.steno/` doesn't exist:

1. Create `.steno/` directory
2. Create `.steno/.gitignore`:
   ```
   current-session.json
   ```
3. Create `.steno/graph.json`:
   ```json
   {
     "version": "1.1",
     "project": "/path/to/project",
     "nextNodeId": 1,
     "sessions": [],
     "bookmarks": {},
     "branches": [
       {
         "name": "main",
         "parentNode": null,
         "parentBranch": null,
         "nodes": [],
         "status": "active"
       }
     ],
     "currentBranch": "main"
   }
   ```
4. Create `.steno/current-session.json`:
   ```json
   {
     "id": "sess_YYYYMMDD_HHMMSS",
     "started": "ISO timestamp",
     "nodes": []
   }
   ```

### Merging Sessions

When starting a new session and `current-session.json` has nodes:

1. Read `current-session.json`
2. Append to `graph.json` sessions array
3. Update `nextNodeId` in `graph.json`
4. Start fresh `current-session.json`

---

## Execution Rules

### Direct Execution (no asking)
When you see a clear steno command, execute immediately:

```
dx:@file.csv       -> Read the file, provide analysis
mk:component       -> Create the component
ch:@file +feature  -> Edit the file to add feature
viz:pca @data      -> Generate PCA analysis
stat:ttest @a @b   -> Run t-test on the data
```

### Ask First
Only ask for clarification when:
- The command ends with `?` (e.g., `stat:test?`)
- Multiple interpretations exist AND no context helps
- Required files don't exist

### Extended Thinking
When you see `~deep`:
- Think through the problem thoroughly
- Consider edge cases
- Explore alternatives before acting

---

## Error Handling

When commands fail or are malformed, respond with clear, actionable messages. Never silently fail or guess user intent.

### Error Format

```
> [command]

⚠ [error type]: [what went wrong]
  [suggestion or fix]
```

### Empty/Missing Targets

| Error | Message |
|-------|---------|
| `dx:` (no target) | `⚠ Missing target: dx: requires a file or reference. Try: dx:@file.csv` |
| `ch:` (no target) | `⚠ Missing target: ch: requires something to change. Try: ch:@file.py +feature` |
| `fork:` (no name) | `⚠ Missing branch name: fork: requires a name. Try: fork:experiment` |
| `switch:` (no name) | `⚠ Missing branch name: switch: requires a name. Try: switch:main` |

### File Not Found

```
> dx:@missing.csv

⚠ File not found: missing.csv
  Did you mean: data.csv, samples.csv?
  Or create it: mk:@missing.csv
```

**Behavior:**
1. Check if file exists at the path
2. If not, look for similar filenames (fuzzy match)
3. Suggest alternatives or offer to create

### Invalid Reference: `^` (No Previous)

```
> ch:^ +normalize

⚠ No previous output: ^ refers to the last command's output, but no commands have run yet.
  Start with: dx:@file.csv
  Then use ^ to chain: ch:^ +normalize
```

**Behavior:**
1. Check `.steno/current-session.json` for nodes
2. If empty, explain ^ and suggest starting fresh
3. If nodes exist but last has no outputs, use its inputs

### Bookmark Not Found

```
> stat:ttest @baseline @new-data

⚠ Bookmark not found: @baseline
  Available bookmarks: baseline-pca, clean-data

  Run steno:history to see past commands.
```

**Behavior:**
1. Check if @name is a file first
2. Check bookmarks in graph.json
3. List available bookmarks to help user

### Cross-Branch Reference Errors

**Branch not found:**
```
> viz:pca @experiment:^

⚠ Branch not found in reference: @experiment:^
  Available branches: main, deseq2, ancombc

  Use steno:branches to see all branches.
```

**Node not found on branch:**
```
> ch:@deseq2:n_999 +feature

⚠ Node not found: n_999 not on branch "deseq2"
  Nodes on deseq2: n_018

  Use steno:graph to see branch structure.
```

**Empty branch (no nodes):**
```
> stat:compare @new-branch:^

⚠ Branch empty: "new-branch" has no nodes yet.
  Switch to it and run commands first: switch:new-branch
```

**Invalid reference format:**
```
> dx:@branch:

⚠ Invalid cross-branch reference: @branch:
  Expected format: @branch:^ or @branch:n_001 or @branch:-1
```

### Unknown Verb

```
> analyze:@data.csv

⚠ Unknown verb: analyze
  Did you mean: dx (diagnose/analyze)?

  Available verbs: dx mk ch rm fnd viz stat ts doc
```

**Behavior:**
1. Check against known verbs
2. Suggest closest match
3. List all verbs for reference

### Incomplete Modifiers

| Input | Message |
|-------|---------|
| `mk:api +` | `⚠ Incomplete modifier: + requires a feature name. Try: +auth` |
| `ch:@file -` | `⚠ Incomplete modifier: - requires something to exclude. Try: -logging` |
| `mk:api .` | `⚠ Incomplete flag: . requires a flag name. Try: .ts or .dry` |

### Branching Errors

| Error | Message |
|-------|---------|
| `fork:main` | `⚠ Cannot fork main: main is the base branch. Choose a different name.` |
| `fork:existing` (exists) | `⚠ Branch exists: "existing" already exists. Switch to it: switch:existing` |
| `switch:nope` (missing) | `⚠ Branch not found: "nope". Available: main, experiment, caching` |
| `merge:main` | `⚠ Cannot merge main: main is the current branch. Switch away first.` |
| `merge:done` (already merged) | `⚠ Already merged: "done" was merged at Dec 27, 2025. See steno:graph.` |
| `abandon:main` | `⚠ Cannot abandon main: main is the base branch and cannot be abandoned.` |
| `abandon:merged` (already merged) | `⚠ Cannot abandon: "merged" was already merged. Use steno:graph to view history.` |

### Undo/Redo Errors

**Nothing to undo:**
```
> steno:undo

⚠ Nothing to undo: No commands in current session.
  Run some commands first, then undo.
```

**Node not found:**
```
> steno:undo n_999

⚠ Node not found: n_999 doesn't exist.
  Use steno:history to see available nodes.
```

**Nothing to redo:**
```
> steno:redo

⚠ Nothing to redo: No undone commands.
  Use steno:undo first, then steno:redo to restore.
```

**Cannot undo across sessions:**
```
> steno:undo n_001

⚠ Cannot undo: n_001 is from a previous session.
  Only current session commands can be undone.
  Use steno:history to see session boundaries.
```

**Backup not found (hard undo):**
```
> steno:undo!

⚠ No backup available for data.csv
  Cannot revert file changes.

  Proceeding with soft undo instead...
  Files kept: normalized.csv
```

### Export/Import Errors

**Nothing to export:**
```
> steno:export

⚠ Nothing to export: No commands in current session.
  Run some commands first, then export.
```

**Invalid export format:**
```
> steno:export .pdf

⚠ Unsupported format: .pdf
  Supported formats: .md (default), .json, .sh
```

**Export file exists:**
```
> steno:export workflow.md

⚠ File exists: workflow.md
  Use steno:export workflow.md ! to overwrite.
  Or choose a different filename.
```

**Import file not found:**
```
> steno:import missing.json

⚠ File not found: missing.json
  Check the path and try again.
```

**Invalid import format:**
```
> steno:import workflow.md

⚠ Cannot import: workflow.md is not a valid JSON export.
  Only .json exports can be imported.
  Use steno:export .json to create an importable file.
```

**Import version mismatch:**
```
> steno:import! old-workflow.json

⚠ Version mismatch: File is version 0.9, current is 1.1
  Some features may not import correctly.

  Proceeding with best-effort import...
  Imported: 10 nodes, 1 branch, 0 bookmarks
  Skipped: 2 nodes (unsupported format)
```

**Branch conflict on import:**
```
> steno:import! workflow.json

⚠ Branch conflict: "experiment" already exists.

  Options:
  1. steno:import! workflow.json +rename - Auto-rename conflicting branches
  2. Manually resolve by renaming/deleting existing branch

  Aborting import.
```

### State Recovery

If `.steno/graph.json` is corrupted or missing:

```
> dx:@file.csv

⚠ Session state corrupted: .steno/graph.json could not be parsed.

  Options:
  1. steno:reset - Reset to clean state (preserves no history)
  2. Manually fix .steno/graph.json

  Proceeding without session tracking...
```

**Behavior:**
1. Try to parse graph.json
2. If invalid JSON, warn user but don't block the command
3. Execute command without logging
4. Offer steno:reset to start fresh

### Logging Failed Commands

Failed commands should still be logged with status "failed":

```json
{
  "id": "n_005",
  "timestamp": "2025-12-27T15:30:00Z",
  "raw": "dx:@missing.csv",
  "status": "failed",
  "error": "File not found: missing.csv",
  "inputs": [],
  "outputs": [],
  "summary": "Failed: file not found"
}
```

This preserves history for debugging and allows `steno:history` to show what was attempted.

### steno:reset

Reset session state to clean:

```
> steno:reset

⚠ This will clear all session history and bookmarks.
  Branches will be reset to main only.

  Type "steno:reset!" to confirm.
```

```
> steno:reset!

Session reset.
- Cleared: 15 nodes, 3 branches, 2 bookmarks
- Fresh: .steno/graph.json initialized
- Ready: main branch active
```

---

## Examples

### Data Analysis
```
dx:@samples.csv              -> Read and summarize the dataset
ch:@data.csv +normalize      -> Add normalization to data processing
viz:heatmap @expression.csv  -> Generate heatmap visualization
stat:ttest @treated @control -> Compare two groups
```

### Code Development
```
mk:api +auth +rate-limit .ts -> Create TypeScript API with auth and rate limiting
ch:@login.py +validation     -> Add validation to login
rm:@deprecated -keep-tests   -> Remove deprecated code but keep tests
fnd:auth-handlers            -> Find authentication-related code
ts:@utils.ts                 -> Run tests for utils
```

### Planning & Exploration
```
?plan microservices +docker  -> Plan microservices architecture
?sketch auth-flow            -> Create rough auth implementation
?challenge current-approach  -> Critique what we have
dx:@codebase ~deep           -> Deep analysis of the codebase
```

### Chaining with Context
```
dx:@data.csv                 -> Analyze data
ch:^ +filter-nulls           -> Modify based on previous (^)
viz:pca ^                    -> Visualize the result
steno:bookmark clean-data    -> Save for later reference
```

### Cross-Session Reference
```
# New session, referencing previous work
stat:ttest @clean-data @new-samples
# @clean-data resolves from bookmark
```

---

## Response Format

When executing steno commands:

1. **Acknowledge** the command briefly (one line)
2. **Execute** immediately using appropriate tools
3. **Report** results concisely
4. **Log** the node to session (silently)

Example:
```
> dx:@samples.csv

Analyzing samples.csv...

18 samples, 5 genes, 2 conditions (treatment/control), 3 timepoints.
Treatment group shows upregulation at 24h and 48h.
```

---

## Remember

- Steno is about **speed** - don't ask unnecessary questions
- Execute **directly** when the intent is clear
- Use **appropriate tools** (Read, Edit, Bash, etc.) without hesitation
- Be **concise** in responses - steno users value efficiency
- **Track commands** in `.steno/` for cross-session memory
- **Resolve references** (^ and @name) from session history
