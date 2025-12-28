---
name: steno
description: Execute stenographic shorthand commands for efficient coding. Triggers on verb-colon-target patterns and steno-colon commands for session management.
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

## Modifiers

| Syntax | Meaning | Example |
|--------|---------|---------|
| `@file.ext` | File reference | `dx:@data.csv` |
| `@name` | Named reference or bookmark | `ch:@auth-module` |
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

---

## Session Commands

### steno:help

Show quick reference for steno commands.

```
> steno:help

VERBS: dx mk ch rm fnd viz stat ts doc
REFS:  @file.csv  ^  @bookmark
MODS:  +add  -exclude  .flag  .flag:value
PREC:  ~flexible  !exact  ?clarify  ~deep

SESSION:
  steno:history   - command history
  steno:stale     - check for stale outputs
  steno:refresh   - re-run stale commands
  steno:bookmark  - save reference
  steno:new-session - archive and start fresh
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
     "version": "1.0",
     "project": "/path/to/project",
     "nextNodeId": 1,
     "sessions": [],
     "bookmarks": {}
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
