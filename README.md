# Steno-Graph

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.2.0-blue.svg)](https://github.com/shandley/stenograph/releases)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-compatible-blueviolet.svg)](https://claude.com/code)

A stenographic grammar for efficient human-AI coding collaboration.

## The Idea

Court stenographers capture complex proceedings at 225+ WPM using compressed, structured input. Steno-graph brings this efficiency to AI coding.

Instead of:
```
"Please look at the app.ts file and add error handling to all the async functions"
```

Type:
```
ch:@app.ts +error-handling
```

Claude learns the grammar and executes directly.

## What Steno-Graph Is

- **A grammar** — Terse, structured commands for expressing intent
- **A workflow tracker** — Session history, branching, bookmarks
- **Domain-agnostic** — Works for any coding task
- **A skill** — Claude learns and interprets the patterns

Steno-graph is about **how you communicate**, not what Claude can do. Execution depends on Claude's available tools.

## Requirements

- [Claude Code](https://claude.com/code) CLI (Anthropic's official coding assistant)

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
dx:@src/app.ts            # Explore a file
mk:api +auth +cache       # Create with features
ch:@config.json +logging  # Modify existing code
ts:@utils.test.js         # Run tests
?plan refactor            # Plan before acting
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
| `viz` | Visualize | `viz:chart @data.csv` |
| `stat` | Statistics | `stat:summary @results.csv` |
| `ts` | Test | `ts:@utils.ts` |
| `doc` | Document | `doc:@api/` |

### Modifiers

| Syntax | Meaning | Example |
|--------|---------|---------|
| `@file` | File reference | `dx:@src/app.ts` |
| `^` | Previous output | `ch:^ +refactor` |
| `@branch:^` | Cross-branch ref | `compare @main:^ @feature:^` |
| `+feat` | Add/include | `mk:api +auth +cache` |
| `-thing` | Exclude | `ch:@config -secrets` |
| `.flag` | Apply flag | `mk:component .tsx` |

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
dx:@src/app.ts           # Explore (saved as n_001)
ch:^ +error-handling     # ^ = previous output
ch:^ +logging            # Chain continues
steno:bookmark baseline  # Save for later
```

### Session Commands

| Command | Action |
|---------|--------|
| `steno:help` | Quick reference |
| `steno:history` | Show command history |
| `steno:graph` | Show workflow as tree |
| `steno:bookmark <name>` | Save as reference |
| `steno:undo` | Undo last command |
| `steno:redo` | Redo undone command |
| `steno:export` | Export workflow |
| `steno:import` | Import workflow |

### Power Commands

| Command | Action |
|---------|--------|
| `steno:alias name "cmd"` | Create command shortcut |
| `steno:search pattern` | Search command history |
| `steno:replay n_001..n_005` | Re-run command sequence |
| `steno:template name` | Run reusable workflow |
| `steno:diff n_001 n_005` | Compare node outputs |

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

### Code Exploration
```bash
dx:@src/                       # Explore directory
dx:@app.ts ~deep               # Deep analysis
fnd:TODO                       # Find all TODOs
```

### Code Modification
```bash
ch:@server.js +validation      # Add validation
ch:@api.ts +error-handling     # Add error handling
mk:middleware/auth.js +jwt     # Create new file
```

### Workflow with Branching
```bash
dx:@codebase                   # Understand
fork:risky-refactor            # Safe branch
ch:@auth.ts +rewrite           # Try it
ts:@auth.test.ts               # Test
# If good:
merge:risky-refactor           # Adopt
# If bad:
abandon:risky-refactor         # Discard
```

### Planning
```bash
?plan microservices +docker    # Plan architecture
?sketch auth-flow              # Draft implementation
?challenge current-approach    # Critique existing code
```

### Power Features
```bash
# Create reusable alias
steno:alias setup "dx:@package.json && ts:@tests/"

# Use alias with parameters
steno:alias greet "dx:@{1}.ts"
greet utils                    # Expands to: dx:@utils.ts

# Run a template
steno:template react-component Button

# Compare workflow states
steno:diff @baseline ^         # Compare bookmark to current
```

## Why It Works

1. **Structure in** — Unambiguous, parseable commands
2. **Claude interprets** — Handles fuzziness and novel contexts
3. **Direct execution** — No clarification needed for clear intent
4. **Generalization** — Claude extends the grammar naturally

## Philosophy

> *"Minimal keystrokes, maximum precision."*

Steno-graph is a shared language between you and Claude that enables flow state coding.

---

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Resources

- [CHEATSHEET.md](CHEATSHEET.md) — Quick reference
- [examples/](examples/) — Usage vignettes
- [Releases](https://github.com/shandley/stenograph/releases) — Version history

## License

MIT License - see [LICENSE](LICENSE) for details.

---

*Structure in, intelligence where needed.*
