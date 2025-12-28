#!/bin/bash
#
# inject-theme.sh - Apply shadcn theme to Claude Code transcripts
#
# Usage:
#   ./scripts/inject-theme.sh [transcripts-dir]
#
# Examples:
#   ./scripts/inject-theme.sh                          # Default: .steno/transcripts/
#   ./scripts/inject-theme.sh ~/my-transcripts/        # Custom directory
#   ./scripts/inject-theme.sh --embed                  # Embed CSS inline
#   ./scripts/inject-theme.sh --dry-run                # Preview changes
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory (where steno-transcript.css lives)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"
CSS_FILE="$REPO_DIR/assets/steno-transcript.css"

# Default values
TRANSCRIPTS_DIR=".steno/transcripts"
EMBED_CSS=false
DRY_RUN=false
VERBOSE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --embed)
            EMBED_CSS=true
            shift
            ;;
        --dry-run|-n)
            DRY_RUN=true
            shift
            ;;
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS] [transcripts-dir]"
            echo ""
            echo "Apply shadcn theme to Claude Code transcript HTML files."
            echo ""
            echo "Options:"
            echo "  --embed      Embed CSS inline instead of linking"
            echo "  --dry-run    Preview changes without modifying files"
            echo "  --verbose    Show detailed output"
            echo "  --help       Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                              # Theme .steno/transcripts/"
            echo "  $0 ~/my-transcripts/            # Theme custom directory"
            echo "  $0 --embed --dry-run            # Preview inline embedding"
            exit 0
            ;;
        -*)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
        *)
            TRANSCRIPTS_DIR="$1"
            shift
            ;;
    esac
done

# Verify CSS file exists
if [[ ! -f "$CSS_FILE" ]]; then
    echo -e "${RED}Error: CSS file not found: $CSS_FILE${NC}"
    echo "Make sure you're running from the steno-graph repository."
    exit 1
fi

# Verify transcripts directory exists
if [[ ! -d "$TRANSCRIPTS_DIR" ]]; then
    echo -e "${RED}Error: Transcripts directory not found: $TRANSCRIPTS_DIR${NC}"
    echo ""
    echo "Generate transcripts first:"
    echo "  steno:transcript +generate"
    exit 1
fi

echo -e "${BLUE}Steno Theme Injector${NC}"
echo "━━━━━━━━━━━━━━━━━━━━"
echo ""

# Find all HTML files
HTML_FILES=$(find "$TRANSCRIPTS_DIR" -name "*.html" -type f)
FILE_COUNT=$(echo "$HTML_FILES" | grep -c "." || echo 0)

if [[ $FILE_COUNT -eq 0 ]]; then
    echo -e "${YELLOW}No HTML files found in $TRANSCRIPTS_DIR${NC}"
    exit 0
fi

echo -e "Found ${GREEN}$FILE_COUNT${NC} HTML files in $TRANSCRIPTS_DIR"
echo ""

# Copy CSS file to transcripts directory (unless embedding)
if [[ "$EMBED_CSS" = false ]]; then
    CSS_DEST="$TRANSCRIPTS_DIR/steno-transcript.css"
    if [[ "$DRY_RUN" = true ]]; then
        echo -e "${YELLOW}[DRY RUN]${NC} Would copy CSS to: $CSS_DEST"
    else
        cp "$CSS_FILE" "$CSS_DEST"
        echo -e "${GREEN}✓${NC} Copied CSS to: $CSS_DEST"
    fi
fi

# Theme controls HTML
TOGGLE_HTML='<div class="steno-theme-controls" style="position:fixed;top:1rem;right:1rem;z-index:1000;display:flex;gap:0.5rem;align-items:center;">
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
</div>'

# JavaScript for theme handling
THEME_SCRIPT='<script>
(function() {
  var themes = {
    purple: { name: "Purple", color: "oklch(0.55 0.25 297)" },
    bubblegum: { name: "Bubblegum", color: "oklch(0.62 0.18 348)" },
    midnight: { name: "Midnight", color: "oklch(0.57 0.20 283)" },
    minimal: { name: "Minimal", color: "oklch(0.62 0.19 260)" }
  };

  // Prevent transition flash on load
  document.documentElement.classList.add("no-transitions");

  // Load saved preferences
  var savedMode = localStorage.getItem("steno-mode");
  var savedColor = localStorage.getItem("steno-color-theme") || "purple";
  var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  // Apply dark mode
  if (savedMode === "dark" || (!savedMode && prefersDark)) {
    document.body.classList.add("dark");
  }

  // Apply color theme
  if (savedColor && savedColor !== "purple") {
    document.body.setAttribute("data-color-theme", savedColor);
  }

  // Re-enable transitions after load
  window.addEventListener("load", function() {
    setTimeout(function() {
      document.documentElement.classList.remove("no-transitions");
    }, 100);
  });

  document.addEventListener("DOMContentLoaded", function() {
    // Dark mode toggle
    var toggle = document.querySelector(".theme-toggle");
    if (toggle) {
      toggle.addEventListener("click", function() {
        document.body.classList.toggle("dark");
        var isDark = document.body.classList.contains("dark");
        localStorage.setItem("steno-mode", isDark ? "dark" : "light");
      });
    }

    // Color theme selector
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

    // Initialize UI
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

    // Scroll fade-in animation
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll(".index-item, .message, .session-card").forEach(function(el) {
      el.classList.add("animate-on-scroll");
      observer.observe(el);
    });
  });
})();
</script>'

# Process each HTML file
UPDATED=0
SKIPPED=0

echo ""
echo "Processing files..."

while IFS= read -r html_file; do
    [[ -z "$html_file" ]] && continue

    # Check if already themed
    if grep -q "steno-transcript.css" "$html_file" 2>/dev/null; then
        if [[ "$VERBOSE" = true ]]; then
            echo -e "${YELLOW}⊘${NC} Already themed: $(basename "$html_file")"
        fi
        ((SKIPPED++))
        continue
    fi

    # Calculate relative path to CSS
    FILE_DIR=$(dirname "$html_file")
    REL_PATH=$(python3 -c "import os.path; print(os.path.relpath('$TRANSCRIPTS_DIR', '$FILE_DIR'))" 2>/dev/null || echo ".")
    CSS_REL_PATH="$REL_PATH/steno-transcript.css"

    if [[ "$DRY_RUN" = true ]]; then
        echo -e "${YELLOW}[DRY RUN]${NC} Would update: $(basename "$html_file")"
        ((UPDATED++))
        continue
    fi

    # Create backup
    cp "$html_file" "${html_file}.bak"

    # Link to external CSS
    LINK_TAG="<link rel=\"stylesheet\" href=\"$CSS_REL_PATH\">"

    if [[ "$(uname)" == "Darwin" ]]; then
        # macOS sed
        sed -i '' "s|</head>|$LINK_TAG</head>|" "$html_file"
        # Add toggle after <body>
        sed -i '' "s|<body>|<body>$TOGGLE_HTML|" "$html_file"
    else
        # GNU sed
        sed -i "s|</head>|$LINK_TAG\n</head>|" "$html_file"
        sed -i "s|<body>|<body>\n$TOGGLE_HTML|" "$html_file"
    fi

    # Add theme script before </body>
    if [[ "$(uname)" == "Darwin" ]]; then
        # Create temp file with script (macOS sed struggles with multiline)
        SCRIPT_ESCAPED=$(printf '%s\n' "$THEME_SCRIPT" | sed 's/[&/\]/\\&/g' | tr '\n' '\r')
        perl -i -pe "s|</body>|$THEME_SCRIPT</body>|" "$html_file" 2>/dev/null || true
    else
        perl -i -pe "s|</body>|$THEME_SCRIPT</body>|" "$html_file" 2>/dev/null || true
    fi

    # Clean up temp files
    rm -f "${html_file}.tmp"

    if [[ "$VERBOSE" = true ]]; then
        echo -e "${GREEN}✓${NC} Updated: $(basename "$html_file")"
    fi

    ((UPDATED++))

done <<< "$HTML_FILES"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}Done!${NC}"
echo ""
echo "  Updated: $UPDATED files"
echo "  Skipped: $SKIPPED files (already themed)"
echo ""

if [[ "$DRY_RUN" = true ]]; then
    echo -e "${YELLOW}This was a dry run. No files were modified.${NC}"
    echo "Run without --dry-run to apply changes."
else
    echo "Theme applied! Open any transcript HTML to see the new styling."
    echo ""
    echo "Features:"
    echo "  ☀️/🌙 Click the icon button (top-right) to toggle dark mode"
    echo "  💾  Theme preference saved to localStorage"
    echo "  🎨  Smooth transitions between themes"
    echo "  ✨  Scroll animations on cards"
fi
