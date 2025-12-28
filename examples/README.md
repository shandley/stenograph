# Steno-Graph Examples

This directory contains integration examples for steno-graph.

## Directory Structure

```
examples/
├── biostack/           # BioStack ecosystem integration
│   ├── bioforge-registry.ts   # 46 bioforge primitives
│   └── integration.ts         # Complete biostack integration
│
├── daemon/             # Generic daemon integration
│   └── daemon-integration.ts  # Bridge pattern for any daemon
│
└── react/              # React components
    ├── StenoInput.tsx         # Input component with autocomplete
    ├── ClarificationDialog.tsx # Clarification modal
    ├── useStenoGraph.ts       # React hook
    ├── StenoDemo.tsx          # Complete demo app
    └── index.ts               # Exports
```

## BioStack Integration

The BioStack example shows how to integrate steno-graph with:
- **bioforge**: 46 statistical primitives for microbiome analysis
- **bioengine**: File-watching daemon that executes primitives
- **bioview-web**: Web companion panel

```typescript
import { createParser, createMapper } from 'steno-graph';
import { BIOFORGE_PRIMITIVES } from './bioforge-registry';

const parser = createParser({ extensions: ['datascience'] });
const mapper = createMapper({ primitives: BIOFORGE_PRIMITIVES });

// Parse steno input
const result = parser.parse('viz:pca @counts.csv .plot:png');

// Map to execution strategy
const mapping = mapper.map(result.intent);

if (mapping.type === 'direct') {
  // Write YAML command for bioengine
  writeCommandFile(mapper.toYAML(mapping));
} else if (mapping.type === 'claude') {
  // Route to Claude terminal
  sendToClaudeTerminal(mapping.context);
}
```

Run the demo:
```bash
npx ts-node examples/biostack/integration.ts
```

## Generic Daemon Integration

The daemon example provides a reusable bridge pattern:

```typescript
import { StenoDaemonBridge, FileDaemonClient } from './daemon-integration';

// Create daemon client (file-based, like bioengine)
const client = new FileDaemonClient('.biostack/commands/');

// Create bridge with your primitives
const bridge = new StenoDaemonBridge(
  MY_PRIMITIVES,
  client,
  ['datascience']
);

// Process steno input
const result = await bridge.process('dx:@data.csv');

if (result.success && result.type === 'executed') {
  console.log(`Command ${result.commandId} sent to daemon`);
}
```

Available clients:
- `FileDaemonClient`: Writes YAML files to a directory
- `WebSocketDaemonClient`: Sends JSON over WebSocket
- `HttpDaemonClient`: POSTs to an HTTP endpoint
- `MemoryDaemonClient`: In-memory storage for testing

Run the demo:
```bash
npx ts-node examples/daemon/daemon-integration.ts
```

## React Components

Ready-to-use React components for web integration:

### StenoInput

```tsx
import { StenoInput } from './react';
import { parse } from 'steno-graph';

function MyApp() {
  const handleSubmit = (input, intent) => {
    console.log('Submitted:', intent);
  };

  return (
    <StenoInput
      onSubmit={handleSubmit}
      parse={parse}
      placeholder="dx:@data.csv"
      showAutocomplete={true}
      showStatus={true}
    />
  );
}
```

### useStenoGraph Hook

```tsx
import { useStenoGraph } from './react';

function MyComponent() {
  const { parse, map, isReady, verbs, flags } = useStenoGraph({
    extensions: ['datascience'],
    primitives: MY_PRIMITIVES,
  });

  const handleInput = (input: string) => {
    const parseResult = parse(input);
    if (parseResult.success) {
      const mapping = map(parseResult.intent);
      // Handle mapping...
    }
  };

  return <div>...</div>;
}
```

### ClarificationDialog

```tsx
import { ClarificationDialog } from './react';

function MyApp() {
  const [clarification, setClarification] = useState(null);

  return (
    <>
      {clarification && (
        <ClarificationDialog
          question={clarification.question}
          options={clarification.options}
          onSelect={(option) => {
            console.log('Selected:', option.primitive);
            setClarification(null);
          }}
          onCancel={() => setClarification(null)}
        />
      )}
    </>
  );
}
```

### Complete Demo

The `StenoDemo` component provides a complete working example with:
- Input with autocomplete
- Parse status indicator
- Command history
- Clarification handling
- Grammar reference

```tsx
import { StenoDemo } from './react';

function App() {
  return <StenoDemo />;
}
```

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Run biostack demo:
```bash
npx ts-node examples/biostack/integration.ts
```

3. Run daemon demo:
```bash
npx ts-node examples/daemon/daemon-integration.ts
```

4. For React components, copy the `examples/react/` directory to your project and customize as needed.

## Integration Checklist

When integrating steno-graph into your application:

- [ ] Create a primitive registry matching your backend
- [ ] Configure parser with appropriate extensions
- [ ] Create mapper with your primitives
- [ ] Implement command execution (file/WS/HTTP)
- [ ] Handle Claude routing (if applicable)
- [ ] Implement clarification UI
- [ ] Add error handling
- [ ] Consider adding command history/undo
