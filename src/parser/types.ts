/**
 * Steno-Graph Parser Types
 *
 * These types define the intermediate representation (IR) produced by the parser.
 * The parser is structural, not semantic—it identifies token types and relationships.
 * Claude handles interpretation of the open vocabulary parts.
 */

// Fixed vocabulary verbs
export const VERBS = ['mk', 'ch', 'rm', 'dx', 'fnd', 'ts', 'doc', 'fork', 'merge', 'revert'] as const;
export type Verb = typeof VERBS[number];

// Fixed vocabulary flags
export const FLAGS = ['ts', 'doc', 'dry', 'web'] as const;
export type FlagType = typeof FLAGS[number];

// Modes
export const MODES = ['plan', 'sketch', 'challenge', 'explore', 'execute'] as const;
export type Mode = typeof MODES[number];

// Precision levels
export type Precision = 'flexible' | 'literal' | 'clarify';

// Thinking depth
export type Thinking = 'normal' | 'deep';

// Target types
export type TargetType = 'new' | 'existing' | 'file' | 'symbol' | 'node';

export interface Target {
  raw: string;
  type: TargetType;
}

// Reference types
export type RefType = 'previous' | 'node' | 'file' | 'symbol';

export interface Reference {
  type: RefType;
  value: string;
  selector?: string;  // For ^2, @node.export, etc.
}

// Flag with optional qualifier
export interface Flag {
  type: FlagType;
  qualifier?: string;  // For .ts:edge, .doc:api, etc.
}

// Token types for internal parsing
export type TokenType =
  | 'VERB_TARGET'
  | 'ADDITION'
  | 'EXCLUSION'
  | 'FLAG'
  | 'DEEP'
  | 'PRECISION'
  | 'MODE'
  | 'PREV_REF'
  | 'NODE_REF'
  | 'FILE_REF'
  | 'SYMBOL_REF'
  | 'QUOTED'
  | 'FREEFORM';

export interface Token {
  type: TokenType;
  value: string;
  raw: string;
  qualifier?: string;
}

// The main Intent object produced by the parser
export interface Intent {
  verb: Verb;
  target: Target;
  additions: string[];
  exclusions: string[];
  flags: Flag[];
  precision: Precision;
  thinking: Thinking;
  mode?: Mode;
  refs: Reference[];
  freeform: string[];
  raw: string;
}

// Parse result with potential errors
export interface ParseResult {
  success: boolean;
  intent?: Intent;
  errors: ParseError[];
  warnings: string[];
}

export interface ParseError {
  message: string;
  position?: number;
  token?: string;
}
