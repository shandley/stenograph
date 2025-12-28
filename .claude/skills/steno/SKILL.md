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
  steno:graph     - show workflow tree
  steno:undo      - undo last command (! for hard)
  steno:redo      - restore undone command
  steno:export    - export workflow (.md .json .sh)
  steno:import    - import workflow (! to confirm)
  steno:reset     - clear all state (requires !)

POWER:
  steno:alias     - create/list/remove aliases (supports {params})
  steno:search    - search command history
  steno:replay    - re-run command sequences
  steno:template  - reusable command workflows
  steno:diff      - compare nodes/branches/bookmarks
  steno:transcript - link to conversation transcripts
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

### steno:alias

Create, list, or remove command aliases for frequently used patterns.

**Create an alias:**

```
> steno:alias setup "dx:@package.json && ch:@tsconfig.json +strict"

Alias "setup" created.
Use: setup
```

**List aliases:**

```
> steno:alias

Aliases:
  setup    → dx:@package.json && ch:@tsconfig.json +strict
  qa       → ts:@tests/ && doc:@api/
  deploy   → ts:@tests/ && mk:build +prod
```

**Remove an alias:**

```
> steno:alias -setup

Alias "setup" removed.
```

**Use an alias:**

```
> setup

Running alias "setup"...
  → dx:@package.json
  → ch:@tsconfig.json +strict
```

**Behavior:**
1. Aliases stored in `.steno/aliases.json`:
   ```json
   {
     "setup": "dx:@package.json && ch:@tsconfig.json +strict",
     "qa": "ts:@tests/ && doc:@api/"
   }
   ```
2. When a non-verb input matches an alias, expand and execute
3. Aliases can chain multiple commands with `&&`
4. Aliases can include modifiers and references
5. Use `-name` to remove an alias

**Alias rules:**
- Names must be alphanumeric (no special characters)
- Names cannot conflict with verbs (dx, mk, ch, etc.)
- Aliases expand before any other parsing
- Nested aliases not supported (keeps it simple)

### steno:search

Search command history by pattern or filter.

**Search by pattern:**

```
> steno:search validation

Found 3 matches:
  n_012: ch:@auth.ts +validation (Dec 27)
         → Added input validation
  n_008: ch:@api.py +validation (Dec 26)
         → Added request validation
  n_003: ?plan validation-strategy (Dec 25)
         → Outlined validation approach
```

**Search by verb:**

```
> steno:search :viz

Found 5 viz commands:
  n_015: viz:heatmap @counts.csv
  n_011: viz:pca @normalized.csv
  n_007: viz:boxplot @results.csv
  ...
```

**Search by modifier:**

```
> steno:search +auth

Found 4 commands with +auth:
  n_018: mk:middleware +auth +jwt
  n_014: ch:@routes.ts +auth
  n_009: mk:api +auth +cache
  n_002: ?plan +auth
```

**Search by file reference:**

```
> steno:search @config

Found 2 commands referencing config files:
  n_010: ch:@config.json +logging
  n_004: dx:@config.yaml
```

**Search options:**

| Option | Effect |
|--------|--------|
| `steno:search pattern` | Search raw commands |
| `steno:search :verb` | Filter by verb |
| `steno:search +modifier` | Filter by modifier |
| `steno:search @file` | Filter by file reference |
| `steno:search @branch:pattern` | Search specific branch |
| `steno:search -n 10` | Limit results |
| `steno:search --failed` | Show only failed commands |

**Behavior:**
1. Search across all sessions in graph.json and current-session.json
2. Pattern matches against raw command and summary
3. Results sorted by recency (newest first)
4. Show node ID, command, date, and summary
5. Limit to 20 results by default

### steno:replay

Re-run a sequence of commands from history.

**Replay single command:**

```
> steno:replay n_005

Replaying n_005: ch:@data.csv +normalize
  → Updated normalized.csv
```

**Replay range:**

```
> steno:replay n_003..n_007

Replaying 5 commands...

  n_003: dx:@data.csv
         → 18 samples analyzed

  n_004: ch:^ +filter
         → Filtered to 15 samples

  n_005: ch:^ +normalize
         → Created normalized.csv

  n_006: viz:pca ^
         → Created pca_plot.png

  n_007: steno:bookmark baseline
         → Bookmarked as "baseline"

Replay complete: 5 commands executed.
```

**Replay from bookmark:**

```
> steno:replay @baseline..

Replaying from bookmark "baseline" to current...
  4 commands replayed.
```

**Replay options:**

| Option | Effect |
|--------|--------|
| `steno:replay n_XXX` | Replay single node |
| `steno:replay n_XXX..n_YYY` | Replay range (inclusive) |
| `steno:replay @bookmark..` | From bookmark to end |
| `steno:replay ..n_XXX` | From start to node |
| `steno:replay @branch:n_XXX..` | Replay branch from node |
| `steno:replay +dry` | Show commands without executing |
| `steno:replay +skip-failed` | Skip previously failed nodes |

**Dry run:**

```
> steno:replay n_003..n_007 +dry

Would replay 5 commands:
  n_003: dx:@data.csv
  n_004: ch:^ +filter
  n_005: ch:^ +normalize
  n_006: viz:pca ^
  n_007: steno:bookmark baseline

Use steno:replay n_003..n_007 to execute.
```

**Behavior:**
1. Look up nodes in graph.json/current-session.json
2. Execute each command in order
3. `^` references resolve to the replayed command's output (not original)
4. New nodes created for replay (preserves original history)
5. Failed commands stop replay unless +skip-failed

**Replay vs Import:**
- `steno:replay`: Re-execute from local history
- `steno:import +replay`: Execute from exported workflow file

### steno:template

Create, list, use, and share reusable command sequences.

**List available templates:**

```
> steno:template

Built-in templates:
  react-component  - Create React component with tests
  api-endpoint     - Create REST endpoint with validation
  refactor         - Safe refactoring workflow

Custom templates (.steno/templates/):
  my-setup         - Project initialization
  deploy-check     - Pre-deployment checklist
```

**Use a template:**

```
> steno:template react-component Button

Running template "react-component" with args: Button

  Step 1/4: mk:components/Button.tsx +functional
            → Created Button.tsx

  Step 2/4: mk:components/Button.test.tsx +jest
            → Created Button.test.tsx

  Step 3/4: mk:components/Button.css +module
            → Created Button.css

  Step 4/4: ch:@components/index.ts +export Button
            → Updated index.ts

Template complete: 4 commands executed.
```

**Create a custom template:**

```
> steno:template +create setup

Creating template "setup"...
Enter commands (empty line to finish):

> dx:@package.json
> ch:@tsconfig.json +strict
> ts:@tests/ +coverage
>

Template "setup" created with 3 commands.
Saved to: .steno/templates/setup.json
```

**Template with parameters:**

```
> steno:template +create component

Creating template "component"...
Parameters: {name} {type?:functional}
Enter commands:

> mk:components/{name}.tsx +{type}
> mk:components/{name}.test.tsx +jest
> ch:@components/index.ts +export {name}
>

Template "component" created.
Usage: steno:template component MyButton type:class
```

**View template contents:**

```
> steno:template ?react-component

Template: react-component
Description: Create React component with tests
Parameters: {name} (required), {style?:css} (optional, default: css)

Commands:
  1. mk:components/{name}.tsx +functional
  2. mk:components/{name}.test.tsx +jest
  3. mk:components/{name}.{style} +module
  4. ch:@components/index.ts +export {name}
```

**Remove a template:**

```
> steno:template -setup

Template "setup" removed.
```

**Template options:**

| Command | Action |
|---------|--------|
| `steno:template` | List all templates |
| `steno:template name args...` | Run template |
| `steno:template ?name` | View template details |
| `steno:template +create name` | Create new template |
| `steno:template -name` | Remove template |
| `steno:template +export name` | Export as shareable JSON |
| `steno:template +import file` | Import template |

**Behavior:**
1. Built-in templates defined in SKILL.md
2. Custom templates stored in `.steno/templates/*.json`
3. Parameters use `{name}` syntax, optional with `{name?:default}`
4. Templates execute commands sequentially, stopping on failure
5. Each command creates a node (full tracking)

**Template file format:**

```json
{
  "name": "component",
  "description": "Create React component with tests",
  "parameters": [
    {"name": "name", "required": true},
    {"name": "style", "required": false, "default": "css"}
  ],
  "commands": [
    "mk:components/{name}.tsx +functional",
    "mk:components/{name}.test.tsx +jest",
    "mk:components/{name}.{style} +module",
    "ch:@components/index.ts +export {name}"
  ]
}
```

**Built-in templates:**

| Template | Description | Parameters |
|----------|-------------|------------|
| `react-component` | React component + test + styles | `{name}`, `{style?:css}` |
| `api-endpoint` | REST endpoint with validation | `{name}`, `{method?:GET}` |
| `refactor` | Safe refactoring workflow | `{target}` |
| `test-suite` | Test file with setup | `{name}`, `{framework?:jest}` |

### Parameterized Aliases

Aliases can include parameters using `{1}`, `{2}`, etc. for positional args or `{name}` for named args.

**Create parameterized alias:**

```
> steno:alias explore "dx:@{1} ~deep && fnd:{2}"

Alias "explore" created with 2 parameters.
Usage: explore <file> <pattern>
```

**Use parameterized alias:**

```
> explore src/api.ts TODO

Running alias "explore" with args: src/api.ts, TODO
  → dx:@src/api.ts ~deep
  → fnd:TODO
```

**Named parameters:**

```
> steno:alias test "ts:@{file} +{coverage:basic}"

Alias "test" created.
Usage: test file:<path> [coverage:<level>]
```

```
> test file:utils.ts coverage:full

Running alias "test"...
  → ts:@utils.ts +full
```

**Default values:**

```
> steno:alias lint "ch:@{1:src/} +lint"

Alias "lint" created.
Default for {1}: src/
```

```
> lint
Running: ch:@src/ +lint

> lint lib/
Running: ch:@lib/ +lint
```

**Parameter syntax:**

| Syntax | Meaning | Example |
|--------|---------|---------|
| `{1}` | First positional arg | `dx:@{1}` |
| `{2}` | Second positional arg | `stat:compare @{1} @{2}` |
| `{name}` | Named parameter | `mk:{name}.ts` |
| `{1:default}` | Positional with default | `dx:@{1:src/}` |
| `{name:default}` | Named with default | `+{type:functional}` |
| `{1?}` | Optional (omit if missing) | `ch:@{1} {2?}` |

**Behavior:**
1. Positional args filled left-to-right
2. Named args use `name:value` syntax
3. Missing required args show error
4. Optional args (`{?}`) omit that part of command if not provided
5. Defaults used when arg not provided

**Alias introspection:**

```
> steno:alias ?explore

Alias: explore
Command: dx:@{1} ~deep && fnd:{2}
Parameters:
  {1} - required (file path)
  {2} - required (search pattern)

Usage: explore <arg1> <arg2>
Example: explore src/app.ts TODO
```

### steno:diff

Compare outputs between nodes, branches, or bookmarks.

**Diff two nodes:**

```
> steno:diff n_003 n_007

Comparing n_003 → n_007

n_003: ch:@data.csv +filter
  outputs: filtered.csv (45 rows)

n_007: ch:@data.csv +filter +normalize
  outputs: filtered_norm.csv (45 rows)

File diff (filtered.csv → filtered_norm.csv):
  - Same row count (45)
  - Column changes:
    + normalized_value (new)
    ~ value → raw_value (renamed)
  - Value ranges:
    normalized_value: 0.0 - 1.0
```

**Diff branches:**

```
> steno:diff @main @experiment

Branch comparison: main → experiment

Diverged at: n_005 (ch:@data.csv +filter)

main (3 nodes after fork):
  n_006: stat:ttest @filtered.csv
  n_007: viz:boxplot ^
  n_008: doc:@results/

experiment (2 nodes after fork):
  n_009: stat:wilcoxon @filtered.csv
  n_010: viz:violin ^

Output comparison:
  Statistical test:
    main: t-test (p=0.023)
    experiment: Wilcoxon (p=0.031)

  Visualizations:
    main: boxplot.png (800x600)
    experiment: violin.png (800x600)
```

**Diff with bookmark:**

```
> steno:diff @baseline ^

Comparing bookmark "baseline" (n_004) → current (n_012)

Changes since baseline:
  8 commands executed
  3 files created
  2 files modified

Key differences:
  n_004: data.csv (raw, 100 rows)
  n_012: data_processed.csv (normalized, 95 rows)
    - 5 rows filtered
    - Added columns: norm_value, z_score
```

**Diff options:**

| Command | Action |
|---------|--------|
| `steno:diff n_X n_Y` | Compare two nodes |
| `steno:diff @branch1 @branch2` | Compare branches |
| `steno:diff @bookmark ^` | Compare bookmark to current |
| `steno:diff n_X..n_Y` | Show changes across range |
| `steno:diff +files` | Include file content diff |
| `steno:diff +stats` | Focus on statistical differences |
| `steno:diff .format:json` | Output as JSON |

**Range diff:**

```
> steno:diff n_003..n_010

Change summary: n_003 → n_010 (8 commands)

Files created: 4
  - filtered.csv (n_003)
  - normalized.csv (n_005)
  - pca_plot.png (n_007)
  - results.md (n_010)

Files modified: 2
  - data.csv: 3 modifications
  - config.json: 1 modification

Command types:
  ch: 4 (50%)
  viz: 2 (25%)
  doc: 1 (12.5%)
  stat: 1 (12.5%)
```

**File content diff:**

```
> steno:diff n_003 n_007 +files

Comparing outputs...

--- n_003: filtered.csv
+++ n_007: filtered_norm.csv

@@ Header @@
- id,value,category
+ id,raw_value,normalized_value,category

@@ Row 1 @@
- 1,42.5,A
+ 1,42.5,0.425,A

@@ Summary @@
  45 rows compared
  0 rows removed
  1 column added
  1 column renamed
```

**Statistical diff:**

```
> steno:diff @deseq2:^ @ancombc:^ +stats

Statistical comparison: DESeq2 vs ANCOM-BC

Method comparison:
  DESeq2: Negative binomial GLM
  ANCOM-BC: Bias-corrected compositional

Results overlap:
  Significant in both: 12 features
  DESeq2 only: 3 features
  ANCOM-BC only: 5 features

Correlation: r=0.87 (p<0.001)

Top differences:
  Feature_A: DESeq2 p=0.001, ANCOM-BC p=0.12
  Feature_B: DESeq2 p=0.08, ANCOM-BC p=0.002
```

**Behavior:**
1. Compare node metadata (command, timestamp, status)
2. Compare outputs (files created/modified)
3. If files are data files, show structural diff
4. If files are code, show line diff
5. For branches, find common ancestor and show divergence
6. `+files` includes actual content comparison
7. `+stats` extracts and compares numerical results

### steno:transcript

Link steno nodes to conversation transcripts for full context.

Integrates with [claude-code-transcripts](https://github.com/simonw/claude-code-transcripts) to connect terse steno commands with complete conversation history.

**Check transcript tool status:**

```
> steno:transcript

Transcript status:
  claude-code-transcripts: not installed
  Archive link: not configured

Setup options:
  1. Install: pip install claude-code-transcripts
  2. Or link existing archive: steno:transcript +link <path>
```

**Link to existing archive:**

```
> steno:transcript +link ./archive/

Scanning archive for sessions...
  Found: 5 sessions, 127 messages

Linking steno nodes to transcript positions...
  Matched: 23 nodes across 2 sessions

Links saved to .steno/transcript-links.json

Use steno:transcript n_XXX to open transcript at node.
```

**Link to remote archive:**

```
> steno:transcript +link https://example.com/transcripts/

Remote transcript base URL set.
Links will open: https://example.com/transcripts/{session}.html#{node}

Saved to .steno/transcript-links.json
```

**View transcript for specific node:**

```
> steno:transcript n_005

Opening transcript for n_005...
  Session: sess_20251228_143000
  Command: ch:@api.ts +auth

Opening: ./archive/sess_20251228.html#n_005
```

**View transcript for bookmark:**

```
> steno:transcript @baseline

Opening transcript for bookmark "baseline" (n_003)...
  Session: sess_20251228_143000
  Command: dx:@api.ts ~deep

Opening: ./archive/sess_20251228.html#n_003
```

**View current node transcript:**

```
> steno:transcript ^

Opening transcript for last node (n_012)...
Opening: ./archive/sess_20251228.html#n_012
```

**Show transcript links status:**

```
> steno:transcript +status

Transcript configuration:
  Base URL: ./archive/
  Sessions linked: 3
  Nodes linked: 47

Recent links:
  n_010: sess_20251228.html#n_010
  n_011: sess_20251228.html#n_011
  n_012: sess_20251228.html#n_012
```

**Clear transcript links:**

```
> steno:transcript +clear

Cleared transcript links.
  Removed: .steno/transcript-links.json
```

**Command options:**

| Command | Action |
|---------|--------|
| `steno:transcript` | Show status and setup help |
| `steno:transcript +link <path>` | Link to local archive directory |
| `steno:transcript +link <url>` | Link to remote archive URL |
| `steno:transcript n_XXX` | Open transcript at specific node |
| `steno:transcript @bookmark` | Open transcript at bookmarked node |
| `steno:transcript ^` | Open transcript for last node |
| `steno:transcript +status` | Show link configuration |
| `steno:transcript +clear` | Remove transcript links |

**Behavior:**

1. Check for transcript configuration in `.steno/transcript-links.json`
2. For `+link`: Scan archive directory or store base URL
3. For node references: Look up URL and open in browser
4. Node anchors use format: `{base}/{session}.html#{node_id}`

**Transcript links file format:**

```json
{
  "version": "1.0",
  "base_url": "./archive/",
  "type": "local",
  "linked_at": "2025-12-28T15:30:00Z",
  "sessions": {
    "sess_20251228_143000": {
      "file": "sess_20251228.html",
      "nodes": ["n_001", "n_002", "n_003"]
    }
  }
}
```

**Opening transcripts:**

When opening a transcript:
1. Look up node's session in transcript-links.json
2. Construct URL: `{base_url}/{session_file}#{node_id}`
3. Open in default browser (or display URL if browser unavailable)

For local paths, use `open` (macOS), `xdg-open` (Linux), or `start` (Windows).

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

### Alias Errors

**Invalid alias name:**
```
> steno:alias 123 "dx:@file"

⚠ Invalid alias name: "123"
  Alias names must start with a letter and contain only alphanumeric characters.
```

**Reserved name:**
```
> steno:alias dx "mk:api"

⚠ Reserved name: "dx" is a steno verb.
  Choose a different name that doesn't conflict with: dx mk ch rm fnd viz stat ts doc
```

**Alias not found (remove):**
```
> steno:alias -missing

⚠ Alias not found: "missing"
  Use steno:alias to list available aliases.
```

**Invalid alias syntax:**
```
> steno:alias setup

⚠ Missing command: steno:alias requires a command string.
  Usage: steno:alias name "command"
  Example: steno:alias setup "dx:@package.json && ts:@tests/"
```

### Search Errors

**No matches:**
```
> steno:search quantum-computing

No matches found for "quantum-computing".
  Try: steno:search with a different pattern
  Or: steno:history to see all commands
```

**Empty history:**
```
> steno:search auth

⚠ No history: No commands to search.
  Run some commands first.
```

**Invalid search syntax:**
```
> steno:search

⚠ Missing pattern: steno:search requires a search term.
  Usage: steno:search pattern
  Examples:
    steno:search validation
    steno:search :viz
    steno:search +auth
```

### Replay Errors

**Node not found:**
```
> steno:replay n_999

⚠ Node not found: n_999
  Use steno:history to see available nodes.
```

**Invalid range:**
```
> steno:replay n_010..n_005

⚠ Invalid range: End node (n_005) is before start node (n_010).
  Use: steno:replay n_005..n_010
```

**Bookmark not found:**
```
> steno:replay @missing..

⚠ Bookmark not found: "missing"
  Available bookmarks: baseline, clean-data
  Use steno:history to see bookmark names.
```

**Empty range:**
```
> steno:replay n_005..n_005

Replaying single node: n_005
  ch:@data.csv +normalize
  → Updated normalized.csv
```

**Replay failed:**
```
> steno:replay n_003..n_007

Replaying 5 commands...

  n_003: dx:@data.csv → OK
  n_004: ch:^ +filter → OK
  n_005: ch:@missing.csv +normalize

⚠ Replay stopped: File not found: missing.csv
  Completed: 2 of 5 commands

  Options:
  - Fix the issue and run: steno:replay n_005..n_007
  - Skip failures: steno:replay n_003..n_007 +skip-failed
```

### Template Errors

**Template not found:**
```
> steno:template unknown-template

⚠ Template not found: "unknown-template"
  Built-in: react-component, api-endpoint, refactor, test-suite
  Custom: (none)

  Use steno:template to list available templates.
```

**Missing required parameter:**
```
> steno:template react-component

⚠ Missing required parameter: {name}
  Usage: steno:template react-component <name> [style:<css|scss>]
  Example: steno:template react-component Button style:scss
```

**Invalid parameter:**
```
> steno:template react-component Button style:invalid

⚠ Invalid parameter value: style must be one of: css, scss, styled
  Using default: css
```

**Template already exists:**
```
> steno:template +create setup

⚠ Template exists: "setup" already exists.
  Use steno:template -setup to remove it first.
  Or choose a different name.
```

**Cannot remove built-in:**
```
> steno:template -react-component

⚠ Cannot remove built-in template: "react-component"
  Only custom templates can be removed.
```

**Template execution failed:**
```
> steno:template api-endpoint users

Running template "api-endpoint"...

  Step 1/3: mk:routes/users.ts +rest → OK
  Step 2/3: mk:controllers/users.ts +validation

⚠ Template stopped: Directory controllers/ not found
  Completed: 1 of 3 commands

  Options:
  - Create directory: mkdir controllers && steno:template api-endpoint users
  - Continue from step 2: steno:replay n_XXX..
```

### Diff Errors

**Node not found:**
```
> steno:diff n_003 n_999

⚠ Node not found: n_999
  Use steno:history to see available nodes.
```

**Cannot diff same node:**
```
> steno:diff n_003 n_003

⚠ Same node: Cannot diff n_003 with itself.
  Use steno:diff n_003 n_XXX to compare different nodes.
```

**Branch not found:**
```
> steno:diff @main @missing-branch

⚠ Branch not found: "missing-branch"
  Available branches: main, experiment, feature-x

  Use steno:branches to see all branches.
```

**No outputs to compare:**
```
> steno:diff n_001 n_002

⚠ No outputs to compare:
  n_001: dx:@data.csv (diagnostic only, no outputs)
  n_002: ?plan refactor (planning only, no outputs)

  Diff requires nodes with file outputs.
  Try: steno:diff n_003 n_007 (both have outputs)
```

**Invalid range:**
```
> steno:diff n_010..n_003

⚠ Invalid range: End node (n_003) is before start node (n_010).
  Use: steno:diff n_003..n_010
```

### Parameterized Alias Errors

**Missing required argument:**
```
> explore

⚠ Missing argument: Alias "explore" requires 2 arguments.
  Usage: explore <file> <pattern>
  Example: explore src/app.ts TODO
```

**Too many arguments:**
```
> explore src/app.ts TODO extra-arg

⚠ Too many arguments: Alias "explore" takes 2 arguments, got 3.
  Usage: explore <file> <pattern>
```

**Invalid named parameter:**
```
> test file:utils.ts unknown:value

⚠ Unknown parameter: "unknown"
  Valid parameters for "test": file, coverage
  Usage: test file:<path> [coverage:<level>]
```

### Transcript Errors

**Not configured:**
```
> steno:transcript n_005

⚠ Transcripts not configured.
  Link an archive first: steno:transcript +link <path>

  Options:
  1. Generate archive: pip install claude-code-transcripts
     Then: claude-code-transcripts all -o archive/
  2. Link existing: steno:transcript +link ./archive/
```

**Archive not found:**
```
> steno:transcript +link ./missing-archive/

⚠ Archive not found: ./missing-archive/
  Directory does not exist.

  Generate with: claude-code-transcripts all -o ./missing-archive/
```

**No HTML files in archive:**
```
> steno:transcript +link ./empty-folder/

⚠ No transcripts found in ./empty-folder/
  Expected HTML files from claude-code-transcripts.

  Generate with: claude-code-transcripts all -o ./empty-folder/
```

**Node not found:**
```
> steno:transcript n_999

⚠ Node not found: n_999
  Use steno:history to see available nodes.
```

**Node not linked:**
```
> steno:transcript n_005

⚠ No transcript link for n_005.
  Node exists but wasn't matched to a transcript session.

  Try: steno:transcript +link <path> to rescan archive.
```

**Invalid URL:**
```
> steno:transcript +link not-a-url

⚠ Invalid path or URL: not-a-url
  Use a local path: steno:transcript +link ./archive/
  Or a URL: steno:transcript +link https://example.com/archive/
```

**Cannot open browser:**
```
> steno:transcript n_005

Transcript URL: ./archive/sess_20251228.html#n_005

⚠ Could not open browser automatically.
  Open the URL above manually, or set BROWSER environment variable.
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
