# Steno-Graph Specification

This directory contains the formal specification of the steno-graph grammar.

## Contents

### grammar/
The reference parser implementation:
- `tokenizer.ts` — Token classification
- `parser.ts` — Token → Intent parsing
- `types.ts` — Intent, Token, Verb types
- `parser.test.ts` — 32 grammar tests

### extensions/
The vocabulary extension system:
- `core.ts` — Core verbs, flags, modes
- `resolver.ts` — Extension registration
- `types.ts` — Configuration types
- `config.test.ts` — 20 extension tests

## Purpose

This specification:
1. **Documents** the exact grammar rules
2. **Validates** syntax correctness
3. **Provides types** for TypeScript consumers
4. **Tests** edge cases systematically

## Note

For Claude Code integration, use the skill at `.claude/skills/steno/`.
Claude parses and executes commands directly — this spec is reference documentation.
