# Branching Design

## Overview

Branching allows exploring alternative approaches without losing work. Like git branches, but for steno workflows.

## Use Cases

### 1. Comparing Approaches

```
dx:@data.csv                    # Analyze data
fork:approach-a                 # Create branch
mk:api +caching +redis          # Try caching approach
...

switch:main                     # Go back to fork point
fork:approach-b                 # Create another branch
mk:api +memoization             # Try memoization
...

compare:approach-a approach-b   # See differences
merge:approach-a                # Adopt approach-a
```

### 2. What-If Exploration

```
dx:@samples.csv                 # Analyze
ch:^ +normalize-tmm             # Normalize with TMM

fork:try-deseq                  # Checkpoint, try alternative
ch:@samples.csv +normalize-deseq
viz:pca ^                       # See results

switch:main                     # Didn't like it, go back
# Continue on main branch
```

### 3. Safe Experimentation

```
dx:@codebase ~deep              # Understand code
fork:risky-refactor             # Create safety branch
ch:@auth.ts +complete-rewrite   # Try risky change
ts:@auth.ts                     # Test it

# If tests fail:
switch:main                     # Abandon branch

# If tests pass:
merge:risky-refactor            # Adopt changes
```

---

## Data Model

### Branch Structure

```typescript
interface Branch {
  name: string;              // "main", "approach-a", etc.
  parentNode: string;        // Node ID where branch started (null for main)
  parentBranch: string;      // Branch we forked from (null for main)
  created: string;           // ISO timestamp
  nodes: string[];           // Node IDs on this branch
  status: "active" | "merged" | "abandoned";
}
```

### Updated Node Structure

```typescript
interface StenoNode {
  id: string;
  branch: string;            // NEW: Which branch this node belongs to
  // ... existing fields
}
```

### Updated Graph Structure

```typescript
interface StenoGraph {
  version: "1.1";            // Bump version
  project: string;
  nextNodeId: number;
  sessions: StenoSession[];
  bookmarks: Record<string, string>;
  branches: Branch[];        // NEW: All branches
  currentBranch: string;     // NEW: Active branch name
}
```

### Example Graph State

```json
{
  "version": "1.1",
  "branches": [
    {
      "name": "main",
      "parentNode": null,
      "parentBranch": null,
      "nodes": ["n_001", "n_002"],
      "status": "active"
    },
    {
      "name": "approach-a",
      "parentNode": "n_002",
      "parentBranch": "main",
      "nodes": ["n_003", "n_004"],
      "status": "active"
    },
    {
      "name": "approach-b",
      "parentNode": "n_002",
      "parentBranch": "main",
      "nodes": ["n_005", "n_006"],
      "status": "abandoned"
    }
  ],
  "currentBranch": "approach-a"
}
```

---

## Commands

### fork:name

Create a new branch from current node.

```
> fork:caching

Created branch "caching" from n_002
Switched to branch "caching"
```

**Behavior:**
1. Create new Branch object with parentNode = current node
2. Set currentBranch to new branch
3. Subsequent nodes go on this branch

### switch:name

Switch to an existing branch.

```
> switch:main

Switched to branch "main"
Current node: n_002
```

**Behavior:**
1. Set currentBranch to target branch
2. "Current node" becomes last node on that branch
3. `^` references resolve to that branch's nodes

### branches (or steno:branches)

List all branches.

```
> steno:branches

* approach-a (current, 2 nodes)
  └─ from n_002 on main
  main (3 nodes)
  approach-b (abandoned, 2 nodes)
  └─ from n_002 on main
```

### compare:branch-a branch-b

Compare outputs between branches.

```
> compare:approach-a approach-b

Branch "approach-a":
  n_003: mk:api +caching → api.ts (45 lines)
  n_004: ts:^ → 12 tests passing

Branch "approach-b":
  n_005: mk:api +memoization → api.ts (38 lines)
  n_006: ts:^ → 12 tests passing

Differences:
  - approach-a: Uses Redis for caching
  - approach-b: Uses in-memory memoization
  - approach-a: 7 more lines of code
```

### merge:branch

Merge branch into main (or current branch).

```
> merge:approach-a

Merging "approach-a" into "main"...
  n_003: mk:api +caching → adopting api.ts
  n_004: ts:^ → tests passing

Branch "approach-a" merged.
Files updated: api.ts
```

**Behavior:**
1. Apply file changes from branch to working directory
2. Mark branch as "merged"
3. Optionally copy nodes to main branch history

### abandon:branch

Abandon a branch without merging.

```
> abandon:approach-b

Abandoned branch "approach-b"
Files from that branch were not applied.
```

---

## Reference Resolution with Branches

### The `^` Reference

`^` resolves to the last node **on the current branch**.

```
# On branch "approach-a"
viz:pca ^    # ^ = last output on approach-a, not main
```

### Cross-Branch References

Use `@branch:node` or `@branch:^` for explicit branch references:

```
compare:@approach-a:^ @approach-b:^   # Compare last outputs
ch:@main:n_002 +feature               # Modify from main branch
```

### Bookmarks

Bookmarks can reference any branch:

```
steno:bookmark baseline @main:n_002   # Bookmark specific branch/node
viz:pca @baseline                     # Use bookmark
```

---

## Visualization

### steno:graph

Show branch structure as ASCII tree.

```
> steno:graph

main
├── n_001 dx:@samples.csv
├── n_002 ch:^ +normalize
│   ├── approach-a (current)
│   │   ├── n_003 mk:api +caching
│   │   └── n_004 ts:^
│   └── approach-b (abandoned)
│       ├── n_005 mk:api +memoization
│       └── n_006 ts:^
└── n_007 viz:heatmap ^
```

---

## File State Management

### Challenge

Each branch may have different file states. When switching branches:
- Do we revert files to that branch's state?
- Or just track the commands and let user manage files?

### Options

**Option A: Track-only (simple)**
- Branches only track commands and outputs
- Files stay as-is when switching
- User is responsible for file state
- Compare shows what each branch produced

**Option B: Git-like (complex)**
- Store file diffs per node
- Switching branches reverts files
- Merge applies diffs
- Requires significant infrastructure

### Recommendation

Start with **Option A** (track-only).

Branches record what was done and what was produced. Comparing branches shows the differences. Merging means "I prefer this approach" and marks the branch as adopted.

For file management, rely on git:
```
> fork:risky-change
> git stash                    # Save current state
> [make changes on branch]
> switch:main
> git stash pop                # Restore state
```

---

## Implementation Plan

### Phase 1: Basic Branching
- [ ] Update data model (Branch type, add to graph)
- [ ] `fork:name` command
- [ ] `switch:name` command
- [ ] `steno:branches` listing
- [ ] Update node creation to tag with current branch

### Phase 2: Comparison
- [ ] `compare:a b` command
- [ ] Show node differences
- [ ] Show output differences

### Phase 3: Merge/Abandon
- [ ] `merge:branch` command
- [ ] `abandon:branch` command
- [ ] Branch status tracking

### Phase 4: Visualization
- [ ] `steno:graph` ASCII tree
- [ ] Cross-branch references

---

## Questions to Resolve

1. **Scope**: Should branches be per-session or persist across sessions?
   - Recommendation: Persist in graph.json (branches are workflow, not session)

2. **Naming**: `fork:name` vs `branch:name`?
   - `fork` implies divergence (clearer intent)
   - `branch` is git-familiar
   - Recommendation: Use `fork` for creation, "branch" as the noun

3. **Main branch**: Always called "main" or configurable?
   - Recommendation: Always "main" (simple)

4. **Nested forks**: Can you fork from a fork?
   - Recommendation: Yes, tracked via parentBranch
