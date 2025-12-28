# Steno-Graph + Biostack Integration Design

## Overview

This document describes the architecture for integrating steno-graph (grammar layer) with biostack (execution layer) to provide:

- **Intent traceability**: From terse command to validated computation
- **Layered provenance**: Workflow tracking + artifact-level reproducibility
- **Graceful degradation**: Works without biostack, enhanced with biostack

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                           │
│                                                                 │
│  stat:diff @counts.csv @metadata.csv .method:permanova          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     STENO-GRAPH LAYER                           │
│                     (Grammar & Workflow)                        │
│                                                                 │
│  • Command recognition via SKILL.md                             │
│  • Workflow tracking (.steno/graph.json)                        │
│  • Branching (fork/switch/compare/merge/abandon)                │
│  • Bookmarks, history, export/import                            │
│                                                                 │
│  Outputs: Steno node with execution reference                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND ROUTER                              │
│                                                                 │
│  1. Check if biostack daemon running (GET localhost:3000/health)│
│  2. If YES → Route to biostack backend                          │
│  3. If NO  → Fall back to native execution (Claude interprets)  │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────────────┐
│    NATIVE BACKEND       │     │       BIOSTACK BACKEND          │
│                         │     │                                 │
│  Claude interprets      │     │  1. Translate steno → DSL       │
│  command and executes   │     │  2. POST /eval to daemon        │
│  using available tools  │     │  3. Receive execution results   │
│  (simulation/approx)    │     │  4. Return provenance IDs       │
│                         │     │                                 │
│  No provenance hashes   │     │  Full SHA-256 provenance        │
└─────────────────────────┘     └─────────────────────────────────┘
```

## Command Translation

### Steno → Biostack DSL Mapping

| Steno Command | Biostack DSL |
|---------------|--------------|
| `dx:@counts.csv` | `counts \|> diagnose()` |
| `ch:@counts.csv +normalize .method:clr` | `counts \|> clr()` |
| `ch:@counts.csv +normalize .method:tmm` | `counts \|> tmm()` |
| `ch:@counts.csv +filter .prevalence:0.1` | `counts \|> filter_prevalence(0.1)` |
| `stat:alpha @counts.csv .metrics:shannon` | `counts \|> alpha_diversity("shannon")` |
| `stat:beta @counts.csv .distance:bray` | `counts \|> beta_diversity("bray")` |
| `stat:diff .method:permanova` | `counts \|> permanova(~ condition)` |
| `stat:diff .method:deseq2` | `counts \|> median_of_ratios() \|> fit_glm() \|> wald()` |
| `stat:diff .method:ancombc` | `counts \|> ancom_bc(~ condition)` |
| `viz:pcoa @counts.csv` | `counts \|> beta_diversity("bray") \|> pcoa() \|> plot()` |
| `viz:heatmap @counts.csv` | `counts \|> plot(type: "heatmap")` |

### Translation Rules

1. **Verb mapping**:
   - `dx:` → `diagnose()` primitive
   - `ch: +normalize` → normalization primitive (tmm, clr, etc.)
   - `ch: +filter` → filter primitive
   - `stat:alpha` → `alpha_diversity()`
   - `stat:beta` → `beta_diversity()`
   - `stat:diff` → appropriate test primitive
   - `viz:` → ordination + `plot()` or direct `plot()`

2. **Method flag mapping**:
   - `.method:X` maps to specific primitive or primitive chain
   - Unknown methods: attempt direct primitive lookup

3. **Parameter extraction**:
   - `.param:value` → named parameter in DSL
   - Example: `.trim:0.3` → `tmm(trim_m: 0.3)`

## Provenance Integration

### Layered Provenance Model

```
STENO LAYER                          BIOSTACK LAYER
(Intent & Workflow)                  (Execution & Artifacts)

┌─────────────────┐                  ┌─────────────────────────┐
│ n_005           │                  │ exec_012                │
│                 │                  │ primitive: filter_prev  │
│ raw: stat:diff  │──────────────────│ params: {threshold: 0.1}│
│ branch: main    │                  │ input:  sha256:abc...   │
│ bookmark: base  │                  │ output: sha256:def...   │
│                 │                  └─────────────────────────┘
│ execution: ─────┼──────────────────┐
│   backend: bio  │                  │
│   primitives:   │                  ▼
│   - exec_012    │                  ┌─────────────────────────┐
│   - exec_013    │                  │ exec_013                │
└─────────────────┘                  │ primitive: permanova    │
                                     │ params: {formula: ~cond}│
                                     │ input:  sha256:def...   │
                                     │ output: sha256:ghi...   │
                                     │ steno_ref: n_005        │
                                     └─────────────────────────┘
```

### Steno Node Schema (Extended)

```json
{
  "id": "n_005",
  "timestamp": "2025-12-27T14:30:00Z",
  "raw": "stat:diff @counts.csv @metadata.csv .method:permanova",
  "status": "complete",
  "branch": "main",
  "inputs": ["counts.csv", "metadata.csv"],
  "outputs": ["permanova_results.csv"],
  "summary": "PERMANOVA R²=0.42, p<0.001",

  "execution": {
    "backend": "biostack",
    "session_id": "sess_20251227_143000",
    "version_id": "v_001",
    "dsl_expression": "counts |> filter_prevalence(0.1) |> permanova(~ condition)",
    "primitives": [
      {
        "execution_id": "exec_012",
        "name": "filter_prevalence",
        "params": {"threshold": 0.1},
        "input_hash": "sha256:abc123...",
        "output_hash": "sha256:def456..."
      },
      {
        "execution_id": "exec_013",
        "name": "permanova",
        "params": {"formula": "~ condition", "permutations": 999},
        "input_hash": "sha256:def456...",
        "output_hash": "sha256:ghi789..."
      }
    ],
    "total_time_ms": 1523,
    "cache_hit": false
  }
}
```

### Biostack Provenance Extension

Biostack's provenance.db gains a `steno_ref` field:

```sql
ALTER TABLE executions ADD COLUMN steno_ref TEXT;
-- References the steno node ID that triggered this execution
-- Enables querying: "What steno commands led to this artifact?"
```

## Branching Integration

### Two-Tier Branch Model

| Command | Steno Effect | Biostack Effect | Use Case |
|---------|--------------|-----------------|----------|
| `fork:name` | Create steno branch | None | Quick exploration |
| `fork:name !` | Create steno branch | Fork biostack session | Computational isolation |
| `switch:name` | Switch steno branch | Switch biostack session (if forked) | Navigation |
| `merge:name` | Mark steno merged | Reconcile biostack (if forked) | Adopt work |
| `abandon:name` | Mark steno abandoned | Discard biostack fork (if exists) | Discard work |

### Branch State Tracking

```json
// In .steno/graph.json branches array
{
  "name": "experiment",
  "parentNode": "n_003",
  "parentBranch": "main",
  "status": "active",
  "biostack": {
    "coupled": true,
    "session_id": "sess_experiment_001",
    "forked_from": "sess_main_001",
    "forked_at": "2025-12-27T15:00:00Z"
  }
}
```

### Branch Comparison Enhancement

`compare:branch-a branch-b` shows:

1. **Steno-level differences**: Commands, bookmarks, node counts
2. **Biostack-level differences**: Artifact hashes, primitive chains
3. **Artifact diff**: Which outputs differ and how

```
> compare:main experiment

STENO COMPARISON:
  main: 5 nodes, 1 bookmark
  experiment: 3 nodes, 0 bookmarks

  Different commands:
    main n_004: stat:diff .method:wilcoxon
    exp  n_006: stat:diff .method:permanova

BIOSTACK COMPARISON:
  Shared ancestors: exec_001, exec_002, exec_003

  main artifacts:
    wilcoxon_results.csv (sha256:aaa...)

  experiment artifacts:
    permanova_results.csv (sha256:bbb...)

  Diverged at: exec_003 (filter_prevalence output)
```

## Implementation Phases

### Phase 1: Backend Detection

Add to SKILL.md:

```markdown
## Execution Backends

When executing steno commands, check for available backends:

### Biostack Backend Detection

Before executing `stat:`, `viz:`, or `ch:` commands on data files:

1. Check if biostack daemon is running:
   ```
   curl -s http://localhost:3000/health
   ```

2. If response OK:
   - Route command to biostack
   - Record execution provenance
   - Display biostack-enhanced output

3. If no response:
   - Fall back to native execution
   - Note: "Running in native mode (biostack not detected)"
```

### Phase 2: Command Translation

Create translation layer in skill:

```markdown
### Biostack Command Translation

When routing to biostack, translate steno grammar to biostack DSL:

| Steno Pattern | Biostack DSL |
|---------------|--------------|
| `stat:diff .method:permanova` | `data \|> permanova(~ condition)` |
| `ch:@data +normalize .method:tmm` | `data \|> tmm()` |
| ... | ... |

Post the translated DSL to biostack:
```
POST http://localhost:3000/eval
Content-Type: application/json

{"expression": "<translated DSL>"}
```
```

### Phase 3: Provenance Linking

Extend node schema to include biostack references:

```markdown
### Recording Biostack Provenance

After successful biostack execution, record in node:

```json
{
  "execution": {
    "backend": "biostack",
    "primitives": [...],  // From biostack response
    "artifact_hashes": {...}  // SHA-256 from biostack
  }
}
```
```

### Phase 4: Unified Branching

Implement two-tier branching:

```markdown
### Biostack-Coupled Branching

`fork:name !` (with !) creates coupled branch:

1. Create steno branch as normal
2. Call biostack: `POST /sessions/fork`
3. Record biostack session ID in branch metadata
4. Future commands on this branch go to forked biostack session
```

## API Contracts

### Steno → Biostack

**Health Check:**
```
GET http://localhost:3000/health
Response: {"status": "ok", "version": "1.0.0"}
```

**Execute DSL:**
```
POST http://localhost:3000/eval
Content-Type: application/json

{
  "expression": "counts |> filter_prevalence(0.1) |> permanova(~ condition)",
  "steno_ref": "n_005"
}

Response: {
  "success": true,
  "executions": [
    {
      "execution_id": "exec_012",
      "primitive": "filter_prevalence",
      "params": {"threshold": 0.1},
      "input_hash": "sha256:...",
      "output_hash": "sha256:...",
      "time_ms": 45
    },
    ...
  ],
  "result": { ... }
}
```

**Fork Session:**
```
POST http://localhost:3000/sessions/fork
Content-Type: application/json

{
  "name": "experiment",
  "steno_branch": "experiment"
}

Response: {
  "session_id": "sess_experiment_001",
  "forked_from": "sess_main_001"
}
```

### Biostack → Steno (Optional)

Biostack could query steno for context:

```
GET http://localhost:3001/steno/context
Response: {
  "current_branch": "main",
  "last_node": "n_004",
  "bookmarks": {...}
}
```

## Error Handling

### Backend Unavailable

```
> stat:diff @counts.csv .method:permanova

⚠ Biostack not running: Executing in native mode.
  For validated computation, start biostack: bio start

[Proceeds with Claude-interpreted execution]
```

### Translation Failure

```
> stat:diff .method:unknown-method

⚠ Unknown method: unknown-method
  Biostack primitives: permanova, wilcoxon, deseq2, ancombc

  Falling back to native execution...
```

### Biostack Execution Error

```
> stat:diff @counts.csv .method:permanova

⚠ Biostack error: Missing metadata column 'condition'

  Required: metadata.csv with 'condition' column
  Found: sample_id, age, sex, bmi
```

## Benefits

1. **Graceful degradation**: Steno works standalone, enhanced with biostack
2. **Full traceability**: Intent → command → primitive → artifact (SHA-256)
3. **Reproducibility**: Biostack artifacts are content-addressed
4. **Validation**: Results validated against bioanvil ground truth
5. **Flexibility**: Two-tier branching for exploration vs. computation
6. **Portability**: Export workflow, replay against any biostack instance

## Future Extensions

### Multi-Backend Support

```
┌─────────────────────────────────────────┐
│           STENO GRAMMAR                 │
└─────────────────────────────────────────┘
         │
         ├── Biostack (bioinformatics)
         ├── MLstack (machine learning) [future]
         ├── Webstack (web development) [future]
         └── Native (Claude interprets)
```

### Workflow Templates

Pre-built steno workflows with biostack backends:

```
steno:template microbiome-16s
# Loads: dx: → filter → normalize → diversity → diff → viz
# Pre-configured for biostack execution
```

### Cross-Project Provenance

Query across projects:

```
steno:search "permanova R² > 0.3"
# Searches all .steno/ directories
# Returns nodes with matching biostack results
```
