/**
 * Steno-Graph Mapper Module
 *
 * Maps Intent objects to execution strategies:
 * - Direct primitive execution
 * - Claude interpretation
 * - User clarification
 *
 * The mapper requires primitives to be provided by the application.
 * See examples/primitives/ for sample primitive configurations.
 */

// Mapper
export { createMapper, serializeToYAML } from './mapper.js';
export type { StenoMapper } from './mapper.js';

// Registry
export { PrimitiveRegistry, createRegistry } from './registry.js';

// Types
export type {
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
} from './types.js';
