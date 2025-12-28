# Skill Update Sketch

How the skill changes to support the session graph.

## Current Skill (abbreviated)

```markdown
# Steno: Stenographic Command Interface

You understand and execute stenographic shorthand...

## Execution Rules

When you see a clear steno command, execute immediately:
- dx:@file.csv → Read the file, provide analysis
- mk:component → Create the component
...
```

## Updated Skill

```markdown
# Steno: Stenographic Command Interface

You understand and execute stenographic shorthand...

## Session Tracking

Steno commands are tracked in `.steno/` for cross-session memory.

### On Session Start

1. Check if `.steno/current-session.json` exists
2. If yes, read and summarize recent commands:
   ```
   > Previous session (Dec 26):
   >   dx:@samples.csv → 18 samples analyzed
   >   ch:^ +normalize → normalized_samples.csv created
   ```
3. Check for stale outputs (see Stale Detection)

### After Each Command

After executing a steno command, log it:

1. Read `.steno/current-session.json` (create if missing)
2. Append a node:
   ```json
   {
     "id": "n_004",
     "timestamp": "2024-12-27T14:30:22Z",
     "raw": "viz:pca @normalized.csv",
     "status": "complete",
     "inputs": ["normalized_samples.csv"],
     "outputs": ["pca_plot.png"],
     "summary": "PCA plot showing treatment vs control separation"
   }
   ```
3. Write back to `.steno/current-session.json`

### Structured Output Format

End each steno command execution with:

```
---
Inputs: samples.csv, metadata.csv
Outputs: normalized_samples.csv (created)
Summary: Normalized 18 samples using TMM method
---
```

This helps track file dependencies.

## Reference Resolution

### The `^` Reference

When you see `^`:
1. Read `.steno/current-session.json`
2. Find the last node
3. Use its outputs as the input for this command

Example:
```
> dx:@samples.csv
[outputs: samples.csv analyzed]

> ch:^ +normalize
[^ resolves to samples.csv from previous command]
```

### Named References `@name`

When you see `@name` that isn't a file path:
1. Check `.steno/graph.json` for bookmarks
2. If found, resolve to that node's outputs

Example:
```
> stat:ttest @baseline-pca @new-data
[@baseline-pca resolves to pca_results.csv from bookmarked node]
```

## Stale Detection

### On Session Start

1. Read `.steno/graph.json`
2. For each node with outputs:
   - Check if input files have changed (compare mtime)
   - If changed, mark as stale
3. Report stale nodes:
   ```
   > ⚠️  Stale nodes:
   >   n_003: viz:pca (input normalized.csv changed)
   >
   > Run `steno:refresh` to update
   ```

## Special Commands

| Command | Action |
|---------|--------|
| `steno:history` | Show command history across sessions |
| `steno:stale` | Check for stale outputs |
| `steno:refresh` | Re-run stale nodes |
| `steno:bookmark <name>` | Save current node as named reference |
| `steno:clear` | Clear current session |

### steno:history

```
> steno:history

Session Dec 27 (current):
  n_004: viz:pca @normalized.csv ✓
  n_003: ch:@samples.csv +normalize ✓

Session Dec 26:
  n_002: dx:@samples.csv ✓
  n_001: mk:analysis-script ✓
```

### steno:stale

```
> steno:stale

Checking file modifications...

Stale:
  n_003: ch:@samples.csv +normalize
         ↳ samples.csv modified Dec 27 10:15

Affected downstream:
  n_004: viz:pca @normalized.csv
         ↳ depends on n_003

Run `steno:refresh` to update, or `steno:refresh n_003` for specific node.
```

### steno:bookmark

```
> viz:pca @samples.csv .plot:png

[creates pca_plot.png]

> steno:bookmark baseline-pca

Bookmarked n_004 as "baseline-pca"
Use @baseline-pca to reference this output.
```

## File Structure

```
project/
├── .steno/
│   ├── graph.json           # All sessions, bookmarks
│   ├── current-session.json # Active session
│   └── .gitignore           # Ignore current-session
```

### graph.json

```json
{
  "version": "1.0",
  "project": "/Users/scott/Code/my-project",
  "sessions": [
    {
      "id": "sess_20241226",
      "created": "2024-12-26T09:00:00Z",
      "nodes": [...]
    }
  ],
  "bookmarks": {
    "baseline-pca": "n_003"
  }
}
```

### current-session.json

```json
{
  "id": "sess_20241227",
  "created": "2024-12-27T14:00:00Z",
  "nodes": [
    {
      "id": "n_004",
      "timestamp": "2024-12-27T14:30:22Z",
      "raw": "viz:pca @normalized.csv",
      "status": "complete",
      "inputs": ["normalized_samples.csv"],
      "outputs": ["pca_plot.png"],
      "summary": "PCA showing treatment separation"
    }
  ]
}
```

## Implementation Notes

### Creating .steno/ Directory

On first steno command, if `.steno/` doesn't exist:
1. Create `.steno/` directory
2. Create `.steno/.gitignore` with `current-session.json`
3. Initialize `graph.json` with empty sessions

### Session Merging

When starting a new session:
1. If `current-session.json` exists and has nodes
2. Append that session to `graph.json` sessions array
3. Start fresh `current-session.json`

### Node ID Generation

Simple incrementing: `n_001`, `n_002`, etc.
Reset per session or global? **Global** - makes cross-session references unambiguous.

Keep a counter in `graph.json`:
```json
{
  "nextNodeId": 47,
  ...
}
```
```

