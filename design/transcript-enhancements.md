# Transcript Features

Interactive HTML transcripts for Claude Code sessions with search, navigation, themes, and export.

## Quick Start

```bash
# Generate transcript for current session
steno:transcript +generate

# Generate all session transcripts
steno:transcript +all

# Open in browser after generating
steno:transcript +generate +open
```

Output: `.steno/transcripts/` (HTML files)

---

## Features

### Search

Full-text search with real-time highlighting.

- Press `/` to focus search
- `Enter` for next match, `Shift+Enter` for previous
- `Escape` to clear

### Keyboard Navigation

Navigate without a mouse:

| Key | Action |
|-----|--------|
| `j` / `↓` | Next message |
| `k` / `↑` | Previous message |
| `/` | Focus search |
| `Escape` | Clear search |
| `t` | Toggle thinking blocks |
| `o` | Toggle tool blocks |
| `d` | Toggle dark mode |
| `?` | Show shortcuts |

### Code Blocks

- Syntax highlighting for common languages
- Copy button on each code block
- Click to copy, "Copied!" feedback

### Themes

Four color themes with light/dark mode:

- **Purple** (default)
- **Bubblegum** (pink)
- **Midnight** (indigo)
- **Minimal** (blue-gray)

Theme and mode persist across sessions via localStorage.

### Session Statistics

Collapsible stats panel showing:

- Message counts (user/assistant)
- Tool call counts
- Estimated tokens
- Session duration
- Tool usage breakdown (bar chart)

### Steno Integration

- Steno node badges on command messages
- Node ID, status, and branch shown inline
- Deep links: `session.html#n_003`
- ASCII graph visualization on index page

### Export Options

Export dropdown in top-right corner:

**Full Transcript:**
- Markdown (.md)
- JSON (.json)
- PDF (Print)

**Filtered Export:**
- User messages only
- Assistant only
- Text only (no thinking/tools)
- Code blocks only
- Steno commands only

---

## Commands

| Command | Action |
|---------|--------|
| `steno:transcript` | Show status |
| `steno:transcript +generate` | Generate current session |
| `steno:transcript +all` | Generate all sessions |
| `steno:transcript +open` | Open after generating |

---

## File Locations

| Path | Description |
|------|-------------|
| `.steno/transcripts/` | Generated HTML files |
| `.steno/transcripts/index.html` | Session index with graph |
| `scripts/generate-transcript.py` | Generator script |
| `assets/steno-transcript.css` | Styles and themes |

---

## Future Ideas

- Timeline scrubber for long sessions
- Cross-session node linking
- Diff view for comparing branches
