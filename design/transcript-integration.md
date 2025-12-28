# Steno-Graph + Claude Code Transcripts Integration

## Overview

This design describes integration between steno-graph and [claude-code-transcripts](https://github.com/simonw/claude-code-transcripts) to provide:

- **Command → Conversation linking**: Jump from terse steno commands to full context
- **Searchable archives**: Find past work by command OR conversation content
- **Workflow documentation**: Generate rich reports with embedded context

## The Problem

Steno-graph captures *what* you did:
```
n_005: ch:@api.ts +auth
```

But not the full conversation:
```
User: ch:@api.ts +auth
Claude: I'll add JWT authentication to api.ts...
[reads file, discusses approach, implements, tests]
```

Claude-code-transcripts captures everything, but without the structured workflow view.

**Together**: Navigate your work by intent (steno) with full context on demand (transcripts).

## Commands

### steno:transcript

Generate or link to conversation transcripts.

**Generate transcript for current session:**

```
> steno:transcript

Generating transcript...
  Session: sess_20251228_143000
  Messages: 47

Saved to: .steno/transcripts/sess_20251228_143000.html

View: open .steno/transcripts/sess_20251228_143000.html
```

**Generate all transcripts:**

```
> steno:transcript +all

Generating transcripts for all sessions...
  sess_20251227: 23 messages → sess_20251227.html
  sess_20251228: 47 messages → sess_20251228.html

Saved to: .steno/transcripts/
Index: .steno/transcripts/index.html
```

**View transcript for specific node:**

```
> steno:transcript n_005

Opening transcript at n_005 context...
  Session: sess_20251228_143000
  Node: n_005 (ch:@api.ts +auth)

URL: .steno/transcripts/sess_20251228.html#n_005
```

**Link to external archive:**

```
> steno:transcript +link https://example.com/transcripts/

Transcript base URL set.
Nodes will link to: https://example.com/transcripts/{session}.html#{node}
```

### Command Options

| Command | Action |
|---------|--------|
| `steno:transcript` | Generate current session transcript |
| `steno:transcript +all` | Generate all session transcripts |
| `steno:transcript n_XXX` | Open transcript at specific node |
| `steno:transcript @bookmark` | Open transcript at bookmarked node |
| `steno:transcript +link URL` | Set external transcript base URL |
| `steno:transcript +sync` | Sync with claude-code-transcripts archive |

## Integration with claude-code-transcripts

### Option 1: Wrapper Mode

Steno calls claude-code-transcripts under the hood:

```
> steno:transcript +all

Checking for claude-code-transcripts...
  ✓ Found: claude-code-transcripts 0.4

Generating archive...
  claude-code-transcripts all -o .steno/transcripts/

Adding steno node anchors...
  47 nodes linked across 2 sessions.

Done: .steno/transcripts/index.html
```

### Option 2: Link Mode

Point to existing archive generated separately:

```
> steno:transcript +link ./archive/

Scanning archive for sessions...
  Found: 5 sessions, 127 messages

Linking steno nodes to transcript positions...
  n_001 → archive/project-x/sess_001.html#msg-3
  n_002 → archive/project-x/sess_001.html#msg-7
  ...

Links saved to .steno/transcript-links.json
```

### Option 3: Embedded Mode

Include transcript snippets directly in steno export:

```
> steno:export +transcript

Exporting workflow with transcripts...

Generated: workflow-with-context.html

Includes:
  - Steno command graph
  - Expandable conversation snippets
  - Full-text search
```

## Node Schema Extension

Add transcript reference to nodes:

```json
{
  "id": "n_005",
  "timestamp": "2025-12-28T14:30:00Z",
  "raw": "ch:@api.ts +auth",
  "status": "complete",
  "inputs": ["api.ts"],
  "outputs": ["api.ts"],
  "summary": "Added JWT authentication",

  "transcript": {
    "session": "sess_20251228_143000",
    "message_range": [42, 58],
    "url": ".steno/transcripts/sess_20251228.html#n_005",
    "snippet": "I'll add JWT authentication to api.ts using..."
  }
}
```

## Export Enhancement

### Markdown Export with Context

```
> steno:export +transcript

# Workflow Export

## n_005: ch:@api.ts +auth

**Command:** `ch:@api.ts +auth`
**Result:** Added JWT authentication

<details>
<summary>View conversation</summary>

**User:** ch:@api.ts +auth

**Claude:** I'll add JWT authentication to api.ts. Let me first read the current implementation...

[Full conversation excerpt]

</details>

---

## n_006: ts:@api.test.ts
...
```

### HTML Export with Interactive Transcripts

```html
<!-- workflow.html -->
<div class="node" id="n_005">
  <div class="command">ch:@api.ts +auth</div>
  <div class="summary">Added JWT authentication</div>
  <button onclick="toggleTranscript('n_005')">
    Show conversation
  </button>
  <div class="transcript" id="transcript-n_005" hidden>
    <!-- Embedded or iframe to transcript -->
  </div>
</div>
```

## steno:graph Enhancement

Show transcript availability in graph view:

```
> steno:graph +transcript

main
├── n_001 dx:@src/api.ts [📝]
├── n_002 ?plan auth-system [📝]
├── n_003 ch:@api.ts +auth [📝]
│   └── experiment (merged)
│       └── n_004 ch:@api.ts +oauth [📝]
└── n_005 ts:@api.test.ts [📝]

[📝] = transcript available
Click node ID to view transcript.
```

## Implementation Phases

### Phase 1: Basic Linking ✓ (v1.3.0)

1. ✓ Detect claude-code-transcripts installation
2. ✓ `steno:transcript +link` to point to archive
3. ✓ Store transcript URLs in nodes
4. ✓ `steno:transcript n_XXX` opens browser to URL

### Phase 2: Automatic Generation ✓ (v1.4.0)

1. ✓ `steno:transcript +generate` generates current session
2. ✓ `steno:transcript +all` generates all
3. ✓ Add node anchors to generated HTML
4. ✓ Index page with steno graph visualization

### Phase 3: Rich Export

1. `steno:export +transcript` embeds context
2. Interactive HTML with expandable conversations
3. Full-text search across commands and conversations
4. Branch visualization with transcript links

## File Structure

```
.steno/
├── graph.json
├── current-session.json
├── transcript-links.json      # URL mappings
└── transcripts/               # Generated HTML
    ├── index.html             # Session list with graph
    ├── sess_20251227.html
    └── sess_20251228.html
```

## Benefits

1. **Recall**: "What was that auth discussion?" → Search transcripts
2. **Documentation**: Share workflows with full context
3. **Learning**: Review how problems were solved
4. **Debugging**: See what Claude saw when a command ran
5. **Reproducibility**: Exact context for replaying workflows

## Dependencies

- [claude-code-transcripts](https://github.com/simonw/claude-code-transcripts) (optional, for generation)
- Or: Manual transcript archive (link mode)

## Future: Bidirectional Integration

Claude-code-transcripts could also recognize steno commands:

```html
<!-- In generated transcript -->
<div class="message user">
  <span class="steno-command" data-node="n_005">
    ch:@api.ts +auth
  </span>
</div>
```

Clicking the command jumps to steno graph view.
