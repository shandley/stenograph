/**
 * Vocabulary Resolver
 *
 * Merges configuration from core, extensions, and custom additions
 * into a resolved vocabulary for the parser.
 *
 * The extension registry starts with only the core extension.
 * Domain-specific extensions (like datascience) should be registered
 * by the application using registerExtension().
 */

import type {
  ParserConfig,
  VerbConfig,
  FlagConfig,
  ModeConfig,
  DomainExtension,
  ResolvedVocabulary,
} from './types.js';
import { CORE_EXTENSION } from './core.js';

/**
 * Registry of available domain extensions
 * Starts with only core - applications register their own extensions
 */
const EXTENSION_REGISTRY: Record<string, DomainExtension> = {
  core: CORE_EXTENSION,
};

/**
 * Register a domain extension
 *
 * Use this to add custom vocabulary extensions to the parser.
 *
 * @example
 * ```typescript
 * import { registerExtension } from 'steno-graph';
 * import { MY_EXTENSION } from './my-extension';
 *
 * registerExtension(MY_EXTENSION);
 *
 * // Now can use: createParser({ extensions: ['myextension'] })
 * ```
 */
export function registerExtension(extension: DomainExtension): void {
  EXTENSION_REGISTRY[extension.name] = extension;
}

/**
 * Unregister a domain extension
 */
export function unregisterExtension(name: string): boolean {
  if (name === 'core') {
    return false; // Cannot unregister core
  }
  if (EXTENSION_REGISTRY[name]) {
    delete EXTENSION_REGISTRY[name];
    return true;
  }
  return false;
}

/**
 * Get a registered extension by name
 */
export function getExtension(name: string): DomainExtension | undefined {
  return EXTENSION_REGISTRY[name];
}

/**
 * List all registered extension names
 */
export function listExtensions(): string[] {
  return Object.keys(EXTENSION_REGISTRY);
}

/**
 * Resolve a parser configuration into a vocabulary
 */
export function resolveVocabulary(config: ParserConfig = {}): ResolvedVocabulary {
  const verbs = new Map<string, VerbConfig>();
  const flags = new Map<string, FlagConfig>();
  const modes = new Map<string, ModeConfig>();
  const verbAliases = new Map<string, string>();

  // Include core by default
  if (config.includeCore !== false) {
    addExtension(CORE_EXTENSION, verbs, flags, modes, verbAliases);
  }

  // Add requested extensions
  if (config.extensions) {
    for (const extName of config.extensions) {
      const ext = EXTENSION_REGISTRY[extName];
      if (ext) {
        addExtension(ext, verbs, flags, modes, verbAliases);
      } else {
        console.warn(`Unknown extension: ${extName}. Did you forget to call registerExtension()?`);
      }
    }
  }

  // Add custom verbs
  if (config.customVerbs) {
    for (const verb of config.customVerbs) {
      verbs.set(verb.token, verb);
      if (verb.aliasOf) {
        verbAliases.set(verb.token, verb.aliasOf);
      }
    }
  }

  // Add custom flags
  if (config.customFlags) {
    for (const flag of config.customFlags) {
      flags.set(flag.token, flag);
    }
  }

  // Add custom modes
  if (config.customModes) {
    for (const mode of config.customModes) {
      modes.set(mode.token, mode);
    }
  }

  return { verbs, flags, modes, verbAliases };
}

/**
 * Add an extension's vocabulary to the maps
 */
function addExtension(
  extension: DomainExtension,
  verbs: Map<string, VerbConfig>,
  flags: Map<string, FlagConfig>,
  modes: Map<string, ModeConfig>,
  verbAliases: Map<string, string>
): void {
  for (const verb of extension.verbs) {
    verbs.set(verb.token, verb);
    if (verb.aliasOf) {
      verbAliases.set(verb.token, verb.aliasOf);
    }
  }

  for (const flag of extension.flags) {
    flags.set(flag.token, flag);
  }

  if (extension.modes) {
    for (const mode of extension.modes) {
      modes.set(mode.token, mode);
    }
  }
}

/**
 * Check if a token is a known verb
 */
export function isKnownVerb(vocab: ResolvedVocabulary, token: string): boolean {
  return vocab.verbs.has(token) || vocab.verbAliases.has(token);
}

/**
 * Check if a token is a known flag
 */
export function isKnownFlag(vocab: ResolvedVocabulary, token: string): boolean {
  return vocab.flags.has(token);
}

/**
 * Check if a token is a known mode
 */
export function isKnownMode(vocab: ResolvedVocabulary, token: string): boolean {
  return vocab.modes.has(token);
}

/**
 * Resolve a verb alias to its canonical form
 */
export function resolveVerbAlias(vocab: ResolvedVocabulary, token: string): string {
  return vocab.verbAliases.get(token) || token;
}

/**
 * Get all verb tokens from vocabulary
 */
export function getVerbTokens(vocab: ResolvedVocabulary): string[] {
  return Array.from(vocab.verbs.keys());
}

/**
 * Get all flag tokens from vocabulary
 */
export function getFlagTokens(vocab: ResolvedVocabulary): string[] {
  return Array.from(vocab.flags.keys());
}

/**
 * Get all mode tokens from vocabulary
 */
export function getModeTokens(vocab: ResolvedVocabulary): string[] {
  return Array.from(vocab.modes.keys());
}
