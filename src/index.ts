/**
 * Steno-Graph
 *
 * A generic stenographic parser for structured input.
 * Converts compressed, structured input into typed Intent objects,
 * then maps them to execution strategies.
 *
 * @example Basic parsing
 * ```typescript
 * import { parse } from 'steno-graph';
 *
 * const result = parse('mk:api +auth +cache .ts');
 * if (result.success) {
 *   console.log(result.intent);
 * }
 * ```
 *
 * @example Custom extension
 * ```typescript
 * import { createParser, registerExtension } from 'steno-graph';
 *
 * // Define your extension
 * const myExtension = {
 *   name: 'myapp',
 *   description: 'My application vocabulary',
 *   verbs: [{ token: 'deploy', description: 'Deploy application' }],
 *   flags: [{ token: 'prod', description: 'Production mode', type: 'behavior' }],
 * };
 *
 * // Register it
 * registerExtension(myExtension);
 *
 * // Use it
 * const parser = createParser({ extensions: ['myapp'] });
 * const result = parser.parse('deploy:api .prod');
 * ```
 *
 * @example With mapper
 * ```typescript
 * import { createParser, createMapper } from 'steno-graph';
 *
 * const parser = createParser();
 * const mapper = createMapper({
 *   primitives: [
 *     { name: 'diagnose', verb: 'dx', inputSlots: ['data'] },
 *     { name: 'transform', verb: 'ch', inputSlots: ['data'] },
 *   ],
 * });
 *
 * const parseResult = parser.parse('dx:@data.csv');
 * if (parseResult.success) {
 *   const mapping = mapper.map(parseResult.intent);
 *   if (mapping.type === 'direct') {
 *     console.log('Execute:', mapping.primitive);
 *   }
 * }
 * ```
 */

// ============================================
// PARSER
// ============================================

export {
  parse,
  formatIntent,
  tokenize,
  formatTokens,
  createParser,
} from './parser/index.js';

export type {
  StenoParser,
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
} from './parser/index.js';

export { VERBS, FLAGS, MODES } from './parser/index.js';

// ============================================
// CONFIGURATION
// ============================================

export {
  resolveVocabulary,
  registerExtension,
  unregisterExtension,
  getExtension,
  listExtensions,
  isKnownVerb,
  isKnownFlag,
  isKnownMode,
  resolveVerbAlias,
  getVerbTokens,
  getFlagTokens,
  getModeTokens,
  CORE_EXTENSION,
} from './config/index.js';

export type {
  ParserConfig,
  VerbConfig,
  FlagConfig,
  ModeConfig,
  DomainExtension,
  ResolvedVocabulary,
} from './config/index.js';

// ============================================
// MAPPER
// ============================================

export {
  createMapper,
  serializeToYAML,
  PrimitiveRegistry,
  createRegistry,
} from './mapper/index.js';

export type {
  StenoMapper,
  PrimitiveConfig,
  ParamSpec,
  MapperConfig,
  MappingResult,
  DirectMappingResult,
  ClaudeMappingResult,
  ClarifyMappingResult,
  ErrorMappingResult,
  ResolvedInputs,
  ResolvedParams,
  ClarificationOption,
  PrimitiveYAML,
} from './mapper/index.js';
