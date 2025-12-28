# Steno-Graph

A stenographic grammar for efficient human-AI coding collaboration.

## The Insight

Court stenographers capture complex proceedings at 225+ WPM using compressed, structured input. Steno-graph brings this efficiency to AI coding interfaces.

Instead of:
```
"Please analyze the samples.csv file and give me a summary of the data"
```

Type:
```
dx:@samples.csv
```

## How It Works

Steno-graph is a **skill** that teaches Claude the stenographic grammar. Claude becomes the parser, interpreter, and executor.

```
You type:     dx:@samples.csv
     ↓
Claude recognizes the pattern
     ↓
Executes directly, returns results
```

No preprocessing. No hooks. No separate parser. Claude learns the grammar and generalizes to novel commands.

## Installation

Copy the skill to your project:

```bash
mkdir -p .claude/skills
cp -r path/to/steno-graph/.claude/skills/steno .claude/skills/
```

Or copy to your personal skills for all projects:

```bash
cp -r path/to/steno-graph/.claude/skills/steno ~/.claude/skills/
```

## Usage

In Claude Code, type steno commands directly:

```bash
# Diagnose/explore
dx:@data.csv

# Make something
mk:api +auth +cache .ts

# Change/modify
ch:@login.py +validation

# Visualize
viz:heatmap @expression.csv
viz:pca @samples.csv .plot:png

# Statistics
stat:ttest @treated.csv @control.csv

# Planning mode
?plan microservices-architecture

# Deep thinking
dx:@codebase ~deep

# Ask before acting
stat:test? @data.csv
```

## Grammar

### Core Pattern
```
[mode][verb]:[target] [@refs] [+additions] [-exclusions] [.flags] [precision]
```

### Verbs

| Verb | Meaning |
|------|---------|
| `dx` | Diagnose/explore |
| `mk` | Make/create |
| `ch` | Change/modify |
| `rm` | Remove/delete |
| `fnd` | Find/search |
| `viz` | Visualize |
| `stat` | Statistics |
| `ts` | Test |
| `doc` | Document |

### Modifiers

| Syntax | Meaning |
|--------|---------|
| `@file.ext` | File reference |
| `@name` | Bookmark reference |
| `^` | Previous output |
| `+feature` | Add/include |
| `-thing` | Exclude |
| `.flag` | Apply flag |
| `.flag:value` | Flag with qualifier |

### Precision

| Marker | Meaning |
|--------|---------|
| `~` | Flexible (use judgment) |
| `!` | Exact (literal) |
| `?` | Clarify first |
| `~deep` | Extended thinking |

### Modes

| Mode | Meaning |
|------|---------|
| `?plan` | Planning mode |
| `?sketch` | Rough implementation |
| `?challenge` | Critique/pushback |

## Examples

### Data Analysis Workflow
```bash
dx:@samples.csv                    # Explore data
ch:@samples.csv +normalize         # Normalize
viz:pca @samples.csv .plot:png     # PCA visualization
viz:heatmap @samples.csv           # Heatmap
stat:ttest @samples.csv @meta.csv  # Statistical test
```

### Code Development
```bash
mk:api +auth +rate-limit .ts       # Create API
ch:@login.py +validation           # Add validation
ts:@utils.ts                       # Run tests
?plan refactor-auth                # Plan refactoring
```

## Session Graph

Steno tracks commands in `.steno/` for cross-session memory and workflow continuity.

### Chaining Commands

```bash
dx:@samples.csv              # Analyze data (n_001)
ch:^ +normalize              # ^ = samples.csv from previous
viz:heatmap ^                # ^ = normalized output
steno:bookmark baseline      # Save for later reference
```

### Cross-Session Memory

```bash
# New session
steno:history                # Shows previous commands
stat:ttest @baseline @new    # @baseline resolves from bookmark
```

### Session Commands

| Command | Action |
|---------|--------|
| `steno:history` | Show command history |
| `steno:stale` | Check for stale outputs |
| `steno:refresh` | Re-run stale commands |
| `steno:bookmark <name>` | Save last command as reference |
| `steno:status` | Show session status |

### Stale Detection

When input files change, steno detects which outputs need refreshing:

```bash
# After modifying samples.csv
steno:stale
# Reports: n_001, n_002, n_003 need refresh

steno:refresh
# Re-runs stale commands in order
```

## Why This Works

1. **Structure in** — Steno provides unambiguous structure
2. **Claude interprets** — Handles fuzziness and novel commands
3. **Direct execution** — No waiting for clarification on clear commands
4. **Generalization** — Claude extends the grammar to new contexts

## Repository Structure

```
steno-graph/
├── .claude/skills/steno/   # The skill (Claude learns the grammar)
├── .steno/                 # Session graph (created on first use)
│   ├── graph.json         # All sessions + bookmarks
│   └── current-session.json
├── spec/                   # Formal grammar specification
│   ├── grammar/           # Parser reference implementation
│   └── extensions/        # Extension system reference
├── design/                 # Architecture documentation
├── examples/
│   └── vignette/          # Sample data and workflows
├── archive/               # Historical: mapper, daemon examples
└── README.md
```

## Philosophy

> *"If you're typing, you're doing it wrong."*

The goal is **flow** — minimal keystrokes, maximum precision, direct execution. Steno-graph is a shared language between you and Claude that enables this flow.

---

*Structure in, intelligence where needed.*
