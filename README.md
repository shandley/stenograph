# Steno-Graph

A stenographic grammar for efficient human-AI coding collaboration.

## The Idea

Court stenographers capture complex proceedings at 225+ WPM using compressed, structured input. Steno-graph brings this efficiency to AI coding.

Instead of:
```
"Please analyze the samples.csv file and give me a summary of the data"
```

Type:
```
dx:@samples.csv
```

Claude learns the grammar and executes directly.

## Installation

```bash
# Clone the repo
git clone https://github.com/shandley/stenograph.git

# Copy skill to your project
mkdir -p .claude/skills
cp -r stenograph/.claude/skills/steno .claude/skills/

# Or install globally for all projects
cp -r stenograph/.claude/skills/steno ~/.claude/skills/
```

## Quick Start

In Claude Code, type steno commands directly:

```bash
dx:@data.csv                  # Analyze a file
mk:api +auth +cache           # Create something with features
ch:@login.py +validation      # Modify existing code
viz:pca @samples.csv          # Visualize data
?plan microservices           # Plan before acting
```

## Grammar

### Pattern
```
[mode][verb]:[target] [@refs] [+add] [-exclude] [.flag] [precision]
```

### Verbs

| Verb | Action | Example |
|------|--------|---------|
| `dx` | Diagnose/explore | `dx:@app.ts` |
| `mk` | Make/create | `mk:api +auth` |
| `ch` | Change/modify | `ch:@login.py +validation` |
| `rm` | Remove/delete | `rm:@deprecated` |
| `fnd` | Find/search | `fnd:auth-handlers` |
| `viz` | Visualize | `viz:pca @data.csv` |
| `stat` | Statistics | `stat:ttest @a @b` |
| `ts` | Test | `ts:@utils.ts` |
| `doc` | Document | `doc:@api/` |

### Modifiers

| Syntax | Meaning | Example |
|--------|---------|---------|
| `@file` | File reference | `dx:@src/app.ts` |
| `^` | Previous output | `ch:^ +normalize` |
| `+feat` | Add/include | `mk:api +auth +cache` |
| `-thing` | Exclude | `ch:@config -logging` |
| `.flag` | Apply flag | `mk:component .ts` |

### Precision

| Marker | Meaning |
|--------|---------|
| `~` | Flexible (use judgment) |
| `!` | Exact (literal) |
| `?` | Ask first |
| `~deep` | Extended thinking |

### Modes

| Mode | Effect |
|------|--------|
| `?plan` | Outline before doing |
| `?sketch` | Rough draft for review |
| `?challenge` | Critique/push back |

## Chaining & Memory

Steno tracks commands for workflow continuity:

```bash
dx:@samples.csv              # Analyze (saved as n_001)
ch:^ +normalize              # ^ = previous output
viz:heatmap ^                # Chain continues
steno:bookmark baseline      # Save for later
```

### Session Commands

| Command | Action |
|---------|--------|
| `steno:history` | Show command history |
| `steno:stale` | Check for stale outputs |
| `steno:refresh` | Re-run stale commands |
| `steno:bookmark <name>` | Save as reference |
| `steno:graph` | Show workflow as tree |

## Branching

Explore alternatives without losing work:

```bash
fork:experiment              # Create branch
# ... try something ...
switch:main                  # Go back
compare:main experiment      # See differences
merge:experiment             # Adopt the work
# or
abandon:experiment           # Discard it
```

## Examples

### Data Analysis
```bash
dx:@samples.csv                    # Explore
ch:^ +normalize                    # Transform
viz:pca ^                          # Visualize
stat:ttest @treated @control       # Test
```

### Code Development
```bash
mk:api +auth +rate-limit .ts       # Create
ch:@login.py +validation           # Enhance
ts:@utils.ts                       # Test
?plan refactor-auth ~deep          # Plan with deep thinking
```

### Workflow with Branching
```bash
dx:@codebase                       # Understand
fork:risky-refactor                # Safe branch
ch:@auth.ts +complete-rewrite      # Try it
ts:@auth.ts                        # Test
# If good:
merge:risky-refactor               # Adopt
# If bad:
abandon:risky-refactor             # Discard
```

## Why It Works

1. **Structure in** — Unambiguous, parseable commands
2. **Claude interprets** — Handles fuzziness and novel contexts
3. **Direct execution** — No clarification needed for clear intent
4. **Generalization** — Claude extends the grammar naturally

## Philosophy

> *"If you're typing, you're doing it wrong."*

Minimal keystrokes, maximum precision, direct execution. Steno-graph is a shared language between you and Claude that enables flow.

---

See [CHEATSHEET.md](CHEATSHEET.md) for quick reference.

*Structure in, intelligence where needed.*
