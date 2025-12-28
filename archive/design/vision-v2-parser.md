# Steno-Graph

## A Stenographic Parser for AI Interfaces

### The Core Insight

Court stenography succeeded not because of speed alone, but because **compressed input creates structure**. Stenographers capture complex legal proceedings at 225+ WPM with 98% accuracy using a compositional system where every chord encodes meaning.

Current AI coding tools optimize for natural language input. Steno-Graph inverts this: **optimize for structured input, let AI handle ambiguity resolution within structure**.

The structure you create enables direct execution for simple operations and precise Claude prompts for complex ones.

---

## What Steno-Graph Is

**Steno-graph is a configurable parser library** that converts compressed, structured input into typed Intent objects.

It is **NOT**:
- A daemon or execution engine
- A graph database
- A Claude Code wrapper

It **IS**:
- A fast tokenizer and parser
- A configurable vocabulary system
- An intent-to-primitive mapper
- A library that integrates with existing infrastructure

---

## How It Works

```
┌────────────────┐      ┌────────────────┐      ┌────────────────┐
│   You type     │ ───▶ │  Parser        │ ───▶ │  Intent        │
│   dx:@data.csv │      │  (steno-graph) │      │  object        │
└────────────────┘      └────────────────┘      └────────────────┘
                                                       │
                               ┌───────────────────────┼───────────────────────┐
                               │                       │                       │
                               ▼                       ▼                       ▼
                        ┌────────────┐          ┌────────────┐          ┌────────────┐
                        │ Direct     │          │ Claude     │          │ Clarify    │
                        │ Primitive  │          │ interprets │          │ with user  │
                        │ (simple)   │          │ (complex)  │          │ (? marker) │
                        └────────────┘          └────────────┘          └────────────┘
                               │                       │                       │
                               └───────────────────────┴───────────────────────┘
                                                       │
                                                       ▼
                                              ┌────────────────┐
                                              │ Existing       │
                                              │ Daemon         │
                                              │ (bioengine,    │
                                              │  etc.)         │
                                              └────────────────┘
```

**Key insight**: Steno-graph produces Intent objects. The consumer decides how to execute them—directly as primitives, via Claude interpretation, or with user clarification.

---

## The Stenographic Grammar

### Core Syntax

```
[verb]:[target] [modifiers] [precision] [context]
```

### Core Verbs

| Token | Meaning | Example |
|-------|---------|---------|
| `mk` | Make / create | `mk:api` |
| `ch` | Change / modify | `ch:login` |
| `rm` | Remove / delete | `rm:deprecated` |
| `dx` | Diagnose / explore | `dx:@data.csv` |
| `fnd` | Find / search | `fnd:auth-handlers` |
| `fork` | Branch exploration | `fork:@approach-a` |
| `merge` | Join branches | `merge:@a @b` |
| `revert` | Return to prior state | `revert:@node` |

### Domain Extensions

Steno-graph supports configurable vocabulary. Domains add their own verbs:

**Code domain:**
| Token | Meaning |
|-------|---------|
| `ts` | Test |
| `doc` | Document |

**Data Science domain:**
| Token | Meaning | Maps to |
|-------|---------|---------|
| `viz` | Visualize | scatter_plot, etc. |
| `fit` | Fit model | glm, pca, etc. |
| `stat` | Statistical test | wald, permanova, etc. |
| `eda` | Exploratory analysis | diagnose |

### Modifiers

| Token | Meaning | Example |
|-------|---------|---------|
| `+feature` | Add feature/aspect | `+auth +cache` |
| `-thing` | Without / exclude | `-logging` |
| `.flag` | Domain flag | `.test .plot .notebook` |

### Precision Markers

| Token | Meaning | Execution |
|-------|---------|-----------|
| `~` | Flexible | Claude interprets |
| `!` | Literal, exact | Direct primitive |
| `?` | Clarify first | Pause for user input |
| `~deep` | Extended thinking | Claude with ultrathink |

### Context Anchors

| Token | Meaning | Example |
|-------|---------|---------|
| `^` | Previous output | `ch:^ +validation` |
| `^N` | Nth item from output | `^2` |
| `@name` | Named reference | `@counts.csv` |
| `#symbol` | Code symbol | `#handleRequest` |

---

## Execution Model: Direct vs Claude

### When to Execute Directly

Operations with unambiguous mappings to known primitives:

```
dx:@counts.csv          → primitive: diagnose, inputs: {counts: counts.csv}
ch:@data +normalize     → primitive: tmm, inputs: {counts: data}
viz:pca @counts.csv     → primitive: pca, inputs: {counts: counts.csv}
stat:permanova @dist    → primitive: permanova, inputs: {distance: dist}
```

These bypass Claude entirely. The mapper knows the primitive registry and generates execution specs directly.

### When to Route Through Claude

Operations requiring interpretation:

```
mk:analysis +differential   → What kind of differential analysis?
?plan taxa-abundance        → Planning requires Claude
ch:@data "fix the outliers" → Freeform text needs interpretation
dx:@data.csv ~deep          → Extended thinking requested
```

The mapper returns `{ needsClaude: true, intent: ... }` and the consumer sends to Claude.

### When to Clarify

Operations with explicit uncertainty:

```
mk:auth?                    → What kind of auth?
fit:model? @data.csv        → What kind of model?
```

The mapper returns `{ needsClarification: true, options: [...] }` and the consumer prompts the user.

---

## Integration Architecture

Steno-graph integrates with existing infrastructure. Here's how it works with a system like BioStack:

```
┌─────────────────────────────────────────────────────────────────┐
│                      Web Interface                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ StenoInput                                               │   │
│  │ > dx:@counts.csv .plot                                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│              │                                                  │
│              ▼                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ steno-graph parser                                       │   │
│  │ Intent { verb: "dx", target: "@counts.csv", flags: ... } │   │
│  └─────────────────────────────────────────────────────────┘   │
│              │                                                  │
│              ▼                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ steno-graph mapper                                       │   │
│  │ Checks: Is "dx" + "@counts.csv" a known primitive?       │   │
│  │ Result: { direct: true, primitive: "diagnose", ... }     │   │
│  └─────────────────────────────────────────────────────────┘   │
│              │                                                  │
│              ├── Direct? ─────────────────────────────────┐    │
│              │                                             │    │
│              ▼                                             ▼    │
│  ┌──────────────────────┐              ┌────────────────────┐  │
│  │ Generate YAML spec   │              │ Route to Claude    │  │
│  │ for daemon           │              │ for interpretation │  │
│  └──────────────────────┘              └────────────────────┘  │
│              │                                    │             │
│              └────────────────┬───────────────────┘             │
│                               ▼                                 │
│                    Write command to daemon                      │
└───────────────────────────────┼─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│              Existing Daemon (e.g., bioengine)                   │
│              - Watches for command files                        │
│              - Executes primitives                              │
│              - Broadcasts SSE events                            │
│              - Updates provenance graph                         │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                         SSE Events
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│              Web Interface                                       │
│              - Receives execution events                        │
│              - Updates visualization                            │
│              - Shows results                                    │
└─────────────────────────────────────────────────────────────────┘
```

**Key point**: Steno-graph doesn't replace the daemon. It provides the input layer that feeds into existing execution infrastructure.

---

## Configuration

### Vocabulary Configuration

```typescript
import { createParser } from 'steno-graph';

const parser = createParser({
  // Base vocabulary (always included)
  core: true,

  // Domain extensions
  extensions: ['datascience'],

  // Custom verbs for this application
  customVerbs: {
    'eda': { alias: 'dx' },  // eda is alias for dx
    'normalize': { primitive: 'tmm' },
  },

  // Custom flags
  customFlags: {
    'notebook': { type: 'output', format: 'ipynb' },
    'report': { type: 'output', format: 'html' },
  },
});
```

### Primitive Registry

For direct execution, provide a primitive registry:

```typescript
import { createMapper } from 'steno-graph';

const mapper = createMapper({
  primitives: {
    'diagnose': {
      verb: 'dx',
      inputSlots: ['counts'],
      params: {},
    },
    'tmm': {
      verb: 'normalize',
      addition: 'normalize',
      inputSlots: ['counts'],
      params: { size_factor_type: 'geometric_mean' },
    },
    'pca': {
      verb: 'viz',
      target: 'pca',
      inputSlots: ['counts'],
      params: { n_components: 10 },
    },
    // ... more primitives
  },
});

const result = mapper.map(intent);
// { direct: true, primitive: 'diagnose', inputs: {...}, params: {...} }
// or
// { direct: false, needsClaude: true, intent: {...} }
```

---

## Progressive Disclosure

The grammar is learned incrementally:

### Level 0: Natural Language Pass-through
```
You:    "Analyze my counts data"
System: → dx:@counts.csv
        [Enter to accept, or continue typing]
```

### Level 1: Basic Verbs
```
dx:@data.csv
mk:model
ch:@results +filter
```

### Level 2: Modifiers
```
dx:@data.csv .plot
fit:pca @counts.csv +scale
viz:scatter @ordination +color:treatment
```

### Level 3: Context and Precision
```
ch:^ +normalize         (modify last output)
fit:glm @data.csv!      (exact, no interpretation)
stat:test? @groups      (clarify which test)
```

---

## Package Structure

```
steno-graph/
├── src/
│   ├── parser/
│   │   ├── types.ts        # Intent, Token, Verb types
│   │   ├── tokenizer.ts    # Token classification
│   │   ├── parser.ts       # Token → Intent
│   │   └── index.ts        # Parser exports
│   │
│   ├── mapper/
│   │   ├── types.ts        # MappingResult, PrimitiveSpec
│   │   ├── registry.ts     # Primitive registry
│   │   ├── mapper.ts       # Intent → Primitive mapping
│   │   └── index.ts        # Mapper exports
│   │
│   ├── config/
│   │   ├── types.ts        # ParserConfig, MapperConfig
│   │   ├── core.ts         # Core vocabulary
│   │   ├── datascience.ts  # Data science extension
│   │   └── index.ts        # Config exports
│   │
│   └── index.ts            # Main exports
│
├── package.json
├── tsconfig.json
└── README.md
```

---

## Examples

### Data Science: Direct Execution

```
dx:@counts.csv
```

Parser output:
```json
{
  "verb": "dx",
  "target": { "raw": "@counts.csv", "type": "file" },
  "flags": [],
  "precision": "flexible"
}
```

Mapper output:
```json
{
  "direct": true,
  "primitive": "diagnose",
  "inputs": { "counts": "counts.csv" },
  "params": {}
}
```

Daemon receives (YAML):
```yaml
primitive: diagnose
inputs:
  counts: counts.csv
params: {}
```

---

### Data Science: Claude Interpretation

```
?plan differential-abundance +batch-correction ~deep
```

Parser output:
```json
{
  "verb": "mk",
  "target": { "raw": "differential-abundance", "type": "new" },
  "mode": "plan",
  "additions": ["batch-correction"],
  "thinking": "deep"
}
```

Mapper output:
```json
{
  "direct": false,
  "needsClaude": true,
  "reason": "Planning mode requires interpretation",
  "intent": { ... }
}
```

Consumer sends to Claude terminal or API.

---

### Data Science: Clarification

```
fit:model? @counts.csv
```

Parser output:
```json
{
  "verb": "fit",
  "target": { "raw": "model", "type": "new" },
  "precision": "clarify",
  "refs": [{ "type": "file", "value": "counts.csv" }]
}
```

Mapper output:
```json
{
  "direct": false,
  "needsClarification": true,
  "options": [
    { "label": "PCA", "primitive": "pca" },
    { "label": "GLM (negative binomial)", "primitive": "glm" },
    { "label": "NMDS", "primitive": "nmds" }
  ]
}
```

---

## Build Path

### Phase 1: Core Parser (Complete)
- [x] Tokenizer
- [x] Parser
- [x] Intent types
- [x] Test suite

### Phase 2: Configuration System (Complete)
- [x] Vocabulary configuration
- [x] Domain extensions (datascience, code, etc.)
- [x] Custom verb/flag registration
- [x] Configurable parser factory

### Phase 3: Mapper (Complete)
- [x] Primitive registry
- [x] Intent → Primitive mapping
- [x] Direct/Claude/Clarify routing logic
- [x] YAML serialization for daemon consumption
- [x] Sample primitives (22 data science, 3 code)

### Phase 4: Integration Examples (Complete)
- [x] biostack integration guide (46 bioforge primitives)
- [x] Generic daemon integration (file/WS/HTTP clients)
- [x] React component examples (StenoInput, ClarificationDialog, hooks)

---

## Integration with BioStack

For BioStack specifically, steno-graph provides:

1. **StenoInput component** for bioview-web
2. **Mapper configured with bioforge primitives** (all 46)
3. **Direct execution** for simple operations
4. **Claude routing** for complex operations

The existing bioengine daemon handles execution. Steno-graph is the input layer.

```typescript
// In bioview-web
import { createParser, createMapper } from 'steno-graph';
import { bioforgeRegistry } from './bioforge-registry';

const parser = createParser({ extensions: ['datascience'] });
const mapper = createMapper({ primitives: bioforgeRegistry });

function handleStenoInput(input: string) {
  const parseResult = parser.parse(input);
  if (!parseResult.success) return showError(parseResult.errors);

  const mapResult = mapper.map(parseResult.intent);

  if (mapResult.direct) {
    // Write YAML to .biostack/commands/
    writeDaemonCommand(mapResult);
  } else if (mapResult.needsClaude) {
    // Send to Claude terminal
    sendToClaudeTerminal(parseResult.intent);
  } else if (mapResult.needsClarification) {
    // Show options to user
    showClarificationDialog(mapResult.options);
  }
}
```

---

## Summary

**Steno-graph** is a configurable stenographic parser that produces typed Intent objects.

**Consumers** decide how to execute intents:
- **Direct**: Map to known primitives, execute immediately
- **Claude**: Route to AI for interpretation
- **Clarify**: Pause for user input

**Integration** with existing daemons (bioengine, etc.) means no new execution infrastructure—just a better input layer.

**The forcing function**: Fewer keystrokes, less ambiguity, faster execution for routine operations, Claude reserved for what actually needs intelligence.

---

*"Structure in, intelligence where needed."*
