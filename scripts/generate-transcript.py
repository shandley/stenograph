#!/usr/bin/env python3
"""
Steno-Graph Transcript Generator

Generate themed HTML transcripts from Claude Code session data.

Usage:
    python scripts/generate-transcript.py                    # Current session
    python scripts/generate-transcript.py --all              # All sessions
    python scripts/generate-transcript.py --session UUID     # Specific session
    python scripts/generate-transcript.py --output ./docs/   # Custom output
"""

import json
import os
import sys
import re
import argparse
from datetime import datetime
from pathlib import Path
from html import escape

# ============================================
# Configuration
# ============================================

CLAUDE_DIR = Path.home() / ".claude"
DEFAULT_OUTPUT = ".steno/transcripts"

# ============================================
# CSS (embedded in output)
# ============================================

def get_css(css_path=None):
    """Load CSS from file or return embedded minimal version."""
    if css_path and Path(css_path).exists():
        return Path(css_path).read_text()

    # Try to find it relative to script
    script_dir = Path(__file__).parent.parent
    css_file = script_dir / "assets" / "steno-transcript.css"
    if css_file.exists():
        return css_file.read_text()

    # Minimal fallback CSS
    return """
:root {
  --background: #fafafa;
  --foreground: #1a1a1a;
  --card: #ffffff;
  --border: #e5e5e5;
  --primary: #7c3aed;
  --muted: #f5f5f5;
  --user-bg: #f0f0ff;
  --assistant-bg: #fafafa;
  --thinking-bg: #fffbeb;
  --tool-bg: #faf5ff;
}
.dark {
  --background: #1a1a1a;
  --foreground: #fafafa;
  --card: #262626;
  --border: #404040;
  --primary: #a78bfa;
  --muted: #333333;
  --user-bg: #1e1e3f;
  --assistant-bg: #262626;
  --thinking-bg: #2a2a1a;
  --tool-bg: #2a1a2a;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: system-ui, sans-serif; background: var(--background); color: var(--foreground); line-height: 1.6; }
.container { max-width: 900px; margin: 0 auto; padding: 2rem 1.5rem; }
.message { margin: 1rem 0; padding: 1rem; border-radius: 0.5rem; border-left: 3px solid var(--primary); }
.message.user { background: var(--user-bg); }
.message.assistant { background: var(--assistant-bg); }
.message-header { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; margin-bottom: 0.5rem; opacity: 0.7; }
details { margin: 0.5rem 0; }
summary { cursor: pointer; font-weight: 500; padding: 0.5rem; background: var(--muted); border-radius: 0.25rem; }
pre { background: var(--muted); padding: 1rem; border-radius: 0.5rem; overflow-x: auto; font-size: 0.875rem; }
code { font-family: ui-monospace, monospace; }
.theme-toggle { position: fixed; top: 1rem; right: 1rem; padding: 0.5rem 1rem; border: 1px solid var(--border); border-radius: 0.5rem; background: var(--card); cursor: pointer; }
"""


def get_javascript():
    """Return the transcript JavaScript."""
    return """
(function() {
  var themes = {
    purple: { name: "Purple", color: "oklch(0.55 0.25 297)" },
    bubblegum: { name: "Bubblegum", color: "oklch(0.62 0.18 348)" },
    midnight: { name: "Midnight", color: "oklch(0.57 0.20 283)" },
    minimal: { name: "Minimal", color: "oklch(0.62 0.19 260)" }
  };

  document.documentElement.classList.add("no-transitions");
  var savedMode = localStorage.getItem("steno-mode");
  var savedColor = localStorage.getItem("steno-color-theme") || "purple";
  var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  if (savedMode === "dark" || (!savedMode && prefersDark)) {
    document.body.classList.add("dark");
  }
  if (savedColor && savedColor !== "purple") {
    document.body.setAttribute("data-color-theme", savedColor);
  }

  window.addEventListener("load", function() {
    setTimeout(function() { document.documentElement.classList.remove("no-transitions"); }, 100);
  });

  document.addEventListener("DOMContentLoaded", function() {
    var toggle = document.querySelector(".theme-toggle");
    if (toggle) {
      toggle.addEventListener("click", function() {
        document.body.classList.toggle("dark");
        localStorage.setItem("steno-mode", document.body.classList.contains("dark") ? "dark" : "light");
      });
    }

    var themeOptions = document.querySelectorAll(".theme-option");
    var themeName = document.querySelector(".theme-name");
    var themeSwatch = document.querySelector(".theme-swatch-current");

    function updateThemeUI(colorTheme) {
      if (themeName) themeName.textContent = themes[colorTheme].name;
      if (themeSwatch) themeSwatch.style.background = themes[colorTheme].color;
      themeOptions.forEach(function(opt) {
        opt.classList.toggle("active", opt.getAttribute("data-color-theme") === colorTheme);
      });
    }
    updateThemeUI(savedColor);

    themeOptions.forEach(function(option) {
      option.addEventListener("click", function() {
        var colorTheme = this.getAttribute("data-color-theme");
        if (colorTheme === "purple") {
          document.body.removeAttribute("data-color-theme");
        } else {
          document.body.setAttribute("data-color-theme", colorTheme);
        }
        localStorage.setItem("steno-color-theme", colorTheme);
        updateThemeUI(colorTheme);
      });
    });

    // Search
    var searchInput = document.querySelector(".transcript-search input");
    var searchStats = document.querySelector(".search-stats");
    var searchMatches = [];
    var currentMatch = -1;

    function clearHighlights() {
      document.querySelectorAll(".search-highlight").forEach(function(el) {
        var parent = el.parentNode;
        parent.replaceChild(document.createTextNode(el.textContent), el);
        parent.normalize();
      });
      searchMatches = [];
      currentMatch = -1;
    }

    function highlightText(query) {
      clearHighlights();
      if (!query || query.length < 2) { if (searchStats) searchStats.textContent = ""; return; }
      var messages = document.querySelectorAll(".message-content, .thinking-content");
      var regex = new RegExp("(" + query.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&") + ")", "gi");
      messages.forEach(function(msg) {
        var walker = document.createTreeWalker(msg, NodeFilter.SHOW_TEXT, null, false);
        var textNodes = [];
        while (walker.nextNode()) textNodes.push(walker.currentNode);
        textNodes.forEach(function(node) {
          if (regex.test(node.textContent)) {
            var span = document.createElement("span");
            span.innerHTML = node.textContent.replace(regex, '<mark class="search-highlight">$1</mark>');
            node.parentNode.replaceChild(span, node);
          }
        });
      });
      searchMatches = Array.from(document.querySelectorAll(".search-highlight"));
      if (searchStats) searchStats.textContent = searchMatches.length + " match" + (searchMatches.length !== 1 ? "es" : "");
      if (searchMatches.length > 0) goToMatch(0);
    }

    function goToMatch(index) {
      if (searchMatches.length === 0) return;
      searchMatches.forEach(function(m) { m.classList.remove("current"); });
      currentMatch = (index + searchMatches.length) % searchMatches.length;
      searchMatches[currentMatch].classList.add("current");
      searchMatches[currentMatch].scrollIntoView({ behavior: "smooth", block: "center" });
    }

    if (searchInput) {
      var debounceTimer;
      searchInput.addEventListener("input", function() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function() { highlightText(searchInput.value); }, 200);
      });
    }

    var searchPrev = document.querySelector(".search-prev");
    var searchNext = document.querySelector(".search-next");
    if (searchPrev) searchPrev.addEventListener("click", function() { goToMatch(currentMatch - 1); });
    if (searchNext) searchNext.addEventListener("click", function() { goToMatch(currentMatch + 1); });

    // Copy buttons
    document.querySelectorAll("pre").forEach(function(pre) {
      var wrapper = document.createElement("div");
      wrapper.className = "code-wrapper";
      pre.parentNode.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);
      var btn = document.createElement("button");
      btn.className = "copy-button";
      btn.innerHTML = '<span class="icon">📋</span> Copy';
      wrapper.appendChild(btn);
      btn.addEventListener("click", function() {
        var code = pre.querySelector("code") || pre;
        navigator.clipboard.writeText(code.textContent).then(function() {
          btn.classList.add("copied");
          btn.innerHTML = '<span class="icon">✓</span> Copied!';
          setTimeout(function() { btn.classList.remove("copied"); btn.innerHTML = '<span class="icon">📋</span> Copy'; }, 2000);
        });
      });
    });

    // Keyboard navigation
    var messages = Array.from(document.querySelectorAll(".message"));
    var focusedIndex = -1;
    function focusMessage(index) {
      messages.forEach(function(m) { m.classList.remove("focused"); });
      if (index >= 0 && index < messages.length) {
        focusedIndex = index;
        messages[index].classList.add("focused");
        messages[index].scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }

    var shortcutsModal = document.querySelector(".keyboard-shortcuts-modal");
    document.addEventListener("keydown", function(e) {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
        if (e.key === "Escape") e.target.blur();
        if (e.key === "Enter" && e.target === searchInput) { e.preventDefault(); goToMatch(e.shiftKey ? currentMatch - 1 : currentMatch + 1); }
        return;
      }
      switch (e.key) {
        case "j": case "ArrowDown": e.preventDefault(); focusMessage(focusedIndex + 1); break;
        case "k": case "ArrowUp": e.preventDefault(); focusMessage(focusedIndex - 1); break;
        case "/": e.preventDefault(); if (searchInput) searchInput.focus(); break;
        case "Escape": if (shortcutsModal) shortcutsModal.classList.remove("visible"); clearHighlights(); if (searchInput) searchInput.value = ""; break;
        case "d": if (toggle) toggle.click(); break;
        case "t": document.querySelectorAll("details.thinking-block").forEach(function(d) { d.open = !d.open; }); break;
        case "o": document.querySelectorAll("details.tool-block").forEach(function(d) { d.open = !d.open; }); break;
        case "?": e.preventDefault(); if (shortcutsModal) shortcutsModal.classList.toggle("visible"); break;
      }
    });

    // Scroll animations
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) { if (entry.isIntersecting) entry.target.classList.add("visible"); });
    }, { threshold: 0.1 });
    document.querySelectorAll(".message, .session-card").forEach(function(el) {
      el.classList.add("animate-on-scroll");
      observer.observe(el);
    });

    // Export functionality
    var exportBtn = document.querySelector(".export-button");
    var exportDropdown = document.querySelector(".export-dropdown");
    if (exportBtn && exportDropdown) {
      exportBtn.addEventListener("click", function(e) {
        e.stopPropagation();
        exportDropdown.classList.toggle("visible");
      });
      document.addEventListener("click", function() {
        exportDropdown.classList.remove("visible");
      });
    }

    function getSessionInfo() {
      var h1 = document.querySelector("h1");
      var time = document.querySelector(".transcript-header time");
      return {
        id: h1 ? h1.textContent.replace("Session: ", "") : "session",
        date: time ? time.textContent : new Date().toLocaleDateString()
      };
    }

    function formatTime(el) {
      var time = el.querySelector(".timestamp");
      return time ? time.textContent : "";
    }

    function getTextContent(el) {
      var content = el.querySelector(".message-content");
      return content ? content.textContent.trim() : "";
    }

    function exportMarkdown(filter) {
      var info = getSessionInfo();
      var lines = ["# Session: " + info.id, "*" + info.date + "*", ""];
      var msgs = document.querySelectorAll(".message");

      msgs.forEach(function(msg) {
        var role = msg.classList.contains("user") ? "User" : "Assistant";
        var time = formatTime(msg);

        // Apply filters
        if (filter === "user" && !msg.classList.contains("user")) return;
        if (filter === "assistant" && !msg.classList.contains("assistant")) return;
        if (filter === "steno" && !msg.classList.contains("steno-node")) return;

        if (filter === "code") {
          // Code blocks only
          msg.querySelectorAll("pre code").forEach(function(code) {
            var lang = (code.className.match(/language-(\\w+)/) || ["", ""])[1];
            lines.push("```" + lang);
            lines.push(code.textContent.trim());
            lines.push("```", "");
          });
          return;
        }

        lines.push("## " + role + (time ? " (" + time + ")" : ""));
        lines.push("");

        // Main content
        var content = getTextContent(msg);
        if (content) lines.push(content, "");

        // Thinking blocks (collapsed in markdown)
        var thinking = msg.querySelector(".thinking-content");
        if (thinking && filter !== "assistant-text") {
          lines.push("<details>");
          lines.push("<summary>Thinking</summary>");
          lines.push("");
          lines.push(thinking.textContent.trim());
          lines.push("");
          lines.push("</details>", "");
        }

        // Tool blocks (collapsed)
        msg.querySelectorAll(".tool-block").forEach(function(tool) {
          if (filter === "assistant-text") return;
          var summary = tool.querySelector("summary");
          var code = tool.querySelector("code");
          if (summary && code) {
            lines.push("<details>");
            lines.push("<summary>" + summary.textContent.trim() + "</summary>");
            lines.push("");
            lines.push("```json");
            lines.push(code.textContent.trim());
            lines.push("```");
            lines.push("");
            lines.push("</details>", "");
          }
        });

        lines.push("---", "");
      });

      return lines.join("\\n");
    }

    function downloadFile(content, filename, type) {
      var blob = new Blob([content], { type: type });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }

    window.exportTranscript = function(format, filter) {
      var info = getSessionInfo();
      var filename = "transcript-" + info.id;

      switch (format) {
        case "markdown":
          var md = exportMarkdown(filter || "all");
          var suffix = filter && filter !== "all" ? "-" + filter : "";
          downloadFile(md, filename + suffix + ".md", "text/markdown");
          break;
        case "pdf":
          window.print();
          break;
        case "json":
          // Export raw message data as JSON
          var msgs = [];
          document.querySelectorAll(".message").forEach(function(msg) {
            var role = msg.classList.contains("user") ? "user" : "assistant";
            msgs.push({
              role: role,
              content: getTextContent(msg),
              timestamp: formatTime(msg),
              isSteno: msg.classList.contains("steno-node")
            });
          });
          downloadFile(JSON.stringify(msgs, null, 2), filename + ".json", "application/json");
          break;
      }
      if (exportDropdown) exportDropdown.classList.remove("visible");
    };
  });
})();
"""


def get_index_javascript():
    """Return JavaScript specific to the index page for session filtering."""
    return """
(function() {
  // Session filtering
  var searchInput = document.querySelector(".transcript-search input");
  var searchStats = document.querySelector(".search-stats");
  var sessionCards = Array.from(document.querySelectorAll(".session-card"));
  var focusedIndex = -1;

  function filterSessions(query) {
    var visibleCount = 0;
    query = query.toLowerCase();
    sessionCards.forEach(function(card) {
      var text = card.textContent.toLowerCase();
      var matches = !query || text.includes(query);
      card.style.display = matches ? "" : "none";
      if (matches) visibleCount++;
    });
    if (searchStats) {
      searchStats.textContent = query ? visibleCount + " of " + sessionCards.length : "";
    }
    // Reset focus when filtering
    focusedIndex = -1;
    sessionCards.forEach(function(c) { c.classList.remove("focused"); });
  }

  if (searchInput) {
    var debounceTimer;
    searchInput.addEventListener("input", function() {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function() { filterSessions(searchInput.value); }, 150);
    });
  }

  // Keyboard navigation for session cards
  function getVisibleCards() {
    return sessionCards.filter(function(c) { return c.style.display !== "none"; });
  }

  function focusCard(index) {
    var visible = getVisibleCards();
    sessionCards.forEach(function(c) { c.classList.remove("focused"); });
    if (index >= 0 && index < visible.length) {
      focusedIndex = index;
      visible[index].classList.add("focused");
      visible[index].scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function openFocusedCard() {
    var visible = getVisibleCards();
    if (focusedIndex >= 0 && focusedIndex < visible.length) {
      var link = visible[focusedIndex].querySelector("a");
      if (link) window.location.href = link.href;
    }
  }

  var shortcutsModal = document.querySelector(".keyboard-shortcuts-modal");
  var toggle = document.querySelector(".theme-toggle");

  document.addEventListener("keydown", function(e) {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
      if (e.key === "Escape") { e.target.blur(); filterSessions(""); if (searchInput) searchInput.value = ""; }
      return;
    }
    var visible = getVisibleCards();
    switch (e.key) {
      case "j": case "ArrowDown":
        e.preventDefault();
        focusCard(focusedIndex < 0 ? 0 : Math.min(focusedIndex + 1, visible.length - 1));
        break;
      case "k": case "ArrowUp":
        e.preventDefault();
        focusCard(focusedIndex < 0 ? visible.length - 1 : Math.max(focusedIndex - 1, 0));
        break;
      case "Enter":
        if (focusedIndex >= 0) { e.preventDefault(); openFocusedCard(); }
        break;
      case "/":
        e.preventDefault();
        if (searchInput) searchInput.focus();
        break;
      case "Escape":
        if (shortcutsModal) shortcutsModal.classList.remove("visible");
        filterSessions("");
        if (searchInput) searchInput.value = "";
        focusedIndex = -1;
        sessionCards.forEach(function(c) { c.classList.remove("focused"); });
        break;
      case "d":
        if (toggle) toggle.click();
        break;
      case "?":
        e.preventDefault();
        if (shortcutsModal) shortcutsModal.classList.toggle("visible");
        break;
    }
  });
})();
"""


# ============================================
# Steno Node Parsing
# ============================================

# Steno command patterns
STENO_VERBS = ['dx', 'ch', 'mk', 'rm', 'rn', 'cp', 'mv', 'viz', 'stat', 'fork', 'switch', 'compare', 'merge', 'abandon', 'steno']
STENO_PATTERN = re.compile(r'^(' + '|'.join(STENO_VERBS) + r'):')


def load_steno_data(cwd):
    """Load steno nodes from graph.json and current-session.json."""
    steno_dir = Path(cwd) / ".steno"
    nodes = {}
    branches = []
    bookmarks = {}

    # Load graph.json
    graph_file = steno_dir / "graph.json"
    if graph_file.exists():
        try:
            with open(graph_file, 'r') as f:
                graph = json.load(f)

            branches = graph.get("branches", [])
            bookmarks = graph.get("bookmarks", {})

            # Extract nodes from all sessions
            for session in graph.get("sessions", []):
                for node in session.get("nodes", []):
                    nodes[node["id"]] = node
        except (json.JSONDecodeError, KeyError):
            pass

    # Load current-session.json
    current_file = steno_dir / "current-session.json"
    if current_file.exists():
        try:
            with open(current_file, 'r') as f:
                current = json.load(f)

            for node in current.get("nodes", []):
                nodes[node["id"]] = node
        except (json.JSONDecodeError, KeyError):
            pass

    return {
        "nodes": nodes,
        "branches": branches,
        "bookmarks": bookmarks
    }


def is_steno_command(text):
    """Check if text starts with a steno command pattern."""
    if not text:
        return False
    # Check first line only
    first_line = text.strip().split('\n')[0].strip()
    return bool(STENO_PATTERN.match(first_line))


def match_message_to_node(message_content, steno_nodes):
    """Try to match a message to a steno node by command text."""
    if not message_content or not steno_nodes:
        return None

    first_line = message_content.strip().split('\n')[0].strip()

    # Look for exact or partial match
    for node_id, node in steno_nodes.items():
        raw = node.get("raw", "")
        # Exact match
        if raw == first_line:
            return node
        # Partial match (message starts with command)
        if first_line.startswith(raw) or raw.startswith(first_line):
            return node

    return None


def generate_steno_tree(steno_data):
    """Generate ASCII tree visualization of steno nodes."""
    nodes = steno_data.get("nodes", {})
    branches = steno_data.get("branches", [])

    if not nodes:
        return ""

    lines = []

    # Build tree by branch
    main_branch = None
    other_branches = []

    for branch in branches:
        if branch.get("name") == "main":
            main_branch = branch
        else:
            other_branches.append(branch)

    # Sort nodes by ID number
    def node_sort_key(node_id):
        try:
            return int(node_id.replace("n_", ""))
        except:
            return 0

    def render_node(node_id, prefix="", is_last=True):
        node = nodes.get(node_id, {})
        raw = node.get("raw", "unknown")
        status = node.get("status", "complete")

        # Choose symbol
        if status == "failed":
            symbol = "✗"
        else:
            symbol = "○"

        connector = "└─" if is_last else "├─"
        lines.append(f"{prefix}{connector}{symbol} {node_id} {raw}")

        # Check for child branches
        child_prefix = prefix + ("  " if is_last else "│ ")
        child_branches = [b for b in other_branches if b.get("parentNode") == node_id]

        for i, child_branch in enumerate(child_branches):
            is_last_child = (i == len(child_branches) - 1)
            branch_name = child_branch.get("name", "")
            branch_status = child_branch.get("status", "active")

            status_icon = ""
            if branch_status == "merged":
                status_icon = " ✓"
            elif branch_status == "abandoned":
                status_icon = " ✗"

            lines.append(f"{child_prefix}{'└' if is_last_child else '├'}─⎯ [{branch_name}]{status_icon}")

            # Render branch nodes
            branch_nodes = child_branch.get("nodes", [])
            branch_prefix = child_prefix + ("  " if is_last_child else "│ ")

            for j, bn_id in enumerate(sorted(branch_nodes, key=node_sort_key)):
                is_last_bn = (j == len(branch_nodes) - 1)
                bn = nodes.get(bn_id, {})
                bn_raw = bn.get("raw", "unknown")
                bn_status = bn.get("status", "complete")
                bn_symbol = "✗" if bn_status == "failed" else "○"
                bn_connector = "└─" if is_last_bn else "├─"
                lines.append(f"{branch_prefix}{bn_connector}{bn_symbol} {bn_id} {bn_raw}")

    # Render main branch nodes
    if main_branch:
        main_nodes = sorted(main_branch.get("nodes", []), key=node_sort_key)
        for i, node_id in enumerate(main_nodes):
            is_last = (i == len(main_nodes) - 1)
            render_node(node_id, "", is_last)

    return "\n".join(lines) if lines else "No steno nodes found."


# ============================================
# Session Data Parsing
# ============================================

def get_project_path(cwd):
    """Convert working directory to Claude project path."""
    # Replace / with - and keep leading dash
    escaped = cwd.replace("/", "-")
    return CLAUDE_DIR / "projects" / escaped


def find_sessions(project_path):
    """Find all session JSONL files in a project."""
    if not project_path.exists():
        return []
    sessions = []
    for f in project_path.glob("*.jsonl"):
        # Skip agent files
        if f.name.startswith("agent-"):
            continue
        sessions.append(f)
    # Sort by modification time (newest first)
    sessions.sort(key=lambda x: x.stat().st_mtime, reverse=True)
    return sessions


def parse_session(session_file):
    """Parse a session JSONL file and extract messages."""
    messages = []
    session_id = session_file.stem
    first_timestamp = None

    with open(session_file, 'r') as f:
        for line in f:
            try:
                entry = json.loads(line.strip())
            except json.JSONDecodeError:
                continue

            entry_type = entry.get("type", "")

            # Skip non-message entries
            if entry_type in ("summary", "file-history-snapshot"):
                continue

            if entry_type not in ("user", "assistant"):
                continue

            msg = entry.get("message", {})
            content = msg.get("content", "")
            timestamp = entry.get("timestamp", "")
            uuid = entry.get("uuid", "")

            if first_timestamp is None and timestamp:
                first_timestamp = timestamp

            # Parse content
            if entry_type == "user":
                if isinstance(content, str):
                    messages.append({
                        "role": "user",
                        "content": content,
                        "timestamp": timestamp,
                        "uuid": uuid
                    })
                elif isinstance(content, list):
                    # Tool results
                    for block in content:
                        if block.get("type") == "tool_result":
                            messages.append({
                                "role": "tool_result",
                                "tool_use_id": block.get("tool_use_id", ""),
                                "content": block.get("content", ""),
                                "is_error": block.get("is_error", False),
                                "timestamp": timestamp,
                                "uuid": uuid
                            })

            elif entry_type == "assistant":
                if isinstance(content, list):
                    for block in content:
                        block_type = block.get("type", "")
                        if block_type == "thinking":
                            messages.append({
                                "role": "thinking",
                                "content": block.get("thinking", ""),
                                "timestamp": timestamp,
                                "uuid": uuid
                            })
                        elif block_type == "text":
                            messages.append({
                                "role": "assistant",
                                "content": block.get("text", ""),
                                "timestamp": timestamp,
                                "uuid": uuid
                            })
                        elif block_type == "tool_use":
                            messages.append({
                                "role": "tool_use",
                                "tool_name": block.get("name", ""),
                                "tool_input": block.get("input", {}),
                                "tool_id": block.get("id", ""),
                                "timestamp": timestamp,
                                "uuid": uuid
                            })

    return {
        "session_id": session_id,
        "messages": messages,
        "first_timestamp": first_timestamp,
        "message_count": len(messages)
    }


# ============================================
# Session Statistics
# ============================================

def calculate_session_stats(messages):
    """Calculate statistics for a session."""
    stats = {
        "total_messages": len(messages),
        "user_messages": 0,
        "assistant_messages": 0,
        "thinking_blocks": 0,
        "tool_calls": 0,
        "tool_results": 0,
        "tools_used": {},
        "estimated_tokens": 0,
        "duration_seconds": 0,
        "first_timestamp": None,
        "last_timestamp": None
    }

    for msg in messages:
        role = msg.get("role", "")
        content = msg.get("content", "")
        timestamp = msg.get("timestamp", "")

        # Track timestamps for duration
        if timestamp:
            if stats["first_timestamp"] is None:
                stats["first_timestamp"] = timestamp
            stats["last_timestamp"] = timestamp

        # Count by role
        if role == "user":
            stats["user_messages"] += 1
            if isinstance(content, str):
                stats["estimated_tokens"] += len(content) // 4
        elif role == "assistant":
            stats["assistant_messages"] += 1
            if isinstance(content, str):
                stats["estimated_tokens"] += len(content) // 4
        elif role == "thinking":
            stats["thinking_blocks"] += 1
            if isinstance(content, str):
                stats["estimated_tokens"] += len(content) // 4
        elif role == "tool_use":
            stats["tool_calls"] += 1
            tool_name = msg.get("tool_name", "Unknown")
            stats["tools_used"][tool_name] = stats["tools_used"].get(tool_name, 0) + 1
        elif role == "tool_result":
            stats["tool_results"] += 1

    # Calculate duration
    if stats["first_timestamp"] and stats["last_timestamp"]:
        try:
            first_dt = datetime.fromisoformat(stats["first_timestamp"].replace("Z", "+00:00"))
            last_dt = datetime.fromisoformat(stats["last_timestamp"].replace("Z", "+00:00"))
            stats["duration_seconds"] = int((last_dt - first_dt).total_seconds())
        except:
            pass

    return stats


def format_duration(seconds):
    """Format seconds as human-readable duration."""
    if seconds < 60:
        return f"{seconds}s"
    elif seconds < 3600:
        mins = seconds // 60
        secs = seconds % 60
        return f"{mins}m {secs}s"
    else:
        hours = seconds // 3600
        mins = (seconds % 3600) // 60
        return f"{hours}h {mins}m"


def generate_tool_chart_html(tools_used):
    """Generate CSS-only bar chart for tool usage."""
    if not tools_used:
        return ""

    # Sort by count descending
    sorted_tools = sorted(tools_used.items(), key=lambda x: x[1], reverse=True)
    max_count = max(tools_used.values()) if tools_used else 1

    bars = []
    for tool_name, count in sorted_tools[:10]:  # Top 10 tools
        percentage = (count / max_count) * 100
        bars.append(f'''
      <div class="tool-bar-row">
        <span class="tool-name">{escape(tool_name)}</span>
        <div class="tool-bar-container">
          <div class="tool-bar" style="width: {percentage}%"></div>
          <span class="tool-count">{count}</span>
        </div>
      </div>''')

    return f'''
    <div class="tool-chart">
      {"".join(bars)}
    </div>'''


def generate_stats_html(stats):
    """Generate HTML for session statistics card."""
    duration = format_duration(stats["duration_seconds"]) if stats["duration_seconds"] > 0 else "N/A"
    tokens_k = stats["estimated_tokens"] / 1000

    tool_chart = generate_tool_chart_html(stats["tools_used"])

    return f'''
    <details class="stats-panel">
      <summary>
        <span class="stats-summary">
          <span class="stat-item"><span class="stat-value">{stats["user_messages"]}</span> user</span>
          <span class="stat-item"><span class="stat-value">{stats["assistant_messages"]}</span> assistant</span>
          <span class="stat-item"><span class="stat-value">{stats["tool_calls"]}</span> tools</span>
          <span class="stat-item"><span class="stat-value">~{tokens_k:.1f}k</span> tokens</span>
          <span class="stat-item"><span class="stat-value">{duration}</span></span>
        </span>
      </summary>
      <div class="stats-details">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">Messages</div>
            <div class="stat-breakdown">
              <div><span class="stat-num">{stats["user_messages"]}</span> user prompts</div>
              <div><span class="stat-num">{stats["assistant_messages"]}</span> responses</div>
              <div><span class="stat-num">{stats["thinking_blocks"]}</span> thinking blocks</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Tools</div>
            <div class="stat-breakdown">
              <div><span class="stat-num">{stats["tool_calls"]}</span> tool calls</div>
              <div><span class="stat-num">{stats["tool_results"]}</span> results</div>
              <div><span class="stat-num">{len(stats["tools_used"])}</span> unique tools</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Tokens (est.)</div>
            <div class="stat-breakdown">
              <div><span class="stat-num">~{tokens_k:.1f}k</span> total</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Duration</div>
            <div class="stat-breakdown">
              <div><span class="stat-num">{duration}</span></div>
            </div>
          </div>
        </div>
        {f'<div class="tool-usage"><div class="stat-label">Tool Usage</div>{tool_chart}</div>' if tool_chart else ''}
      </div>
    </details>'''


# ============================================
# HTML Generation
# ============================================

def format_timestamp(ts):
    """Format ISO timestamp to readable time."""
    if not ts:
        return ""
    try:
        dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
        return dt.strftime("%H:%M:%S")
    except:
        return ts


def format_date(ts):
    """Format ISO timestamp to readable date."""
    if not ts:
        return ""
    try:
        dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
        return dt.strftime("%B %d, %Y")
    except:
        return ts


def render_message(msg, steno_node=None):
    """Render a single message to HTML.

    Args:
        msg: Message dict with role, content, timestamp, uuid
        steno_node: Optional steno node dict if this message is a steno command
    """
    role = msg.get("role", "")
    content = msg.get("content", "")
    timestamp = format_timestamp(msg.get("timestamp", ""))
    uuid = msg.get("uuid", "")[:8]

    # Build steno node badge if applicable
    node_badge = ""
    node_anchor = ""
    node_class = ""
    node_tooltip = ""

    if steno_node:
        node_id = steno_node.get("id", "")
        branch = steno_node.get("branch", "main")
        status = steno_node.get("status", "complete")
        summary = steno_node.get("summary", "")

        node_anchor = f'<a id="{node_id}"></a>\n'
        node_class = " steno-node"

        status_icon = "✓" if status == "complete" else "✗"
        branch_label = f" ({branch})" if branch != "main" else ""

        tooltip_text = escape(summary[:100]) if summary else ""
        node_tooltip = f' title="{tooltip_text}"' if tooltip_text else ""

        node_badge = f'''
    <span class="steno-node-badge"{node_tooltip}>
      <span class="node-id">{node_id}</span>
      <span class="node-status">{status_icon}</span>{branch_label}
    </span>'''

    if role == "user":
        return f'''{node_anchor}<article class="message user{node_class}" id="msg-{uuid}">
  <header class="message-header">
    <span class="role-label">USER</span>
    <time class="timestamp">{timestamp}</time>{node_badge}
  </header>
  <div class="message-content">{escape(str(content))}</div>
</article>'''

    elif role == "assistant":
        return f'''
<article class="message assistant" id="msg-{uuid}">
  <header class="message-header">
    <span class="role-label">CLAUDE</span>
    <time class="timestamp">{timestamp}</time>
  </header>
  <div class="message-content">{escape(str(content))}</div>
</article>'''

    elif role == "thinking":
        preview = content[:100] + "..." if len(content) > 100 else content
        return f'''
<article class="message assistant" id="msg-{uuid}">
  <header class="message-header">
    <span class="role-label">CLAUDE</span>
    <time class="timestamp">{timestamp}</time>
  </header>
  <details class="thinking-block">
    <summary>💭 Thinking</summary>
    <div class="thinking-content">{escape(str(content))}</div>
  </details>
</article>'''

    elif role == "tool_use":
        tool_name = msg.get("tool_name", "Unknown")
        tool_input = msg.get("tool_input", {})
        input_preview = json.dumps(tool_input, indent=2)[:500]
        return f'''
<article class="message assistant" id="msg-{uuid}">
  <header class="message-header">
    <span class="role-label">CLAUDE</span>
    <time class="timestamp">{timestamp}</time>
  </header>
  <details class="tool-block">
    <summary>🔧 Tool: {escape(tool_name)}</summary>
    <pre><code>{escape(input_preview)}</code></pre>
  </details>
</article>'''

    elif role == "tool_result":
        content_str = str(content)[:1000]
        is_error = msg.get("is_error", False)
        icon = "❌" if is_error else "📦"
        return f'''
<article class="message user" id="msg-{uuid}">
  <header class="message-header">
    <span class="role-label">USER</span>
    <time class="timestamp">{timestamp}</time>
  </header>
  <details class="tool-block" {"open" if is_error else ""}>
    <summary>{icon} Tool Result</summary>
    <pre><code>{escape(content_str)}</code></pre>
  </details>
</article>'''

    return ""


def generate_html(session_data, css, steno_data=None):
    """Generate complete HTML for a session.

    Args:
        session_data: Parsed session data with messages
        css: CSS string to embed
        steno_data: Optional steno node data for matching
    """
    session_id = session_data["session_id"]
    messages = session_data["messages"]
    first_timestamp = session_data.get("first_timestamp", "")
    steno_nodes = steno_data.get("nodes", {}) if steno_data else {}

    short_id = session_id[:8]
    date_str = format_date(first_timestamp)

    # Calculate session statistics
    stats = calculate_session_stats(messages)
    stats_html = generate_stats_html(stats)

    # Render messages with steno node matching
    matched_nodes = []
    messages_parts = []

    for msg in messages:
        steno_node = None
        if msg.get("role") == "user" and isinstance(msg.get("content"), str):
            # Check if this is a steno command
            if is_steno_command(msg["content"]):
                steno_node = match_message_to_node(msg["content"], steno_nodes)
                if steno_node:
                    matched_nodes.append(steno_node["id"])

        messages_parts.append(render_message(msg, steno_node))

    messages_html = "\n".join(messages_parts)

    # Store matched nodes count for stats
    node_count = len(matched_nodes)

    return f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Session: {short_id} - Steno Transcript</title>
  <style>
{css}
  </style>
</head>
<body>
  <div class="steno-theme-controls" style="position:fixed;top:1rem;right:1rem;z-index:1000;display:flex;gap:0.5rem;align-items:center;">
    <div class="export-container">
      <button class="export-button" aria-label="Export transcript">
        <span>📥</span> Export
      </button>
      <div class="export-dropdown">
        <div class="export-section">
          <div class="export-section-title">Full Transcript</div>
          <button onclick="exportTranscript('markdown')">Markdown (.md)</button>
          <button onclick="exportTranscript('json')">JSON (.json)</button>
          <button onclick="exportTranscript('pdf')">PDF (Print)</button>
        </div>
        <div class="export-section">
          <div class="export-section-title">Filtered Export</div>
          <button onclick="exportTranscript('markdown', 'user')">User messages only</button>
          <button onclick="exportTranscript('markdown', 'assistant')">Assistant only</button>
          <button onclick="exportTranscript('markdown', 'assistant-text')">Text only (no tools)</button>
          <button onclick="exportTranscript('markdown', 'code')">Code blocks only</button>
          <button onclick="exportTranscript('markdown', 'steno')">Steno commands only</button>
        </div>
      </div>
    </div>
    <div class="theme-selector">
      <button class="theme-selector-button" aria-label="Select color theme">
        <span class="theme-swatch-current"></span>
        <span class="theme-name">Purple</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>
      </button>
      <div class="theme-selector-dropdown">
        <button class="theme-option" data-color-theme="purple"><span class="theme-swatch" style="background:oklch(0.55 0.25 297)"></span>Purple</button>
        <button class="theme-option" data-color-theme="bubblegum"><span class="theme-swatch" style="background:oklch(0.62 0.18 348)"></span>Bubblegum</button>
        <button class="theme-option" data-color-theme="midnight"><span class="theme-swatch" style="background:oklch(0.57 0.20 283)"></span>Midnight</button>
        <button class="theme-option" data-color-theme="minimal"><span class="theme-swatch" style="background:oklch(0.62 0.19 260)"></span>Minimal</button>
      </div>
    </div>
    <button class="theme-toggle" aria-label="Toggle dark mode"></button>
  </div>

  <div class="transcript-search">
    <input type="search" placeholder="Search transcript... (press /)" />
    <span class="search-stats"></span>
    <div class="search-nav">
      <button class="search-prev" disabled>↑</button>
      <button class="search-next" disabled>↓</button>
    </div>
  </div>

  <div class="keyboard-shortcuts-modal">
    <div class="shortcuts-content">
      <h2>Keyboard Shortcuts</h2>
      <div class="shortcut-row"><span class="shortcut-key"><kbd>j</kbd> / <kbd>↓</kbd></span><span class="shortcut-desc">Next message</span></div>
      <div class="shortcut-row"><span class="shortcut-key"><kbd>k</kbd> / <kbd>↑</kbd></span><span class="shortcut-desc">Previous message</span></div>
      <div class="shortcut-row"><span class="shortcut-key"><kbd>/</kbd></span><span class="shortcut-desc">Focus search</span></div>
      <div class="shortcut-row"><span class="shortcut-key"><kbd>d</kbd></span><span class="shortcut-desc">Toggle dark mode</span></div>
      <div class="shortcut-row"><span class="shortcut-key"><kbd>t</kbd></span><span class="shortcut-desc">Toggle thinking blocks</span></div>
      <div class="shortcut-row"><span class="shortcut-key"><kbd>o</kbd></span><span class="shortcut-desc">Toggle tool blocks</span></div>
      <div class="shortcut-row"><span class="shortcut-key"><kbd>?</kbd></span><span class="shortcut-desc">Show this help</span></div>
    </div>
  </div>

  <main class="transcript-container container">
    <header class="transcript-header">
      <h1>Session: {short_id}</h1>
      <time>{date_str}</time>
    </header>

{stats_html}

{messages_html}

  </main>

  <footer class="steno-footer">
    <div class="steno-footer-links">
      <a href="index.html">All Sessions</a>
      <a href="https://github.com/scotthandley/steno-graph">Steno-Graph</a>
    </div>
    <div class="steno-footer-meta">
      {len(messages)} messages • Generated {datetime.now().strftime("%Y-%m-%d %H:%M")}
    </div>
  </footer>

  <script>
{get_javascript()}
  </script>
</body>
</html>'''


def generate_index(sessions_info, css, project_name="Steno-Graph", steno_data=None):
    """Generate index.html with list of all sessions and steno graph."""
    session_items = []
    for info in sessions_info:
        short_id = info["session_id"][:8]
        date_str = format_date(info.get("first_timestamp", ""))
        msg_count = info.get("message_count", 0)
        node_count = info.get("node_count", 0)
        preview = info.get("preview", "Session transcript")

        node_badge = ""
        if node_count > 0:
            node_badge = f'<span class="session-node-count">{node_count} nodes</span>'

        session_items.append(f'''
    <article class="session-card">
      <a href="{short_id}.html">
        <div class="session-card-header">
          <span class="session-date">{date_str}</span>
          <div class="session-stats">
            <span class="session-msg-count">{msg_count} messages</span>
            {node_badge}
          </div>
        </div>
        <div class="session-card-content">
          <p>{escape(preview[:100])}</p>
        </div>
      </a>
    </article>''')

    # Generate steno graph section if nodes exist
    steno_graph_section = ""
    if steno_data and steno_data.get("nodes"):
        tree = generate_steno_tree(steno_data)
        node_count = len(steno_data.get("nodes", {}))
        branch_count = len(steno_data.get("branches", []))
        steno_graph_section = f'''
    <section class="steno-graph-section">
      <header class="section-header">
        <h2>Steno Graph</h2>
        <span class="graph-stats">{node_count} nodes • {branch_count} branches</span>
      </header>
      <pre class="steno-graph">{escape(tree)}</pre>
    </section>
'''

    return f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{project_name} Transcripts</title>
  <style>
{css}
  </style>
</head>
<body>
  <div class="steno-theme-controls" style="position:fixed;top:1rem;right:1rem;z-index:1000;display:flex;gap:0.5rem;align-items:center;">
    <div class="theme-selector">
      <button class="theme-selector-button" aria-label="Select color theme">
        <span class="theme-swatch-current"></span>
        <span class="theme-name">Purple</span>
      </button>
      <div class="theme-selector-dropdown">
        <button class="theme-option" data-color-theme="purple"><span class="theme-swatch" style="background:oklch(0.55 0.25 297)"></span>Purple</button>
        <button class="theme-option" data-color-theme="bubblegum"><span class="theme-swatch" style="background:oklch(0.62 0.18 348)"></span>Bubblegum</button>
        <button class="theme-option" data-color-theme="midnight"><span class="theme-swatch" style="background:oklch(0.57 0.20 283)"></span>Midnight</button>
        <button class="theme-option" data-color-theme="minimal"><span class="theme-swatch" style="background:oklch(0.62 0.19 260)"></span>Minimal</button>
      </div>
    </div>
    <button class="theme-toggle" aria-label="Toggle dark mode"></button>
  </div>

  <div class="transcript-search">
    <input type="search" placeholder="Filter sessions... (press /)" />
    <span class="search-stats"></span>
  </div>

  <div class="keyboard-shortcuts-modal">
    <div class="shortcuts-content">
      <h2>Keyboard Shortcuts</h2>
      <div class="shortcut-row"><span class="shortcut-key"><kbd>j</kbd> / <kbd>↓</kbd></span><span class="shortcut-desc">Next session</span></div>
      <div class="shortcut-row"><span class="shortcut-key"><kbd>k</kbd> / <kbd>↑</kbd></span><span class="shortcut-desc">Previous session</span></div>
      <div class="shortcut-row"><span class="shortcut-key"><kbd>Enter</kbd></span><span class="shortcut-desc">Open session</span></div>
      <div class="shortcut-row"><span class="shortcut-key"><kbd>/</kbd></span><span class="shortcut-desc">Focus search</span></div>
      <div class="shortcut-row"><span class="shortcut-key"><kbd>d</kbd></span><span class="shortcut-desc">Toggle dark mode</span></div>
      <div class="shortcut-row"><span class="shortcut-key"><kbd>?</kbd></span><span class="shortcut-desc">Show this help</span></div>
    </div>
  </div>

  <main class="transcript-container container">
    <header class="transcript-header">
      <h1>{project_name} Transcripts</h1>
      <span>{len(sessions_info)} sessions</span>
    </header>
{steno_graph_section}
    <section class="session-list">
{"".join(session_items)}
    </section>
  </main>

  <footer class="steno-footer">
    <div class="steno-footer-meta">
      Generated {datetime.now().strftime("%Y-%m-%d %H:%M")}
    </div>
  </footer>

  <script>
{get_javascript()}
{get_index_javascript()}
  </script>
</body>
</html>'''


# ============================================
# Main Entry Point
# ============================================

def main():
    parser = argparse.ArgumentParser(description="Generate Steno transcript HTML")
    parser.add_argument("--all", action="store_true", help="Generate all sessions")
    parser.add_argument("--session", type=str, help="Specific session UUID")
    parser.add_argument("--output", type=str, default=DEFAULT_OUTPUT, help="Output directory")
    parser.add_argument("--cwd", type=str, default=os.getcwd(), help="Project directory")
    parser.add_argument("--css", type=str, help="Custom CSS file path")
    parser.add_argument("--open", action="store_true", help="Open in browser after generating")
    args = parser.parse_args()

    cwd = Path(args.cwd).resolve()
    output_dir = Path(args.output)
    if not output_dir.is_absolute():
        output_dir = cwd / output_dir
    output_dir.mkdir(parents=True, exist_ok=True)

    project_path = get_project_path(str(cwd))
    project_name = cwd.name

    if not project_path.exists():
        print(f"Error: No Claude project found for {cwd}", file=sys.stderr)
        print(f"Expected: {project_path}", file=sys.stderr)
        sys.exit(1)

    # Load CSS
    css = get_css(args.css)

    # Load steno data
    steno_data = load_steno_data(cwd)
    steno_nodes = steno_data.get("nodes", {})
    if steno_nodes:
        print(f"Loaded {len(steno_nodes)} steno nodes")

    # Find sessions
    sessions = find_sessions(project_path)
    if not sessions:
        print("No sessions found.", file=sys.stderr)
        sys.exit(1)

    print(f"Found {len(sessions)} sessions in {project_path.name}")

    # Generate transcripts
    sessions_info = []
    generated = []

    if args.session:
        # Specific session
        matching = [s for s in sessions if s.stem.startswith(args.session)]
        if not matching:
            print(f"Session not found: {args.session}", file=sys.stderr)
            sys.exit(1)
        sessions = matching[:1]
    elif not args.all:
        # Just the most recent session
        sessions = sessions[:1]

    for session_file in sessions:
        print(f"Processing: {session_file.stem[:8]}...")
        session_data = parse_session(session_file)

        if session_data["message_count"] == 0:
            print(f"  Skipping (no messages)")
            continue

        # Get preview from first user message and count steno nodes
        preview = ""
        node_count = 0
        for msg in session_data["messages"]:
            if msg.get("role") == "user" and isinstance(msg.get("content"), str):
                if not preview:
                    preview = msg["content"][:100]
                # Count steno commands
                if is_steno_command(msg["content"]):
                    if match_message_to_node(msg["content"], steno_nodes):
                        node_count += 1

        # Generate HTML with steno data
        html = generate_html(session_data, css, steno_data)
        short_id = session_data["session_id"][:8]
        output_file = output_dir / f"{short_id}.html"
        output_file.write_text(html)
        generated.append(output_file)

        node_info = f", {node_count} nodes" if node_count > 0 else ""
        sessions_info.append({
            "session_id": session_data["session_id"],
            "message_count": session_data["message_count"],
            "first_timestamp": session_data.get("first_timestamp"),
            "preview": preview,
            "file": f"{short_id}.html",
            "node_count": node_count
        })

        print(f"  ✓ {output_file.name} ({session_data['message_count']} messages{node_info})")

    # Generate index if multiple sessions
    if args.all or len(sessions_info) > 1:
        # Load existing sessions from transcript-links.json
        links_file = cwd / ".steno" / "transcript-links.json"
        existing_info = []
        if links_file.exists():
            try:
                links_data = json.loads(links_file.read_text())
                for sid, sdata in links_data.get("sessions", {}).items():
                    if not any(s["session_id"] == sid for s in sessions_info):
                        existing_info.append({
                            "session_id": sid,
                            "message_count": sdata.get("message_count", 0),
                            "file": sdata.get("file", ""),
                            "preview": "Previous session"
                        })
            except:
                pass

        all_sessions = sessions_info + existing_info
        index_html = generate_index(all_sessions, css, project_name, steno_data)
        index_file = output_dir / "index.html"
        index_file.write_text(index_html)
        node_info = f", {len(steno_nodes)} nodes" if steno_nodes else ""
        print(f"  ✓ index.html ({len(all_sessions)} sessions{node_info})")

    # Update transcript-links.json
    links_file = cwd / ".steno" / "transcript-links.json"
    links_data = {
        "version": "2.0",
        "type": "native",
        "generated_at": datetime.now().astimezone().isoformat(),
        "output_dir": str(output_dir.relative_to(cwd)),
        "sessions": {}
    }

    # Preserve existing sessions
    if links_file.exists():
        try:
            old_data = json.loads(links_file.read_text())
            links_data["sessions"] = old_data.get("sessions", {})
        except:
            pass

    # Add new sessions
    for info in sessions_info:
        links_data["sessions"][info["session_id"]] = {
            "file": info["file"],
            "message_count": info["message_count"],
            "nodes": []
        }

    links_file.parent.mkdir(parents=True, exist_ok=True)
    links_file.write_text(json.dumps(links_data, indent=2))

    print(f"\nGenerated {len(generated)} transcript(s)")
    print(f"Output: {output_dir}")

    # Open in browser if requested
    if args.open and generated:
        import subprocess
        subprocess.run(["open", str(generated[0])], check=False)


if __name__ == "__main__":
    main()
