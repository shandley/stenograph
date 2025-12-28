# Semantic Terminal: A Purpose-Built Interface for Claude Code

## The Core Insight

Traditional terminal emulators are archaeological artifacts—50 years of accumulated hacks built on the VT100's 1978 design. They conflate data and control in a single byte stream, requiring complex state machines to parse escape sequences that were designed for physical screens.

But if you're building an interface that *only* runs Claude Code, you don't need any of that.

Claude Code produces structured output: tool invocations, diffs, code blocks, reasoning, status updates. This structure exists internally before being flattened to ANSI escape sequences. A semantic terminal intercepts at this higher level and renders each type of content according to what it actually is—not as styled characters in a grid.

## What Exists Today

Several web UIs for Claude Code exist (claude-code-webui, claudecodeui, Claudia GUI, cui). They all take the same approach: spawn Claude Code CLI, pipe ANSI output to the browser, render in a chat interface. They're wrappers that add conveniences—mobile access, session management, project selection—but fundamentally still render terminal output.

No one has built a purpose-built renderer that treats Claude Code's output as semantic blocks.

## The Semantic Blocks Approach

### Output Types

Claude Code produces distinct semantic units:

- **Tool invocations** — Read, Write, Edit, Bash, MCP tools, etc.
- **Tool results** — Success/failure, output, errors
- **Thinking/reasoning** — Claude's working process
- **Code blocks** — With language context
- **Diffs** — File changes with before/after
- **Status updates** — Working, waiting, done
- **Errors and warnings**
- **Conversational text**

### Rendering Benefits

**Diffs** become actual diff viewers. Side-by-side when space permits, inline when not. Syntax highlighting within the diff. Collapsible hunks. Copy file paths.

**Code blocks** get proper syntax highlighting via Shiki or Prism—not ANSI color approximations. Copy buttons. Line numbers. Language-aware formatting.

**Tool invocations** render as cohesive cards showing tool name, parameters, and results as a unit. Collapsible once reviewed. Visual distinction between activity and results.

**Streaming thinking** gets subtle visual treatment—dimmed, separate region—distinguishing process from conclusion.

**Status** becomes real progress indicators with stage information, duration, and reliable cancel buttons.

## Enhanced Visibility

The semantic approach enables visibility impossible in terminals:

**Cost tracking** — Real-time token consumption and spend, per session and cumulative.

**File impact map** — Visual representation of touched files. Click to see unified diffs across all changes to a single file.

**Context visualization** — How full is the context window? What's consuming space? Breakdown of system prompt, history, file contents, tool results.

**Task progress** — Persistent timeline showing multi-step operation status, not text that scrolls away.

**Parallel agent awareness** — Subagents as parallel tracks rather than interleaved text.

## Enhanced Control

Structure enables precise control:

**Selective approval** — Batch tool invocations. Checkbox lists. Approve some, reject others, in one action.

**Fine-grained policies** — "Pause before Bash, auto-approve file reads." Per-tool-type rules with UI configuration.

**Visible rollback** — Timeline of changes with restore points. Slider to preview codebase state at any moment.

**Edit before execution** — Modify proposed commands before approval. Tweak flags, change paths.

**Branch exploration** — Fork sessions to explore risky approaches. Compare outcomes. Non-linear workflows.

## Workflow Integration

Semantic blocks enable contextual actions:

**External tool links** — Test file modified → one click to run CI. Component created → one click to Storybook.

**Annotation layer** — Add notes to Claude's output. Build persistent knowledge on top of sessions.

**Export and sharing** — Select blocks, export as documentation. Turn problem-solving sessions into artifacts.

## Implementation Feasibility

The implementation is straightforward:

**Parser** — Minimal state machine: ground, escape, CSI states. Handle only the sequences Claude Code actually uses: SGR for colors, basic cursor movement, clear commands. ~200-300 lines of TypeScript.

**Screen buffer** — 2D grid of cells with character, foreground, background, and text attributes.

**Renderer** — DOM with spans for styled runs. No virtualization needed at Claude Code's output rates.

**Semantic lifting** — Second pass over parsed output recognizing patterns: tool invocations, diffs, code blocks. Lift to typed block structures.

**Block components** — React/Svelte components for each block type. DiffBlock, CodeBlock, ToolInvocationBlock, etc.

The constraint of only supporting Claude Code makes this tractable. You're not building a general terminal emulator—you're building a renderer for a specific, structured output format.

## What You Keep

- Full prompt input capability
- All Claude Code tools (Read, Write, Edit, Bash, etc.)
- MCP server integration
- Subagent support
- Hooks
- Everything Claude Code can do

The semantic approach is a presentation layer change, not a capability change.

## What You Trade

**Generality** — Only handles defined block types. New Claude Code output types require new blocks.

**Arbitrary formatting** — ASCII art or unexpected formats need fallback handling.

The bet: Claude Code's output is structured enough that semantic rendering benefits outweigh generality loss. Given the single-purpose constraint, this bet is strong.

## The Opportunity

This would be genuinely new. Not another terminal wrapper, but a rethinking of what a Claude Code interface should be. The existing projects prove demand (700+ stars on sugyan's repo). But they solve "access Claude Code from a browser" rather than "what should a Claude Code interface actually be."

The terminal aesthetic is useful—information-dense, technical feel. But you're not constrained by what terminals historically had to be. You get to decide what it should be.
