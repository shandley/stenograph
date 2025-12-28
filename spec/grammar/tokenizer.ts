/**
 * Steno-Graph Tokenizer
 *
 * Breaks input into classified tokens. Order of pattern matching matters—
 * more specific patterns are checked before general ones.
 */

import { Token, TokenType, VERBS, FLAGS, MODES } from './types.js';

// Token patterns in priority order
const PATTERNS: Array<{ type: TokenType; pattern: RegExp; extract?: (match: RegExpMatchArray) => Partial<Token> }> = [
  // Verb:Target - the anchor of every command
  {
    type: 'VERB_TARGET',
    pattern: new RegExp(`^(${VERBS.join('|')}):([^\\s]+)`),
    extract: (m) => ({ value: m[1], qualifier: m[2] }),  // verb in value, target in qualifier
  },

  // Mode prefixes: ?plan, ?sketch, ?challenge, ~explore, ~execute
  {
    type: 'MODE',
    pattern: new RegExp(`^[?~](${MODES.join('|')})`),
    extract: (m) => ({ value: m[1] }),
  },

  // Deep thinking: ~deep
  {
    type: 'DEEP',
    pattern: /^~deep\b/,
    extract: () => ({ value: 'deep' }),
  },

  // Precision markers (standalone): ~, !, ?
  {
    type: 'PRECISION',
    pattern: /^([~!?])(?=\s|$)/,
    extract: (m) => ({ value: m[1] }),
  },

  // Flags with optional qualifier: .ts, .ts:edge, .doc, .dry, .web
  {
    type: 'FLAG',
    pattern: new RegExp(`^\\.(${FLAGS.join('|')})(?::([\\w-]+))?\\b`),
    extract: (m) => ({ value: m[1], qualifier: m[2] }),
  },

  // Previous reference: ^, ^^, ^2, ^signup
  {
    type: 'PREV_REF',
    pattern: /^(\^+)(\d+|[\w-]+)?/,
    extract: (m) => ({ value: m[1], qualifier: m[2] }),
  },

  // File reference: @filename.ext
  {
    type: 'FILE_REF',
    pattern: /^@([\w-]+\.[\w]+)(?:\.([\w]+))?/,
    extract: (m) => ({ value: m[1], qualifier: m[2] }),  // qualifier for @file.ts.export
  },

  // Node reference: @node-name, @node.selector
  {
    type: 'NODE_REF',
    pattern: /^@([\w-]+)(?:\.([\w-]+))?/,
    extract: (m) => ({ value: m[1], qualifier: m[2] }),
  },

  // Symbol reference: #symbolName
  {
    type: 'SYMBOL_REF',
    pattern: /^#([\w]+)/,
    extract: (m) => ({ value: m[1] }),
  },

  // Addition: +feature-name
  {
    type: 'ADDITION',
    pattern: /^\+([\w-]+)/,
    extract: (m) => ({ value: m[1] }),
  },

  // Exclusion: -feature-name
  {
    type: 'EXCLUSION',
    pattern: /^-([\w-]+)/,
    extract: (m) => ({ value: m[1] }),
  },

  // Quoted string: "anything here"
  {
    type: 'QUOTED',
    pattern: /^"([^"]*)"/,
    extract: (m) => ({ value: m[1] }),
  },
];

/**
 * Tokenize input string into classified tokens
 */
export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let remaining = input.trim();
  let position = 0;

  while (remaining.length > 0) {
    // Skip whitespace
    const wsMatch = remaining.match(/^\s+/);
    if (wsMatch) {
      remaining = remaining.slice(wsMatch[0].length);
      position += wsMatch[0].length;
      continue;
    }

    let matched = false;

    // Try each pattern in priority order
    for (const { type, pattern, extract } of PATTERNS) {
      const match = remaining.match(pattern);
      if (match) {
        const extracted = extract ? extract(match) : {};
        tokens.push({
          type,
          value: extracted.value ?? match[1] ?? match[0],
          raw: match[0],
          qualifier: extracted.qualifier,
        });
        remaining = remaining.slice(match[0].length);
        position += match[0].length;
        matched = true;
        break;
      }
    }

    // If no pattern matched, capture as freeform until next whitespace or known prefix
    if (!matched) {
      const freeformMatch = remaining.match(/^[^\s]+/);
      if (freeformMatch) {
        // Check if this looks like an unknown dot-modifier (treat as addition)
        const dotMatch = freeformMatch[0].match(/^\.([\w-]+)/);
        if (dotMatch) {
          tokens.push({
            type: 'ADDITION',  // Unknown .modifier becomes +modifier
            value: dotMatch[1],
            raw: freeformMatch[0],
          });
        } else {
          tokens.push({
            type: 'FREEFORM',
            value: freeformMatch[0],
            raw: freeformMatch[0],
          });
        }
        remaining = remaining.slice(freeformMatch[0].length);
        position += freeformMatch[0].length;
      }
    }
  }

  return tokens;
}

/**
 * Debug helper: format tokens for display
 */
export function formatTokens(tokens: Token[]): string {
  return tokens
    .map((t) => {
      const qual = t.qualifier ? `:${t.qualifier}` : '';
      return `${t.type}(${t.value}${qual})`;
    })
    .join(' ');
}
