# Contributing to Steno-Graph

Thank you for your interest in contributing to steno-graph!

## How to Contribute

### Reporting Issues

- Use the [issue templates](.github/ISSUE_TEMPLATE/) for bugs, features, or questions
- Search existing issues before creating a new one
- Include steno commands and expected vs actual behavior

### Suggesting Grammar Enhancements

Steno-graph's power comes from its terse, consistent grammar. When proposing new verbs or modifiers:

1. **Follow existing patterns** - New syntax should feel natural alongside existing commands
2. **Prioritize terseness** - Fewer keystrokes is better
3. **Stay domain-agnostic** - Avoid domain-specific vocabulary in core grammar

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-verb`)
3. Make your changes
4. Update documentation:
   - `SKILL.md` - Grammar and behavior (source of truth)
   - `CHEATSHEET.md` - Quick reference
   - `README.md` - User-facing docs
5. Test with Claude Code
6. Submit a pull request

### Testing Changes

After modifying the skill, test in a fresh Claude Code session:

```bash
claude --dangerously-skip-permissions
```

Test core commands:
```
dx:@README.md
steno:history
steno:graph
fork:test
switch:main
steno:undo
```

## Project Structure

```
steno-graph/
├── .claude/skills/steno/SKILL.md  # THE skill - source of truth
├── CHEATSHEET.md                  # Quick reference
├── README.md                      # User documentation
├── examples/                      # Usage vignettes
└── design/                        # Design documents
```

## Code of Conduct

Be respectful, constructive, and focused on improving the project.

## Questions?

Open an issue with the "question" template.
