/**
 * Steno-Graph Mapper
 *
 * Maps Intent objects to execution strategies:
 * - Direct: Execute primitive immediately
 * - Claude: Route to Claude for interpretation
 * - Clarify: Ask user for clarification
 */

import type { Intent, Reference } from '../parser/types.js';
import type {
  MapperConfig,
  MappingResult,
  DirectMappingResult,
  ClaudeMappingResult,
  ClarifyMappingResult,
  ErrorMappingResult,
  ResolvedInputs,
  ResolvedParams,
  ClarificationOption,
  PrimitiveConfig,
  PrimitiveYAML,
} from './types.js';
import { PrimitiveRegistry, createRegistry } from './registry.js';

/**
 * A configured mapper instance
 */
export interface StenoMapper {
  /**
   * Map an intent to an execution strategy
   */
  map(intent: Intent): MappingResult;

  /**
   * Get the primitive registry
   */
  getRegistry(): PrimitiveRegistry;

  /**
   * Convert a direct mapping result to YAML for daemon consumption
   */
  toYAML(result: DirectMappingResult): PrimitiveYAML;
}

/**
 * Create a mapper with the given configuration
 */
export function createMapper(config: MapperConfig): StenoMapper {
  const registry = createRegistry(config.primitives);
  const strict = config.strict ?? false;
  const defaultInputSlot = config.defaultInputSlot ?? 'data';

  /**
   * Map an intent to an execution strategy
   */
  function map(intent: Intent): MappingResult {
    // Check for explicit clarification request
    if (intent.precision === 'clarify') {
      return handleClarification(intent);
    }

    // Check for mode that requires Claude
    if (intent.mode && ['plan', 'sketch', 'challenge', 'explore'].includes(intent.mode)) {
      return routeToClaude(intent, `Mode '${intent.mode}' requires interpretation`);
    }

    // Check for freeform content that needs interpretation
    if (intent.freeform.length > 0) {
      return routeToClaude(intent, 'Freeform content requires interpretation');
    }

    // Check for deep thinking request
    if (intent.thinking === 'deep') {
      return routeToClaude(intent, 'Extended thinking requested');
    }

    // Try to find a matching primitive
    const targetRaw = intent.target.raw.replace(/^@/, '');
    const primitive = registry.findBestMatch(intent.verb, targetRaw, intent.additions);

    if (primitive) {
      return handleDirectExecution(intent, primitive);
    }

    // No matching primitive found
    if (strict) {
      return {
        type: 'error',
        message: `No primitive found for ${intent.verb}:${intent.target.raw}`,
        intent,
      };
    }

    // Route to Claude for interpretation
    return routeToClaude(intent, `No direct primitive mapping for '${intent.verb}:${intent.target.raw}'`);
  }

  /**
   * Handle direct execution mapping
   */
  function handleDirectExecution(intent: Intent, primitive: PrimitiveConfig): DirectMappingResult {
    const inputs = resolveInputs(intent, primitive);
    const params = resolveParams(intent, primitive);

    return {
      type: 'direct',
      primitive: primitive.name,
      inputs,
      params,
      intent,
    };
  }

  /**
   * Resolve inputs from intent references to primitive input slots
   */
  function resolveInputs(intent: Intent, primitive: PrimitiveConfig): ResolvedInputs {
    const inputs: ResolvedInputs = {};
    const slots = primitive.inputSlots;
    const refs = intent.refs.filter(r => r.type === 'file' || r.type === 'node');

    // If target is a file/node reference, use it as the first input
    if (intent.target.type === 'file' || intent.target.type === 'node') {
      const targetValue = intent.target.raw.replace(/^@/, '');
      if (slots.length > 0) {
        inputs[slots[0]] = targetValue;
      } else {
        inputs[defaultInputSlot] = targetValue;
      }
    }

    // Map remaining references to slots
    let slotIndex = intent.target.type === 'file' || intent.target.type === 'node' ? 1 : 0;
    for (const ref of refs) {
      if (slotIndex < slots.length) {
        inputs[slots[slotIndex]] = ref.value;
        slotIndex++;
      }
    }

    return inputs;
  }

  /**
   * Resolve parameters from intent to primitive params
   */
  function resolveParams(intent: Intent, primitive: PrimitiveConfig): ResolvedParams {
    const params: ResolvedParams = { ...primitive.defaultParams };

    // Map flag qualifiers to params
    for (const flag of intent.flags) {
      if (flag.qualifier) {
        params[flag.type] = flag.qualifier;
      } else {
        params[flag.type] = true;
      }
    }

    // Map additions to params (some additions might be param hints)
    // This is domain-specific and could be extended
    for (const addition of intent.additions) {
      // Check if this addition matches a known param
      if (primitive.paramSchema && primitive.paramSchema[addition]) {
        params[addition] = true;
      }
    }

    return params;
  }

  /**
   * Handle clarification request
   */
  function handleClarification(intent: Intent): ClarifyMappingResult {
    const targetRaw = intent.target.raw.replace(/^@/, '');
    const verbPrimitives = registry.findByVerb(intent.verb);

    // Build options from available primitives for this verb
    const options: ClarificationOption[] = verbPrimitives.map(p => ({
      label: p.name,
      primitive: p.name,
      description: p.description,
    }));

    // If no primitives found, provide generic options
    if (options.length === 0) {
      return {
        type: 'clarify',
        question: `What kind of ${intent.verb} operation do you want for '${targetRaw}'?`,
        options: [
          { label: 'Let Claude decide', primitive: '__claude__', description: 'Route to Claude for interpretation' },
        ],
        intent,
      };
    }

    return {
      type: 'clarify',
      question: `Which ${intent.verb} operation do you want for '${targetRaw}'?`,
      options,
      intent,
    };
  }

  /**
   * Route to Claude for interpretation
   */
  function routeToClaude(intent: Intent, reason: string): ClaudeMappingResult {
    // Build context for Claude
    const contextParts: string[] = [];

    contextParts.push(`Operation: ${intent.verb}:${intent.target.raw}`);

    if (intent.additions.length > 0) {
      contextParts.push(`With: ${intent.additions.join(', ')}`);
    }

    if (intent.exclusions.length > 0) {
      contextParts.push(`Without: ${intent.exclusions.join(', ')}`);
    }

    if (intent.refs.length > 0) {
      const refStrs = intent.refs.map(r => `${r.type}:${r.value}`);
      contextParts.push(`References: ${refStrs.join(', ')}`);
    }

    if (intent.freeform.length > 0) {
      contextParts.push(`Additional: ${intent.freeform.join(' ')}`);
    }

    return {
      type: 'claude',
      reason,
      context: contextParts.join('\n'),
      thinking: intent.thinking,
      intent,
    };
  }

  /**
   * Convert a direct mapping result to YAML
   */
  function toYAML(result: DirectMappingResult): PrimitiveYAML {
    return {
      primitive: result.primitive,
      inputs: result.inputs,
      params: result.params,
    };
  }

  return {
    map,
    getRegistry: () => registry,
    toYAML,
  };
}

/**
 * Serialize a PrimitiveYAML to YAML string
 */
export function serializeToYAML(yaml: PrimitiveYAML): string {
  const lines: string[] = [];

  lines.push(`primitive: ${yaml.primitive}`);

  lines.push('inputs:');
  for (const [slot, value] of Object.entries(yaml.inputs)) {
    lines.push(`  ${slot}: ${value}`);
  }

  lines.push('params:');
  for (const [key, value] of Object.entries(yaml.params)) {
    if (typeof value === 'object') {
      lines.push(`  ${key}: ${JSON.stringify(value)}`);
    } else {
      lines.push(`  ${key}: ${value}`);
    }
  }

  return lines.join('\n');
}
