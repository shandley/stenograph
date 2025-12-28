/**
 * Steno-Graph Parser
 *
 * Assembles tokens into a structured Intent object.
 * The parser is lenient—it extracts what it can and passes
 * unrecognized content to Claude via the freeform array.
 */

import { tokenize, formatTokens } from './tokenizer.js';
import {
  Token,
  Intent,
  ParseResult,
  ParseError,
  Verb,
  Target,
  TargetType,
  Reference,
  RefType,
  Flag,
  FlagType,
  Mode,
  Precision,
  Thinking,
  VERBS,
  FLAGS,
} from './types.js';

/**
 * Parse stenographic input into an Intent object
 */
export function parse(input: string): ParseResult {
  const errors: ParseError[] = [];
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

  // Find the verb:target token (anchor)
  const verbTargetToken = tokens.find((t) => t.type === 'VERB_TARGET');

  // Extract components
  let verb: Verb = 'mk';  // Default verb
  let target: Target;
  let mode: Mode | undefined;
  let precision: Precision = 'flexible';
  let thinking: Thinking = 'normal';
  const additions: string[] = [];
  const exclusions: string[] = [];
  const flags: Flag[] = [];
  const refs: Reference[] = [];
  const freeform: string[] = [];

  // Check for mode prefix (might set implicit verb)
  const modeToken = tokens.find((t) => t.type === 'MODE');
  if (modeToken) {
    mode = modeToken.value as Mode;
    // Modes like ?plan imply 'mk' verb if no explicit verb
  }

  // Process verb:target
  if (verbTargetToken) {
    verb = verbTargetToken.value as Verb;
    target = inferTargetType(verbTargetToken.qualifier || '');
  } else {
    // No explicit verb:target
    // Look for the first freeform token to use as target
    const firstFreeform = tokens.find((t) => t.type === 'FREEFORM');
    if (firstFreeform) {
      target = inferTargetType(firstFreeform.value);
      // Don't add this to freeform array since it's the target
      warnings.push(`No verb specified, defaulting to 'mk:${firstFreeform.value}'`);
    } else {
      // Check if there's a node/file ref that could be the target
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
        // Already processed
        break;

      case 'MODE':
        // Already processed
        break;

      case 'ADDITION':
        additions.push(token.value);
        break;

      case 'EXCLUSION':
        exclusions.push(token.value);
        break;

      case 'FLAG':
        if (FLAGS.includes(token.value as FlagType)) {
          flags.push({
            type: token.value as FlagType,
            qualifier: token.qualifier,
          });
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
          value: token.value,  // ^, ^^
          selector: token.qualifier,  // 2, signup, etc.
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

  // Handle trailing ? as precision marker
  if (target.raw.endsWith('?')) {
    target.raw = target.raw.slice(0, -1);
    precision = 'clarify';
  }

  // Handle trailing ! as precision marker
  if (target.raw.endsWith('!')) {
    target.raw = target.raw.slice(0, -1);
    precision = 'literal';
  }

  const intent: Intent = {
    verb,
    target,
    additions,
    exclusions,
    flags,
    precision,
    thinking,
    mode,
    refs,
    freeform,
    raw: input,
  };

  return {
    success: true,
    intent,
    errors,
    warnings,
  };
}

/**
 * Infer target type from the raw target string
 */
function inferTargetType(raw: string): Target {
  // File reference: @filename.ext or just filename.ext
  if (raw.startsWith('@') && raw.includes('.')) {
    return { raw, type: 'file' };
  }

  // Node reference: @node-name
  if (raw.startsWith('@')) {
    return { raw, type: 'node' };
  }

  // Symbol reference: #symbol
  if (raw.startsWith('#')) {
    return { raw, type: 'symbol' };
  }

  // Looks like a file path
  if (raw.includes('.') && /\.(ts|js|py|go|rs|tsx|jsx|json|md|yaml|yml)$/.test(raw)) {
    return { raw, type: 'file' };
  }

  // Looks like a path (has slashes)
  if (raw.includes('/')) {
    return { raw, type: 'new' };  // Probably a category/name pattern
  }

  // Default: could be new or existing, let graph/Claude figure it out
  // Use 'existing' for ch/rm/dx, 'new' for mk
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

/**
 * Debug helper: format intent for display
 */
export function formatIntent(intent: Intent): string {
  const parts: string[] = [];

  if (intent.mode) {
    parts.push(`mode:${intent.mode}`);
  }

  parts.push(`${intent.verb}:${intent.target.raw}`);

  if (intent.additions.length) {
    parts.push(`+[${intent.additions.join(', ')}]`);
  }

  if (intent.exclusions.length) {
    parts.push(`-[${intent.exclusions.join(', ')}]`);
  }

  if (intent.flags.length) {
    const flagStrs = intent.flags.map((f) => f.qualifier ? `${f.type}:${f.qualifier}` : f.type);
    parts.push(`.[${flagStrs.join(', ')}]`);
  }

  if (intent.precision !== 'flexible') {
    parts.push(`precision:${intent.precision}`);
  }

  if (intent.thinking === 'deep') {
    parts.push('~deep');
  }

  if (intent.refs.length) {
    const refStrs = intent.refs.map((r) => {
      const sel = r.selector ? `.${r.selector}` : '';
      return `${r.type}:${r.value}${sel}`;
    });
    parts.push(`refs:[${refStrs.join(', ')}]`);
  }

  if (intent.freeform.length) {
    parts.push(`freeform:[${intent.freeform.join(' ')}]`);
  }

  return parts.join(' | ');
}
