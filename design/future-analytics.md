# Future: Analytics & Visualization

## Overview

The steno-graph session tracking creates rich data about coding workflows. This data could power advanced analytics and visualizations beyond the current ASCII tree.

## ggterm Integration

[ggterm](file:///Users/scotthandley/Code/ggterm) is a Grammar of Graphics library for terminal visualization. It could enable:

### Potential Features

**steno:timeline** - Command timeline visualization
```
> steno:timeline

Time (24h)
     |
14:00├── dx:@samples.csv
     │
14:15├── viz:heatmap ^
     │   └─ fork:experiment
14:30│       └── dx:@samples.csv
     │
14:45├── ch:^ +cluster
     │
15:00└── merge:experiment
```

**steno:stats** - Workflow analytics
```
> steno:stats

Command Distribution     Session Activity
┌──────────────────┐    ┌──────────────────┐
│ dx ████████ 40%  │    │ Mon ██████ 12    │
│ ch ██████  30%   │    │ Tue ████   8     │
│ viz ████   20%   │    │ Wed ██████ 11    │
│ mk ██     10%    │    │ Thu ████████ 15  │
└──────────────────┘    └──────────────────┘

Total: 46 commands across 4 sessions
Avg session: 11.5 commands
Most used: dx (diagnosis/exploration)
```

**steno:flow** - Network diagram of command dependencies
- Nodes as points showing commands
- Edges showing ^ references (data flow)
- Color by command type
- Size by output file count

### Implementation Notes

ggterm provides:
- `geom_point()`, `geom_text()` for nodes
- `geom_segment()` for edges
- `geom_bar()`, `geom_col()` for statistics
- Multiple renderers (Braille for high-res, block for compatibility)

Would require:
- Pre-computing layout positions for network diagrams
- Aggregating session data for statistics
- Time-based positioning for timeline views

### Priority

Low - current tooling (`steno:history`, `steno:graph`, `compare:`) covers primary use cases. Analytics would be nice-to-have for power users analyzing their workflow patterns.

## References

- ggterm: `/Users/scotthandley/Code/ggterm`
- Grammar of Graphics: Wilkinson (2005)
- Current session tracking: `.steno/graph.json`
