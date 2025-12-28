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
```

## Session Commands

| Command | Action |
|---------|--------|
| `steno:history` | Show command history |
| `steno:stale` | Check for stale outputs |
| `steno:refresh` | Re-run stale commands |
| `steno:bookmark <name>` | Save last as reference |
| `steno:status` | Show session status |
| `steno:new-session` | Archive and start fresh |
| `steno:clear` | Clear current session |

## Tips

- **Be terse**: `dx:@f.csv` not "please analyze f.csv"
- **Chain with ^**: Reference previous result
- **Bookmark often**: `steno:bookmark baseline` for later
- **Use ?**: When unsure, add `?` to ask first
- **Trust Claude**: It generalizes beyond defined verbs
