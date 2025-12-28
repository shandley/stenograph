/**
 * Steno-Graph Configuration Types
 *
 * These types define how the parser vocabulary can be configured
 * with core verbs/flags, domain extensions, and custom additions.
 */

/**
 * Configuration for a verb in the vocabulary
 */
export interface VerbConfig {
  /** The verb token (e.g., 'mk', 'viz') */
  token: string;

  /** Human-readable description */
  description: string;

  /** Alias to another verb (e.g., 'eda' aliases to 'dx') */
  aliasOf?: string;

  /** Default primitive for direct execution (for mapper phase) */
  defaultPrimitive?: string;

  /** Category for grouping in documentation */
  category?: string;
}

/**
 * Configuration for a flag in the vocabulary
 */
export interface FlagConfig {
  /** The flag token (e.g., 'ts', 'plot') */
  token: string;

  /** Human-readable description */
  description: string;

  /** Flag category */
  type: 'output' | 'behavior' | 'format' | 'custom';

  /** Default qualifier value */
  defaultQualifier?: string;

  /** Valid qualifier values (if restricted) */
  validQualifiers?: string[];
}

/**
 * Configuration for a mode in the vocabulary
 */
export interface ModeConfig {
  /** The mode token (e.g., 'plan', 'sketch') */
  token: string;

  /** Human-readable description */
  description: string;

  /** Whether this mode requires Claude interpretation */
  requiresClaude: boolean;
}

/**
 * A domain extension adds vocabulary for a specific domain
 */
export interface DomainExtension {
  /** Extension name (e.g., 'datascience', 'code') */
  name: string;

  /** Human-readable description */
  description: string;

  /** Additional verbs for this domain */
  verbs: VerbConfig[];

  /** Additional flags for this domain */
  flags: FlagConfig[];

  /** Additional modes for this domain */
  modes?: ModeConfig[];
}

/**
 * Full parser configuration
 */
export interface ParserConfig {
  /** Include core vocabulary (default: true) */
  includeCore?: boolean;

  /** Domain extensions to include */
  extensions?: string[];

  /** Custom verbs to add */
  customVerbs?: VerbConfig[];

  /** Custom flags to add */
  customFlags?: FlagConfig[];

  /** Custom modes to add */
  customModes?: ModeConfig[];

  /** Strict mode: reject unknown tokens (default: false) */
  strict?: boolean;
}

/**
 * Resolved vocabulary after merging config
 */
export interface ResolvedVocabulary {
  /** All available verbs (token -> config) */
  verbs: Map<string, VerbConfig>;

  /** All available flags (token -> config) */
  flags: Map<string, FlagConfig>;

  /** All available modes (token -> config) */
  modes: Map<string, ModeConfig>;

  /** Verb aliases (alias -> canonical) */
  verbAliases: Map<string, string>;
}
