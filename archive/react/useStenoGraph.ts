/**
 * useStenoGraph Hook
 *
 * React hook that provides steno-graph parsing and mapping functionality.
 * Manages parser and mapper instances with configuration.
 *
 * Usage:
 * ```tsx
 * import { registerExtension } from 'steno-graph';
 * import { MY_EXTENSION } from './my-extension';
 * import { MY_PRIMITIVES } from './my-primitives';
 *
 * // Register extension at app startup
 * registerExtension(MY_EXTENSION);
 *
 * // Then use the hook
 * const { parse, map, isReady } = useStenoGraph({
 *   extensions: ['my-extension'],
 *   primitives: MY_PRIMITIVES,
 * });
 * ```
 *
 * Note: This is a mock implementation for demonstration.
 * In production, use the actual steno-graph package.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

// Types (would be imported from steno-graph in real usage)
interface ParserConfig {
  extensions?: string[];
  customVerbs?: Array<{ token: string; description: string }>;
  customFlags?: Array<{ token: string; description: string; type: string }>;
}

interface MapperConfig {
  primitives: PrimitiveConfig[];
  strict?: boolean;
}

interface PrimitiveConfig {
  name: string;
  verb: string;
  target?: string;
  additions?: string[];
  inputSlots: string[];
  defaultParams?: Record<string, unknown>;
  category?: string;
}

interface Intent {
  verb: string;
  target: { raw: string; type: string };
  additions: string[];
  exclusions: string[];
  flags: Array<{ type: string; qualifier?: string }>;
  precision: string;
  thinking: string;
  mode?: string;
  refs: Array<{ type: string; value: string }>;
  freeform: string[];
  raw: string;
}

interface ParseResult {
  success: boolean;
  intent?: Intent;
  errors: Array<{ message: string }>;
  warnings: string[];
}

interface MappingResult {
  type: 'direct' | 'claude' | 'clarify' | 'error';
  primitive?: string;
  inputs?: Record<string, string>;
  params?: Record<string, unknown>;
  reason?: string;
  question?: string;
  options?: Array<{ label: string; primitive: string }>;
  intent?: Intent;
}

/**
 * Hook configuration
 */
export interface UseStenoGraphConfig {
  /** Parser extensions to load */
  extensions?: string[];

  /** Custom verbs */
  customVerbs?: ParserConfig['customVerbs'];

  /** Custom flags */
  customFlags?: ParserConfig['customFlags'];

  /** Primitives for the mapper */
  primitives?: PrimitiveConfig[];

  /** Strict mode for mapper */
  strict?: boolean;
}

/**
 * Hook return type
 */
export interface UseStenoGraphReturn {
  /** Parse steno input */
  parse: (input: string) => ParseResult;

  /** Map intent to execution strategy */
  map: (intent: Intent) => MappingResult;

  /** Parse and map in one step */
  process: (input: string) => {
    parseResult: ParseResult;
    mappingResult: MappingResult | null;
  };

  /** Whether the hook is ready */
  isReady: boolean;

  /** Available verbs */
  verbs: string[];

  /** Available flags */
  flags: string[];

  /** Registered primitives */
  primitives: PrimitiveConfig[];
}

/**
 * useStenoGraph Hook
 *
 * This is a mock implementation. In real usage, it would import
 * from the actual steno-graph package.
 */
export function useStenoGraph(config: UseStenoGraphConfig = {}): UseStenoGraphReturn {
  const [isReady, setIsReady] = useState(false);

  // In real implementation, these would come from steno-graph
  const verbs = useMemo(() => {
    const base = ['mk', 'ch', 'rm', 'dx', 'fnd', 'ts', 'doc', 'fork', 'merge', 'revert'];
    if (config.extensions?.includes('datascience')) {
      base.push('viz', 'fit', 'stat', 'eda', 'normalize', 'filter', 'transform', 'cluster');
    }
    config.customVerbs?.forEach(v => base.push(v.token));
    return base;
  }, [config.extensions, config.customVerbs]);

  const flags = useMemo(() => {
    const base = ['ts', 'doc', 'dry', 'web'];
    if (config.extensions?.includes('datascience')) {
      base.push('plot', 'notebook', 'report', 'scale', 'log', 'center', 'batch');
    }
    config.customFlags?.forEach(f => base.push(f.token));
    return base;
  }, [config.extensions, config.customFlags]);

  const primitives = config.primitives || [];

  // Simulate async initialization
  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 0);
    return () => clearTimeout(timer);
  }, []);

  // Mock parse function
  const parse = useCallback((input: string): ParseResult => {
    // This is a simplified mock - real implementation uses steno-graph
    if (!input.trim()) {
      return { success: false, errors: [{ message: 'Empty input' }], warnings: [] };
    }

    // Basic parsing simulation
    const match = input.match(/^(\w+):(.+?)(?:\s|$)/);
    if (match) {
      const [, verb, target] = match;
      if (verbs.includes(verb)) {
        return {
          success: true,
          intent: {
            verb,
            target: { raw: target, type: 'new' },
            additions: [],
            exclusions: [],
            flags: [],
            precision: 'flexible',
            thinking: 'normal',
            refs: [],
            freeform: [],
            raw: input,
          },
          errors: [],
          warnings: [],
        };
      }
    }

    return {
      success: false,
      errors: [{ message: 'Invalid syntax' }],
      warnings: [],
    };
  }, [verbs]);

  // Mock map function
  const map = useCallback((intent: Intent): MappingResult => {
    // This is a simplified mock - real implementation uses steno-graph mapper
    const primitive = primitives.find(
      p => p.verb === intent.verb && (!p.target || p.target === intent.target.raw)
    );

    if (primitive) {
      return {
        type: 'direct',
        primitive: primitive.name,
        inputs: { [primitive.inputSlots[0] || 'data']: intent.target.raw },
        params: primitive.defaultParams || {},
        intent,
      };
    }

    return {
      type: 'claude',
      reason: 'No matching primitive',
      intent,
    };
  }, [primitives]);

  // Combined process function
  const process = useCallback((input: string) => {
    const parseResult = parse(input);
    const mappingResult = parseResult.success && parseResult.intent
      ? map(parseResult.intent)
      : null;
    return { parseResult, mappingResult };
  }, [parse, map]);

  return {
    parse,
    map,
    process,
    isReady,
    verbs,
    flags,
    primitives,
  };
}

export default useStenoGraph;
