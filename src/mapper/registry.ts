/**
 * Steno-Graph Primitive Registry
 *
 * Manages registered primitives and provides lookup functionality.
 */

import type { PrimitiveConfig } from './types.js';

/**
 * Primitive registry for lookup and management
 */
export class PrimitiveRegistry {
  private primitives: Map<string, PrimitiveConfig> = new Map();
  private verbIndex: Map<string, PrimitiveConfig[]> = new Map();
  private verbTargetIndex: Map<string, PrimitiveConfig> = new Map();

  constructor(primitives: PrimitiveConfig[] = []) {
    for (const primitive of primitives) {
      this.register(primitive);
    }
  }

  /**
   * Register a primitive
   */
  register(primitive: PrimitiveConfig): void {
    this.primitives.set(primitive.name, primitive);

    // Index by verb
    const verbPrimitives = this.verbIndex.get(primitive.verb) || [];
    verbPrimitives.push(primitive);
    this.verbIndex.set(primitive.verb, verbPrimitives);

    // Index by verb:target if target is specified
    if (primitive.target) {
      const key = `${primitive.verb}:${primitive.target}`;
      this.verbTargetIndex.set(key, primitive);
    }
  }

  /**
   * Get a primitive by name
   */
  get(name: string): PrimitiveConfig | undefined {
    return this.primitives.get(name);
  }

  /**
   * Find primitives by verb
   */
  findByVerb(verb: string): PrimitiveConfig[] {
    return this.verbIndex.get(verb) || [];
  }

  /**
   * Find primitive by verb and target
   */
  findByVerbTarget(verb: string, target: string): PrimitiveConfig | undefined {
    const key = `${verb}:${target}`;
    return this.verbTargetIndex.get(key);
  }

  /**
   * Find primitive by verb and additions
   */
  findByVerbAdditions(verb: string, additions: string[]): PrimitiveConfig | undefined {
    const verbPrimitives = this.verbIndex.get(verb) || [];

    for (const primitive of verbPrimitives) {
      if (primitive.additions && primitive.additions.length > 0) {
        // Check if all required additions are present
        const hasAllAdditions = primitive.additions.every(a => additions.includes(a));
        if (hasAllAdditions) {
          return primitive;
        }
      }
    }

    return undefined;
  }

  /**
   * Find the best matching primitive for a verb, target, and additions
   */
  findBestMatch(verb: string, target: string, additions: string[]): PrimitiveConfig | undefined {
    // Priority 1: Exact verb:target match
    const exactMatch = this.findByVerbTarget(verb, target);
    if (exactMatch) {
      return exactMatch;
    }

    // Priority 2: Verb + additions match
    const additionMatch = this.findByVerbAdditions(verb, additions);
    if (additionMatch) {
      return additionMatch;
    }

    // Priority 3: Default primitive for verb (no target/additions specified)
    const verbPrimitives = this.findByVerb(verb);
    const defaultPrimitive = verbPrimitives.find(p => !p.target && (!p.additions || p.additions.length === 0));
    if (defaultPrimitive) {
      return defaultPrimitive;
    }

    return undefined;
  }

  /**
   * Get all registered primitives
   */
  all(): PrimitiveConfig[] {
    return Array.from(this.primitives.values());
  }

  /**
   * Get primitives by category
   */
  byCategory(category: string): PrimitiveConfig[] {
    return this.all().filter(p => p.category === category);
  }

  /**
   * Get all categories
   */
  categories(): string[] {
    const cats = new Set<string>();
    for (const p of this.primitives.values()) {
      if (p.category) {
        cats.add(p.category);
      }
    }
    return Array.from(cats);
  }

  /**
   * Check if a primitive exists
   */
  has(name: string): boolean {
    return this.primitives.has(name);
  }

  /**
   * Get count of registered primitives
   */
  get size(): number {
    return this.primitives.size;
  }
}

/**
 * Create a primitive registry from a list of primitives
 */
export function createRegistry(primitives: PrimitiveConfig[]): PrimitiveRegistry {
  return new PrimitiveRegistry(primitives);
}
