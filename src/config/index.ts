/**
 * Steno-Graph Configuration Module
 *
 * Provides configurable vocabulary for the stenographic parser.
 * Only core vocabulary is included by default.
 *
 * To add domain-specific extensions, use registerExtension():
 * ```typescript
 * import { registerExtension } from 'steno-graph';
 * import { MY_EXTENSION } from './my-extension';
 *
 * registerExtension(MY_EXTENSION);
 * ```
 */

// Types
export type {
  ParserConfig,
  VerbConfig,
  FlagConfig,
  ModeConfig,
  DomainExtension,
  ResolvedVocabulary,
} from './types.js';

// Core vocabulary
export {
  CORE_EXTENSION,
  CORE_VERBS,
  CORE_FLAGS,
  CORE_MODES,
  CODE_VERBS,
  getCoreVerbTokens,
  getCoreFlagTokens,
  getCoreModeTokens,
} from './core.js';

// Vocabulary resolver
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
} from './resolver.js';
