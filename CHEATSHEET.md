# Steno-Graph Cheat Sheet

## Pattern
```
[mode][verb]:[target] [@refs] [+add] [-exclude] [.flag] [precision]
```

## Verbs
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

## Modifiers
| Syntax | Meaning | Example |
|--------|---------|---------|
| `@file` | File reference | `dx:@src/app.ts` |
| `@name` | Bookmark reference | `viz:pca @baseline` |
| `^` | Previous output | `ch:^ +normalize` |
| `@branch:^` | Last from branch | `stat:compare @deseq2:^ @ancombc:^` |
| `@branch:n_001` | Specific node from branch | `ch:@experiment:n_004` |
| `+feat` | Add/include | `mk:api +auth +cache` |
| `-thing` | Exclude | `ch:@config -logging` |
| `.flag` | Apply flag | `mk:component .ts` |
| `.f:val` | Flag + value | `viz:chart .format:png` |

## Precision
| Marker | Meaning |
|--------|---------|
| `~` | Flexible (use judgment) |
| `!` | Exact (literal) |
| `?` | Ask first |
| `~deep` | Extended thinking |

## Modes
| Mode | Effect |
|------|--------|
| `?plan` | Outline before doing |
| `?sketch` | Rough draft for review |
| `?challenge` | Critique/push back |
| `?explore` | Investigate options |

## Common Patterns

```bash
# Explore
dx:@file.csv              # Analyze file
dx:@src/ ~deep            # Deep codebase analysis

# Create
mk:api +auth +rate-limit  # API with features
mk:component .tsx         # React component

# Modify
ch:@login.py +validation  # Add feature
ch:^ +error-handling      # Modify previous result

# Analyze
viz:heatmap @data.csv     # Visualization
stat:ttest @a.csv @b.csv  # Statistical test

# Plan
?plan microservices       # Plan architecture
?challenge current-auth   # Critique approach

# Cross-branch
stat:compare @deseq2:^ @ancombc:^  # Compare branch outputs
viz:diff @main:n_002 @experiment:^ # Diff across branches
```

## Session Commands

| Command | Action |
|---------|--------|
| `steno:help` | Quick reference |
| `steno:history` | Show command history |
| `steno:stale` | Check for stale outputs |
| `steno:refresh` | Re-run stale commands |
| `steno:bookmark <name>` | Save last as reference |
| `steno:status` | Show session status |
| `steno:graph` | Show workflow as ASCII tree |
| `steno:new-session` | Archive and start fresh |
| `steno:clear` | Clear current session |
| `steno:undo` | Undo last command (keeps files) |
| `steno:undo!` | Hard undo (reverts files too) |
| `steno:undo n_XXX` | Undo specific node |
| `steno:redo` | Restore last undone command |
| `steno:export` | Export as markdown |
| `steno:export .json` | Export for import |
| `steno:export .sh` | Export as script |
| `steno:export .html` | Export interactive HTML |
| `steno:export +transcript` | Export with conversations |
| `steno:graph +transcript` | Show transcript availability |
| `steno:import! file.json` | Import workflow |
| `steno:reset!` | Reset all state (destructive) |

## Power Commands

| Command | Action |
|---------|--------|
| `steno:alias` | List all aliases |
| `steno:alias name "cmd"` | Create alias |
| `steno:alias name "cmd {1}"` | Create parameterized alias |
| `steno:alias ?name` | View alias details |
| `steno:alias -name` | Remove alias |
| `steno:search pattern` | Search history by pattern |
| `steno:search :verb` | Search by verb |
| `steno:search +modifier` | Search by modifier |
| `steno:replay n_XXX` | Replay single command |
| `steno:replay n_XXX..n_YYY` | Replay range |
| `steno:replay @bookmark..` | Replay from bookmark |
| `steno:replay +dry` | Preview without executing |

## Templates

| Command | Action |
|---------|--------|
| `steno:template` | List all templates |
| `steno:template name args` | Run template |
| `steno:template ?name` | View template details |
| `steno:template +create name` | Create custom template |
| `steno:template -name` | Remove custom template |
| `steno:template +export name` | Export as JSON |
| `steno:template +import file` | Import template |

**Built-in templates:** `react-component`, `api-endpoint`, `refactor`, `test-suite`

## Diff & Compare

| Command | Action |
|---------|--------|
| `steno:diff n_X n_Y` | Compare two nodes |
| `steno:diff @branch1 @branch2` | Compare branches |
| `steno:diff @bookmark ^` | Compare bookmark to current |
| `steno:diff n_X..n_Y` | Show changes across range |
| `steno:diff +files` | Include file content diff |
| `steno:diff +stats` | Focus on statistical results |

## Transcripts

| Command | Action |
|---------|--------|
| `steno:transcript` | Show status |
| `steno:transcript +generate` | Generate current session |
| `steno:transcript +all` | Generate all sessions |
| `steno:transcript +open` | Open in browser after generating |

**Features:**
- Full-text search (`/` to focus)
- Keyboard navigation (`j`/`k` for messages, `?` for help)
- Copy buttons on code blocks
- Four color themes + dark mode
- Session statistics (messages, tools, tokens, duration)
- Steno node badges with deep links
- Export: Markdown, JSON, PDF, filtered exports

Output: `.steno/transcripts/*.html`
See [design/transcript-enhancements.md](design/transcript-enhancements.md) for full feature guide.

## Parameters

| Syntax | Meaning |
|--------|---------|
| `{1}` | First positional arg |
| `{name}` | Named parameter |
| `{1:default}` | With default value |
| `{name?}` | Optional parameter |

## Branching

| Command | Action |
|---------|--------|
| `fork:name` | Create branch from current node |
| `switch:name` | Switch to branch |
| `steno:branches` | List all branches |
| `compare:a b` | Compare two branches |
| `merge:name` | Adopt branch into current |
| `abandon:name` | Discard branch |

## Error Messages

| Error | Meaning |
|-------|---------|
| `⚠ Missing target` | Command needs a file or reference |
| `⚠ File not found` | Check path, see suggestions |
| `⚠ No previous output` | Use ^ only after other commands |
| `⚠ Bookmark not found` | Check steno:history for names |
| `⚠ Unknown verb` | Typo? See verb list above |
| `⚠ Branch not found` | Check steno:branches |
| `⚠ Node not found` | Wrong node ID? Check steno:graph |
| `⚠ Branch empty` | Branch has no nodes yet |
| `⚠ Nothing to undo` | No commands in session |
| `⚠ Nothing to redo` | No undone commands |
| `⚠ Nothing to export` | No commands in session |
| `⚠ Unsupported format` | Use .md, .json, or .sh |
| `⚠ Cannot import` | Only .json files |

## Tips

- **Be terse**: `dx:@f.csv` not "please analyze f.csv"
- **Chain with ^**: Reference previous result
- **Bookmark often**: `steno:bookmark baseline` for later
- **Use ?**: When unsure, add `?` to ask first
- **Trust Claude**: It generalizes beyond defined verbs
- **Check errors**: Failed commands log to history
- **Create aliases**: Save common patterns with `steno:alias`
- **Use templates**: `steno:template` for multi-step workflows
- **Compare work**: `steno:diff @baseline ^` to see changes
- **Search history**: `steno:search +auth` finds related commands
