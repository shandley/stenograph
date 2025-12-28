/**
 * Core Vocabulary Configuration
 *
 * The base vocabulary included in all steno-graph parsers.
 * These are the fundamental verbs, flags, and modes.
 */

import type { VerbConfig, FlagConfig, ModeConfig, DomainExtension } from './types.js';

/**
 * Core verbs - the fundamental operations
 */
export const CORE_VERBS: VerbConfig[] = [
  {
    token: 'mk',
    description: 'Make / create something new',
    category: 'core',
  },
  {
    token: 'ch',
    description: 'Change / modify existing',
    category: 'core',
  },
  {
    token: 'rm',
    description: 'Remove / delete',
    category: 'core',
  },
  {
    token: 'dx',
    description: 'Diagnose / explore / understand',
    category: 'core',
  },
  {
    token: 'fnd',
    description: 'Find / search',
    category: 'core',
  },
  {
    token: 'fork',
    description: 'Branch exploration',
    category: 'core',
  },
  {
    token: 'merge',
    description: 'Join branches',
    category: 'core',
  },
  {
    token: 'revert',
    description: 'Return to prior state',
    category: 'core',
  },
];

/**
 * Code domain verbs
 */
export const CODE_VERBS: VerbConfig[] = [
  {
    token: 'ts',
    description: 'Test',
    category: 'code',
  },
  {
    token: 'doc',
    description: 'Document',
    category: 'code',
  },
];

/**
 * Core flags - fundamental output/behavior modifiers
 */
export const CORE_FLAGS: FlagConfig[] = [
  {
    token: 'ts',
    description: 'TypeScript output',
    type: 'format',
    validQualifiers: ['edge', 'node', 'browser'],
  },
  {
    token: 'doc',
    description: 'Generate documentation',
    type: 'output',
    validQualifiers: ['api', 'user', 'internal'],
  },
  {
    token: 'dry',
    description: 'Dry run - preview without executing',
    type: 'behavior',
  },
  {
    token: 'web',
    description: 'Web-focused output',
    type: 'format',
  },
];

/**
 * Core modes - fundamental operation modes
 */
export const CORE_MODES: ModeConfig[] = [
  {
    token: 'plan',
    description: 'Planning mode - outline approach before executing',
    requiresClaude: true,
  },
  {
    token: 'sketch',
    description: 'Sketch mode - rough implementation for review',
    requiresClaude: true,
  },
  {
    token: 'challenge',
    description: 'Challenge mode - critique and find issues',
    requiresClaude: true,
  },
  {
    token: 'explore',
    description: 'Explore mode - investigate options',
    requiresClaude: true,
  },
  {
    token: 'execute',
    description: 'Execute mode - run immediately',
    requiresClaude: false,
  },
];

/**
 * The core extension (always included by default)
 */
export const CORE_EXTENSION: DomainExtension = {
  name: 'core',
  description: 'Core steno-graph vocabulary',
  verbs: [...CORE_VERBS, ...CODE_VERBS],
  flags: CORE_FLAGS,
  modes: CORE_MODES,
};

/**
 * Get all core verb tokens
 */
export function getCoreVerbTokens(): string[] {
  return CORE_EXTENSION.verbs.map(v => v.token);
}

/**
 * Get all core flag tokens
 */
export function getCoreFlagTokens(): string[] {
  return CORE_FLAGS.map(f => f.token);
}

/**
 * Get all core mode tokens
 */
export function getCoreModeTokens(): string[] {
  return CORE_MODES.map(m => m.token);
}
