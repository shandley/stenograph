/**
 * Steno-Graph Mapper Types
 *
 * Types for mapping Intent objects to executable primitives
 * or routing to Claude/user clarification.
 */

import type { Intent } from '../parser/types.js';

/**
 * Configuration for a primitive in the registry
 */
export interface PrimitiveConfig {
  /** Unique primitive name (e.g., 'diagnose', 'pca', 'tmm') */
  name: string;

  /** Human-readable description */
  description?: string;

  /** Verb that triggers this primitive (e.g., 'dx', 'viz', 'fit') */
  verb: string;

  /** Specific target that triggers this primitive (e.g., 'pca' for 'viz:pca') */
  target?: string;

  /** Additions that trigger this primitive (e.g., ['normalize'] for 'ch:@data +normalize') */
  additions?: string[];

  /** Required input slots (e.g., ['counts'], ['counts', 'metadata']) */
  inputSlots: string[];

  /** Default parameters for this primitive */
  defaultParams?: Record<string, unknown>;

  /** Parameter schema for validation (optional) */
  paramSchema?: Record<string, ParamSpec>;

  /** Category for grouping */
  category?: string;
}

/**
 * Parameter specification for validation
 */
export interface ParamSpec {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required?: boolean;
  default?: unknown;
  enum?: unknown[];
  description?: string;
}

/**
 * Resolved inputs for a primitive
 */
export interface ResolvedInputs {
  /** Slot name to file/node reference */
  [slot: string]: string;
}

/**
 * Resolved parameters for a primitive
 */
export interface ResolvedParams {
  [key: string]: unknown;
}

/**
 * A clarification option presented to the user
 */
export interface ClarificationOption {
  /** Display label */
  label: string;

  /** Primitive name if selected */
  primitive: string;

  /** Description of what this option does */
  description?: string;

  /** Additional params if this option is selected */
  params?: Record<string, unknown>;
}

/**
 * Result of mapping: direct execution
 */
export interface DirectMappingResult {
  type: 'direct';

  /** The primitive to execute */
  primitive: string;

  /** Resolved inputs (slot -> reference) */
  inputs: ResolvedInputs;

  /** Resolved parameters */
  params: ResolvedParams;

  /** The original intent */
  intent: Intent;
}

/**
 * Result of mapping: needs Claude interpretation
 */
export interface ClaudeMappingResult {
  type: 'claude';

  /** Reason why Claude is needed */
  reason: string;

  /** Suggested prompt context for Claude */
  context?: string;

  /** Whether extended thinking is requested */
  thinking: 'normal' | 'deep';

  /** The original intent */
  intent: Intent;
}

/**
 * Result of mapping: needs user clarification
 */
export interface ClarifyMappingResult {
  type: 'clarify';

  /** Question to ask the user */
  question: string;

  /** Available options */
  options: ClarificationOption[];

  /** The original intent */
  intent: Intent;
}

/**
 * Result of mapping: error
 */
export interface ErrorMappingResult {
  type: 'error';

  /** Error message */
  message: string;

  /** The original intent */
  intent: Intent;
}

/**
 * Union of all mapping result types
 */
export type MappingResult =
  | DirectMappingResult
  | ClaudeMappingResult
  | ClarifyMappingResult
  | ErrorMappingResult;

/**
 * Configuration for the mapper
 */
export interface MapperConfig {
  /** Registered primitives */
  primitives: PrimitiveConfig[];

  /** Strict mode: error on unmapped intents (default: false, routes to Claude) */
  strict?: boolean;

  /** Default input slot name when only one reference is provided */
  defaultInputSlot?: string;
}

/**
 * YAML output format for daemon consumption
 */
export interface PrimitiveYAML {
  primitive: string;
  inputs: ResolvedInputs;
  params: ResolvedParams;
}
