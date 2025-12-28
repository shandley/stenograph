/**
 * Steno-Graph Mapper Tests
 */

import { createMapper, serializeToYAML } from './mapper';
import { createRegistry, PrimitiveRegistry } from './registry';
import { createParser } from '../parser/factory';
import { registerExtension, unregisterExtension } from '../config/resolver';
import type { Intent } from '../parser/types';
import type { DomainExtension } from '../config/types';
import type { PrimitiveConfig, DirectMappingResult, ClaudeMappingResult, ClarifyMappingResult } from './types';

// Test extension with verbs for the test primitives
const TEST_EXTENSION: DomainExtension = {
  name: 'test-mapper',
  description: 'Test extension for mapper tests',
  verbs: [
    { token: 'viz', description: 'Visualization', category: 'test' },
    { token: 'stat', description: 'Statistics', category: 'test' },
    { token: 'fit', description: 'Model fitting', category: 'test' },
  ],
  flags: [],
};

// Test primitives (generic, not domain-specific)
const TEST_PRIMITIVES: PrimitiveConfig[] = [
  {
    name: 'diagnose',
    description: 'Analyze and diagnose data',
    verb: 'dx',
    inputSlots: ['data'],
    category: 'exploration',
  },
  {
    name: 'transform',
    description: 'Transform data',
    verb: 'ch',
    additions: ['normalize'],
    inputSlots: ['data'],
    defaultParams: { method: 'standard' },
    category: 'preprocessing',
  },
  {
    name: 'scatter',
    description: 'Scatter plot visualization',
    verb: 'viz',
    target: 'scatter',
    inputSlots: ['data'],
    defaultParams: { color: 'blue' },
    category: 'visualization',
  },
  {
    name: 'heatmap',
    description: 'Heatmap visualization',
    verb: 'viz',
    target: 'heatmap',
    inputSlots: ['data'],
    defaultParams: { cluster: true },
    category: 'visualization',
  },
  {
    name: 'pca',
    description: 'Principal Component Analysis',
    verb: 'viz',
    target: 'pca',
    inputSlots: ['data'],
    defaultParams: { n_components: 10 },
    category: 'ordination',
  },
  {
    name: 'ttest',
    description: 'Statistical t-test',
    verb: 'stat',
    target: 'ttest',
    inputSlots: ['data', 'groups'],
    defaultParams: { alpha: 0.05 },
    category: 'statistics',
  },
  {
    name: 'linear',
    description: 'Linear regression',
    verb: 'fit',
    target: 'linear',
    inputSlots: ['data', 'target'],
    category: 'modeling',
  },
  {
    name: 'kmeans',
    description: 'K-means clustering',
    verb: 'fit',
    target: 'kmeans',
    inputSlots: ['data'],
    defaultParams: { k: 3 },
    category: 'clustering',
  },
];

// Register test extension
registerExtension(TEST_EXTENSION);

// Create parser with test extension
const parser = createParser({ extensions: ['test-mapper'] });

// Create mapper with test primitives
const mapper = createMapper({
  primitives: TEST_PRIMITIVES,
});

// Clean up after all tests
afterAll(() => {
  unregisterExtension('test-mapper');
});

describe('PrimitiveRegistry', () => {
  test('registers and retrieves primitives', () => {
    const registry = createRegistry(TEST_PRIMITIVES);

    expect(registry.has('diagnose')).toBe(true);
    expect(registry.has('pca')).toBe(true);
    expect(registry.has('unknown')).toBe(false);

    const pca = registry.get('pca');
    expect(pca?.name).toBe('pca');
    expect(pca?.verb).toBe('viz');
    expect(pca?.target).toBe('pca');
  });

  test('finds primitives by verb', () => {
    const registry = createRegistry(TEST_PRIMITIVES);

    const vizPrimitives = registry.findByVerb('viz');
    expect(vizPrimitives.length).toBeGreaterThan(0);
    expect(vizPrimitives.map(p => p.name)).toContain('pca');
    expect(vizPrimitives.map(p => p.name)).toContain('scatter');
  });

  test('finds primitive by verb:target', () => {
    const registry = createRegistry(TEST_PRIMITIVES);

    const pca = registry.findByVerbTarget('viz', 'pca');
    expect(pca?.name).toBe('pca');

    const heatmap = registry.findByVerbTarget('viz', 'heatmap');
    expect(heatmap?.name).toBe('heatmap');
  });

  test('finds primitive by verb and additions', () => {
    const registry = createRegistry(TEST_PRIMITIVES);

    // 'ch +normalize' should match 'transform'
    const transform = registry.findByVerbAdditions('ch', ['normalize']);
    expect(transform?.name).toBe('transform');
  });

  test('finds best match with priority', () => {
    const registry = createRegistry(TEST_PRIMITIVES);

    // Exact verb:target match takes priority
    const pca = registry.findBestMatch('viz', 'pca', []);
    expect(pca?.name).toBe('pca');

    // Addition match when no exact target
    const transform = registry.findBestMatch('ch', 'data', ['normalize']);
    expect(transform?.name).toBe('transform');
  });

  test('lists categories', () => {
    const registry = createRegistry(TEST_PRIMITIVES);
    const categories = registry.categories();

    expect(categories).toContain('visualization');
    expect(categories).toContain('statistics');
  });

  test('filters by category', () => {
    const registry = createRegistry(TEST_PRIMITIVES);

    const viz = registry.byCategory('visualization');
    expect(viz.map(p => p.name)).toContain('scatter');
    expect(viz.map(p => p.name)).toContain('heatmap');
  });
});

describe('Mapper - Direct Execution', () => {
  test('maps dx:@file.csv to diagnose primitive', () => {
    const result = parser.parse('dx:@data.csv');
    expect(result.success).toBe(true);

    const mapping = mapper.map(result.intent!);
    expect(mapping.type).toBe('direct');

    const direct = mapping as DirectMappingResult;
    expect(direct.primitive).toBe('diagnose');
    expect(direct.inputs.data).toBe('data.csv');
  });

  test('maps viz:pca to pca primitive', () => {
    const result = parser.parse('viz:pca @data.csv');
    expect(result.success).toBe(true);

    const mapping = mapper.map(result.intent!);
    expect(mapping.type).toBe('direct');

    const direct = mapping as DirectMappingResult;
    expect(direct.primitive).toBe('pca');
    expect(direct.inputs.data).toBe('data.csv');
    expect(direct.params.n_components).toBe(10);
  });

  test('maps viz:heatmap with defaults', () => {
    const result = parser.parse('viz:heatmap @data.csv');
    expect(result.success).toBe(true);

    const mapping = mapper.map(result.intent!);
    expect(mapping.type).toBe('direct');

    const direct = mapping as DirectMappingResult;
    expect(direct.primitive).toBe('heatmap');
    expect(direct.params.cluster).toBe(true);
  });

  test('maps stat:ttest with multiple inputs', () => {
    const result = parser.parse('stat:ttest @data.csv @groups.csv');
    expect(result.success).toBe(true);

    const mapping = mapper.map(result.intent!);
    expect(mapping.type).toBe('direct');

    const direct = mapping as DirectMappingResult;
    expect(direct.primitive).toBe('ttest');
    expect(direct.inputs.data).toBe('data.csv');
    expect(direct.inputs.groups).toBe('groups.csv');
  });

  test('maps ch:@data +normalize to transform', () => {
    const result = parser.parse('ch:@data.csv +normalize');
    expect(result.success).toBe(true);

    const mapping = mapper.map(result.intent!);
    expect(mapping.type).toBe('direct');

    const direct = mapping as DirectMappingResult;
    expect(direct.primitive).toBe('transform');
  });

  test('includes flag qualifiers in params', () => {
    const result = parser.parse('viz:pca @data.csv .ts:edge');
    expect(result.success).toBe(true);

    const mapping = mapper.map(result.intent!);
    expect(mapping.type).toBe('direct');

    const direct = mapping as DirectMappingResult;
    expect(direct.params.ts).toBe('edge');
  });
});

describe('Mapper - Claude Routing', () => {
  test('routes ?plan mode to Claude', () => {
    const result = parser.parse('?plan api-design');
    expect(result.success).toBe(true);

    const mapping = mapper.map(result.intent!);
    expect(mapping.type).toBe('claude');

    const claude = mapping as ClaudeMappingResult;
    expect(claude.reason).toContain('plan');
  });

  test('routes freeform content to Claude', () => {
    const result = parser.parse('ch:@data.csv fix the issues');
    expect(result.success).toBe(true);

    const mapping = mapper.map(result.intent!);
    expect(mapping.type).toBe('claude');

    const claude = mapping as ClaudeMappingResult;
    expect(claude.reason).toContain('Freeform');
    expect(claude.context).toContain('issues');
  });

  test('routes ~deep thinking to Claude', () => {
    const result = parser.parse('dx:@data.csv ~deep');
    expect(result.success).toBe(true);

    const mapping = mapper.map(result.intent!);
    expect(mapping.type).toBe('claude');

    const claude = mapping as ClaudeMappingResult;
    expect(claude.thinking).toBe('deep');
  });

  test('routes unknown primitive to Claude', () => {
    const result = parser.parse('mk:something-new');
    expect(result.success).toBe(true);

    const mapping = mapper.map(result.intent!);
    expect(mapping.type).toBe('claude');

    const claude = mapping as ClaudeMappingResult;
    expect(claude.reason).toContain('No direct primitive');
  });

  test('includes context in Claude routing', () => {
    const result = parser.parse('ch:@data.csv +transform -outliers');
    expect(result.success).toBe(true);

    const mapping = mapper.map(result.intent!);
    expect(mapping.type).toBe('claude');

    const claude = mapping as ClaudeMappingResult;
    expect(claude.context).toContain('transform');
    expect(claude.context).toContain('outliers');
  });
});

describe('Mapper - Clarification', () => {
  test('handles explicit clarification request', () => {
    const result = parser.parse('fit:model? @data.csv');
    expect(result.success).toBe(true);

    const mapping = mapper.map(result.intent!);
    expect(mapping.type).toBe('clarify');

    const clarify = mapping as ClarifyMappingResult;
    expect(clarify.question).toContain('fit');
    expect(clarify.options.length).toBeGreaterThan(0);
  });

  test('provides options for verb', () => {
    const result = parser.parse('viz:?');
    expect(result.success).toBe(true);

    const mapping = mapper.map(result.intent!);
    expect(mapping.type).toBe('clarify');

    const clarify = mapping as ClarifyMappingResult;
    const primitiveNames = clarify.options.map(o => o.primitive);
    expect(primitiveNames).toContain('pca');
    expect(primitiveNames).toContain('scatter');
    expect(primitiveNames).toContain('heatmap');
  });
});

describe('Mapper - Strict Mode', () => {
  test('returns error for unknown primitive in strict mode', () => {
    const strictMapper = createMapper({
      primitives: TEST_PRIMITIVES,
      strict: true,
    });

    const result = parser.parse('mk:something-unknown');
    expect(result.success).toBe(true);

    const mapping = strictMapper.map(result.intent!);
    expect(mapping.type).toBe('error');
    expect(mapping.intent).toBeDefined();
  });
});

describe('YAML Serialization', () => {
  test('serializes direct mapping to YAML', () => {
    const result = parser.parse('viz:pca @data.csv');
    expect(result.success).toBe(true);

    const mapping = mapper.map(result.intent!);
    expect(mapping.type).toBe('direct');

    const yaml = mapper.toYAML(mapping as DirectMappingResult);
    expect(yaml.primitive).toBe('pca');
    expect(yaml.inputs.data).toBe('data.csv');
    expect(yaml.params.n_components).toBe(10);

    const yamlString = serializeToYAML(yaml);
    expect(yamlString).toContain('primitive: pca');
    expect(yamlString).toContain('data: data.csv');
  });

  test('serializes complex params', () => {
    const result = parser.parse('stat:ttest @data.csv @groups.csv');
    expect(result.success).toBe(true);

    const mapping = mapper.map(result.intent!);
    const yaml = mapper.toYAML(mapping as DirectMappingResult);

    const yamlString = serializeToYAML(yaml);
    expect(yamlString).toContain('primitive: ttest');
    expect(yamlString).toContain('alpha: 0.05');
  });
});

describe('End-to-End Examples', () => {
  test('complete workflow', () => {
    // Step 1: Diagnose data
    let result = parser.parse('dx:@data.csv');
    let mapping = mapper.map(result.intent!);
    expect(mapping.type).toBe('direct');
    expect((mapping as DirectMappingResult).primitive).toBe('diagnose');

    // Step 2: Transform
    result = parser.parse('ch:@data.csv +normalize');
    mapping = mapper.map(result.intent!);
    expect(mapping.type).toBe('direct');
    expect((mapping as DirectMappingResult).primitive).toBe('transform');

    // Step 3: Visualize
    result = parser.parse('viz:pca @normalized.csv');
    mapping = mapper.map(result.intent!);
    expect(mapping.type).toBe('direct');
    expect((mapping as DirectMappingResult).primitive).toBe('pca');

    // Step 4: Statistical test
    result = parser.parse('stat:ttest @data.csv @groups.csv');
    mapping = mapper.map(result.intent!);
    expect(mapping.type).toBe('direct');
    expect((mapping as DirectMappingResult).primitive).toBe('ttest');
  });

  test('mixed workflow with Claude routing', () => {
    // Direct execution
    let result = parser.parse('dx:@data.csv');
    let mapping = mapper.map(result.intent!);
    expect(mapping.type).toBe('direct');

    // Claude interpretation
    result = parser.parse('?plan data-pipeline');
    mapping = mapper.map(result.intent!);
    expect(mapping.type).toBe('claude');

    // Clarification
    result = parser.parse('fit:model? @data.csv');
    mapping = mapper.map(result.intent!);
    expect(mapping.type).toBe('clarify');

    // Back to direct
    result = parser.parse('viz:heatmap @data.csv');
    mapping = mapper.map(result.intent!);
    expect(mapping.type).toBe('direct');
  });
});
