/**
 * Steno-Graph Parser Factory
 *
 * Creates configurable parsers with custom vocabulary.
 * This is the main entry point for using steno-graph with configuration.
 */

import { Token, TokenType, Intent, ParseResult, Target, Reference, Flag, Precision, Thinking } from './types.js';
import {
  ParserConfig,
  ResolvedVocabulary,
  resolveVocabulary,
  isKnownVerb,
  isKnownFlag,
  isKnownMode,
  resolveVerbAlias,
  getVerbTokens,
  getFlagTokens,
  getModeTokens,
} from '../config/index.js';

/**
 * A configured parser instance
 */
export interface StenoParser {
  /**
   * Parse stenographic input into an Intent object
   */
  parse(input: string): ParseResult;

  /**
   * Tokenize input into classified tokens
   */
  tokenize(input: string): Token[];

  /**
   * Get the resolved vocabulary
   */
  getVocabulary(): ResolvedVocabulary;

  /**
   * Check if a token is a known verb
   */
  isVerb(token: string): boolean;

  /**
   * Check if a token is a known flag
   */
  isFlag(token: string): boolean;

  /**
   * Check if a token is a known mode
   */
  isMode(token: string): boolean;
}

/**
 * Create a configured parser
 */
export function createParser(config: ParserConfig = {}): StenoParser {
  const vocab = resolveVocabulary(config);
  const strict = config.strict ?? false;

  // Build regex patterns from vocabulary
  const verbPattern = new RegExp(`^(${getVerbTokens(vocab).join('|')}):([^\\s]+)`);
  const flagPattern = new RegExp(`^\\.(${getFlagTokens(vocab).join('|')})(?::([\\w-]+))?\\b`);
  const modePattern = new RegExp(`^[?~](${getModeTokens(vocab).join('|')})`);

  // Token patterns in priority order
  const patterns: Array<{
    type: TokenType;
    pattern: RegExp;
    extract?: (match: RegExpMatchArray) => Partial<Token>;
  }> = [
    // Verb:Target - the anchor of every command
    {
      type: 'VERB_TARGET',
      pattern: verbPattern,
      extract: (m) => ({ value: m[1], qualifier: m[2] }),
    },

    // Mode prefixes: ?plan, ?sketch, etc.
    {
      type: 'MODE',
      pattern: modePattern,
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

    // Flags with optional qualifier
    {
      type: 'FLAG',
      pattern: flagPattern,
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
      extract: (m) => ({ value: m[1], qualifier: m[2] }),
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
   * Tokenize input string
   */
  function tokenize(input: string): Token[] {
    const tokens: Token[] = [];
    let remaining = input.trim();

    while (remaining.length > 0) {
      // Skip whitespace
      const wsMatch = remaining.match(/^\s+/);
      if (wsMatch) {
        remaining = remaining.slice(wsMatch[0].length);
        continue;
      }

      let matched = false;

      // Try each pattern in priority order
      for (const { type, pattern, extract } of patterns) {
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
          matched = true;
          break;
        }
      }

      // If no pattern matched, capture as freeform
      if (!matched) {
        const freeformMatch = remaining.match(/^[^\s]+/);
        if (freeformMatch) {
          // Check if this looks like a dot-modifier
          const dotMatch = freeformMatch[0].match(/^\.([\w-]+)/);
          if (dotMatch) {
            // Unknown .modifier becomes ADDITION
            tokens.push({
              type: 'ADDITION',
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
        }
      }
    }

    return tokens;
  }

  /**
   * Parse stenographic input into an Intent object
   */
  function parse(input: string): ParseResult {
    const errors: Array<{ message: string; position?: number; token?: string }> = [];
    const warnings: string[] = [];

    // Handle empty input
    if (!input.trim()) {
      return {
        success: false,
        errors: [{ message: 'Empty input' }],
        warnings: [],
      };
    }

    // Tokenize
    const tokens = tokenize(input);

    // Find the verb:target token
    const verbTargetToken = tokens.find((t) => t.type === 'VERB_TARGET');

    // Initialize intent components
    let verb = 'mk'; // Default verb
    let target: Target;
    let mode: string | undefined;
    let precision: Precision = 'flexible';
    let thinking: Thinking = 'normal';
    const additions: string[] = [];
    const exclusions: string[] = [];
    const flags: Flag[] = [];
    const refs: Reference[] = [];
    const freeform: string[] = [];

    // Check for mode prefix
    const modeToken = tokens.find((t) => t.type === 'MODE');
    if (modeToken) {
      mode = modeToken.value;
    }

    // Process verb:target
    if (verbTargetToken) {
      // Resolve alias if applicable
      verb = resolveVerbAlias(vocab, verbTargetToken.value);
      target = inferTargetType(verbTargetToken.qualifier || '');
    } else {
      // No explicit verb:target
      const firstFreeform = tokens.find((t) => t.type === 'FREEFORM');
      if (firstFreeform) {
        target = inferTargetType(firstFreeform.value);
        warnings.push(`No verb specified, defaulting to 'mk:${firstFreeform.value}'`);
      } else {
        const firstRef = tokens.find((t) =>
          ['NODE_REF', 'FILE_REF', 'SYMBOL_REF'].includes(t.type)
        );
        if (firstRef) {
          target = inferTargetType('@' + firstRef.value);
        } else {
          return {
            success: false,
            errors: [{ message: 'No target specified' }],
            warnings: [],
          };
        }
      }
    }

    // Process all tokens
    for (const token of tokens) {
      switch (token.type) {
        case 'VERB_TARGET':
        case 'MODE':
          break;

        case 'ADDITION':
          additions.push(token.value);
          break;

        case 'EXCLUSION':
          exclusions.push(token.value);
          break;

        case 'FLAG':
          if (isKnownFlag(vocab, token.value)) {
            flags.push({
              type: token.value as any,
              qualifier: token.qualifier,
            });
          } else if (strict) {
            errors.push({ message: `Unknown flag: .${token.value}`, token: token.raw });
          }
          break;

        case 'DEEP':
          thinking = 'deep';
          break;

        case 'PRECISION':
          precision = parsePrecision(token.value);
          break;

        case 'PREV_REF':
          refs.push({
            type: 'previous',
            value: token.value,
            selector: token.qualifier,
          });
          break;

        case 'NODE_REF':
          refs.push({
            type: 'node',
            value: token.value,
            selector: token.qualifier,
          });
          break;

        case 'FILE_REF':
          refs.push({
            type: 'file',
            value: token.value,
            selector: token.qualifier,
          });
          break;

        case 'SYMBOL_REF':
          refs.push({
            type: 'symbol',
            value: token.value,
          });
          break;

        case 'QUOTED':
          freeform.push(token.value);
          break;

        case 'FREEFORM':
          // Skip if this was used as the target
          if (!verbTargetToken && tokens.indexOf(token) === tokens.findIndex((t) => t.type === 'FREEFORM')) {
            continue;
          }
          freeform.push(token.value);
          break;
      }
    }

    // Handle trailing ? or ! as precision markers
    if (target.raw.endsWith('?')) {
      target = { ...target, raw: target.raw.slice(0, -1) };
      precision = 'clarify';
    }
    if (target.raw.endsWith('!')) {
      target = { ...target, raw: target.raw.slice(0, -1) };
      precision = 'literal';
    }

    const intent: Intent = {
      verb: verb as any,
      target,
      additions,
      exclusions,
      flags,
      precision,
      thinking,
      mode: mode as any,
      refs,
      freeform,
      raw: input,
    };

    return {
      success: errors.length === 0,
      intent,
      errors,
      warnings,
    };
  }

  return {
    parse,
    tokenize,
    getVocabulary: () => vocab,
    isVerb: (token: string) => isKnownVerb(vocab, token),
    isFlag: (token: string) => isKnownFlag(vocab, token),
    isMode: (token: string) => isKnownMode(vocab, token),
  };
}

/**
 * Infer target type from the raw target string
 */
function inferTargetType(raw: string): Target {
  if (raw.startsWith('@') && raw.includes('.')) {
    return { raw, type: 'file' };
  }
  if (raw.startsWith('@')) {
    return { raw, type: 'node' };
  }
  if (raw.startsWith('#')) {
    return { raw, type: 'symbol' };
  }
  if (raw.includes('.') && /\.(ts|js|py|go|rs|tsx|jsx|json|md|yaml|yml)$/.test(raw)) {
    return { raw, type: 'file' };
  }
  if (raw.includes('/')) {
    return { raw, type: 'new' };
  }
  return { raw, type: 'new' };
}

/**
 * Parse precision marker to type
 */
function parsePrecision(marker: string): Precision {
  switch (marker) {
    case '!':
      return 'literal';
    case '?':
      return 'clarify';
    case '~':
    default:
      return 'flexible';
  }
}
