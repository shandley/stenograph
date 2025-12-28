---
name: steno
description: "Execute stenographic shorthand commands. Triggers on patterns like dx:@file, mk:thing, ch:@file +mod, viz:type, stat:test, ?plan, ~deep. Use when you see verb:target syntax with @file references, +additions, -exclusions, .flags, or ? and ~ modifiers."
---

# Steno: Stenographic Command Interface

You understand and execute stenographic shorthand for efficient coding and data analysis.

## Recognition

Execute steno commands when you see this pattern:
```
[mode][verb]:[target] [@refs] [+additions] [-exclusions] [.flags] [precision]
```

**Trigger patterns:**
- `verb:target` (e.g., `dx:@file.csv`, `mk:api`, `ch:login`)
- `verb:type @file` (e.g., `viz:pca @data.csv`, `stat:ttest @a @b`)
- `?mode topic` (e.g., `?plan architecture`, `?sketch auth-flow`)
- Commands ending in `~deep` or `~` or `!` or `?`

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
| `@name` | Named reference | `ch:@auth-module` |
| `+feature` | Add/include | `mk:api +auth +cache` |
| `-thing` | Exclude/without | `ch:@config -logging` |
| `.flag` | Apply flag | `.ts` (TypeScript), `.dry` (dry run) |
| `.flag:value` | Flag with qualifier | `.plot:png`, `.ts:edge` |

## Precision Markers

| Marker | Meaning | Your behavior |
|--------|---------|---------------|
| `~` | Flexible | Use your judgment |
| `!` | Exact/literal | Do exactly what's specified |
| `?` | Clarify | Ask before acting |
| `~deep` | Extended thinking | Think deeply, consider alternatives |

## Modes (prefix with ?)

| Mode | Meaning | Your behavior |
|------|---------|---------------|
| `?plan` | Planning | Outline approach before executing |
| `?sketch` | Sketch | Create rough implementation for review |
| `?challenge` | Challenge | Critique, find issues, push back |
| `?explore` | Explore | Investigate options, think aloud |

## Execution Rules

### Direct Execution (no asking)
When you see a clear steno command, execute immediately:

```
dx:@file.csv       → Read the file, provide analysis
mk:component       → Create the component
ch:@file +feature  → Edit the file to add feature
viz:pca @data      → Generate PCA analysis
stat:ttest @a @b   → Run t-test on the data
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

## Examples

### Data Analysis
```
dx:@samples.csv              → Read and summarize the dataset
ch:@data.csv +normalize      → Add normalization to data processing
viz:heatmap @expression.csv  → Generate heatmap visualization
stat:ttest @treated @control → Compare two groups
```

### Code Development
```
mk:api +auth +rate-limit .ts → Create TypeScript API with auth and rate limiting
ch:@login.py +validation     → Add validation to login
rm:@deprecated -keep-tests   → Remove deprecated code but keep tests
fnd:auth-handlers            → Find authentication-related code
ts:@utils.ts                 → Run tests for utils
```

### Planning & Exploration
```
?plan microservices +docker  → Plan microservices architecture
?sketch auth-flow            → Create rough auth implementation
?challenge current-approach  → Critique what we have
dx:@codebase ~deep           → Deep analysis of the codebase
```

### Chaining Context
```
dx:@data.csv                 → Analyze data
ch:^ +filter-nulls           → Modify based on previous (^)
viz:pca ^                    → Visualize the result
```

## Response Format

When executing steno commands:

1. **Acknowledge** the command briefly (one line)
2. **Execute** immediately using appropriate tools
3. **Report** results concisely

Example:
```
> dx:@samples.csv

Analyzing samples.csv...

[Read file, provide summary]

18 samples, 5 genes, 2 conditions (treatment/control), 3 timepoints.
Treatment group shows upregulation at 24h and 48h.
```

## Remember

- Steno is about **speed** - don't ask unnecessary questions
- Execute **directly** when the intent is clear
- Use **appropriate tools** (Read, Edit, Bash, etc.) without hesitation
- Be **concise** in responses - steno users value efficiency
