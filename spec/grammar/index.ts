/**
 * Steno-Graph Parser
 *
 * Parses stenographic input into structured Intent objects.
 *
 * @example
 * ```typescript
 * import { parse } from 'steno-graph';
 *
 * const result = parse('mk:api +auth +cache .ts');
 * if (result.success) {
 *   console.log(result.intent);
 * }
 * ```
 *
 * @example Using configurable parser
 * ```typescript
 * import { createParser } from 'steno-graph';
 *
 * const parser = createParser({
 *   extensions: ['datascience'],
 *   customVerbs: [{ token: 'analyze', description: 'Custom analysis' }],
 * });
 *
 * const result = parser.parse('viz:pca @counts.csv .plot');
 * ```
 */

// Default parser (uses core vocabulary)
export { parse, formatIntent } from './parser.js';
export { tokenize, formatTokens } from './tokenizer.js';

// Configurable parser factory
export { createParser } from './factory.js';
export type { StenoParser } from './factory.js';

// Types
export type {
  Intent,
  ParseResult,
  ParseError,
  Token,
  TokenType,
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
} from './types.js';
export { VERBS, FLAGS, MODES } from './types.js';
